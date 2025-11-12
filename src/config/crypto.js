// src/config/crypto.js
import crypto from 'node:crypto';

const ALG = 'aes-256-gcm';
const IV_LEN = 12;          // recommended for GCM
const TAG_LEN = 16;         // GCM tag length

function getKey() {
  const raw = process.env.SECRET_KEY || process.env.MASTER_KEY_HEX || '';
  if (!raw) {
    throw new Error('SECRET_KEY (or ENCRYPTION_KEY) is not set');
  }

  // 64 hex chars -> 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  // base64 -> 32 bytes
  try {
    const b = Buffer.from(raw, 'base64');
    if (b.length === 32) return b;
  } catch { /* ignore and derive */ }

  // passphrase -> derive 32 bytes
  return crypto.scryptSync(raw, 'cred-salt', 32);
}

export function encryptSecret(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, key, iv);

  const ct = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // store iv|tag|ciphertext in base64
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decryptSecret(payload) {
  const key = getKey();
  const raw = Buffer.from(payload, 'base64');

  const iv  = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct  = raw.subarray(IV_LEN + TAG_LEN);

  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);

  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

/**
 * Deterministic fingerprint for an API key (lowercase hex SHA-256).
 * Store the full hash or slice as you prefer.
 */
export function fingerprint(apiKey) {
  return crypto.createHash('sha256').update(String(apiKey)).digest('hex');
}

/**
 * Return last4 and a masked string like "••••-••••-••••-1234"
 */
export function maskKeyLast4(key) {
  const str = String(key ?? '');
  const last4 = str.slice(-4) || '????';

  // produce groups of 4 with bullets, keep last 4 visible
  const groups = Math.max(4, Math.ceil(Math.max(0, str.length) / 4));
  const maskedGroups = Array.from({ length: groups - 1 }, () => '••••').join('-');
  const masked = `${maskedGroups}-${last4}`;
  return { last4, masked };
}
