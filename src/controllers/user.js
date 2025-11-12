import { PrismaClient } from "../generated/client/index.js";
import { signTokens } from "../middleware/auth.js";
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function toPublicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt || null,
    twoFactorEnabled: u.twoFactorEnabled ?? false,
  };
}

function ok(res, data = {}, message = 'OK') {
  return res.status(200).json({ message, ...data });
}
function created(res, data = {}, message = 'Created') {
  return res.status(201).json({ message, ...data });
}
function bad(res, msg = 'Bad request', code = 400) {
  return res.status(code).json({ error: msg });
}

export async function register(req, res) {
  const { name, email, password, role = 'agent' } = req.body || {};
  if (!email || !password) return bad(res, 'Email and password are required');
  console.log('DB:', (process.env.DATABASE_URL || '').replace(/:\/\/.*@/, '://***@'));

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return bad(res, 'Email already registered', 409);

  const passwordHash = await bcrypt.hash(String(password), 12);

  const user = await prisma.user.create({
    data: { name: name || email.split('@')[0], email, passwordHash, role, isActive: true },
  });

  const tokens = signTokens(user);
  return created(res, { user: toPublicUser(user), ...tokens }, 'Signup processed');
}

// POST /api/auth/login
// POST /api/auth/login
export async function login(req, res) {

  const { email, password } = req.body || {};
  if (!email || !password) return bad(res, 'Email and password are required');

  // minimal fields needed for auth + audit
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isActive: true,
      passwordHash: true,
    },
  });

  if (!user || !user.isActive) return bad(res, 'Invalid credentials', 401);

  const okPw = await bcrypt.compare(String(password), user.passwordHash);
  if (!okPw) return bad(res, 'Invalid credentials', 401);

  const tokens = signTokens(user); // you already have user; no need to re-fetch
  return ok(res, { user: toPublicUser(user), ...tokens }, 'Login processed');
}


// POST /api/auth/refresh
export async function refresh(req, res) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return bad(res, 'Missing refreshToken');

  try {
    const payload = verifyRefresh(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return bad(res, 'Invalid token', 401);
    const tokens = signTokens(user);
    return ok(res, tokens, 'Token refreshed');
  } catch {
    return bad(res, 'Invalid token', 401);
  }
}

// GET /api/auth/me   (requires auth middleware that sets req.user)
export async function me(req, res) {
  const userId = req.user?.sub;
  if (!userId) return bad(res, 'Unauthorized', 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return bad(res, 'User not found', 404);
  return ok(res, { user: toPublicUser(user) });
}

// POST /api/auth/forgot-password
export async function forgotPassword(req, res) {
  const { email } = req.body || {};
  if (!email) return bad(res, 'Email required');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // do not reveal existence
    return ok(res, {}, 'If the email exists, a reset link has been sent.');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetTokenHash: hash, passwordResetExpires: expires },
  });

  // TODO: send email with link containing ?token=<rawToken>
  const response =
    process.env.NODE_ENV === 'development'
      ? { devToken: rawToken }
      : {};

  return ok(res, response, 'If the email exists, a reset link has been sent.');
}

// POST /api/auth/reset-password
export async function resetPassword(req, res) {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return bad(res, 'Token and newPassword required');

  const hash = crypto.createHash('sha256').update(String(token)).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hash,
      passwordResetExpires: { gt: new Date() },
    },
  });
  if (!user) return bad(res, 'Invalid or expired reset token', 400);

  const passwordHash = await bcrypt.hash(String(newPassword), 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    },
  });

  return ok(res, {}, 'Password reset');
}

// POST /api/auth/change-password   (auth required)
export async function changePassword(req, res) {
  const userId = req.user?.sub;
  if (!userId) return bad(res, 'Unauthorized', 401);

  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return bad(res, 'oldPassword and newPassword required');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return bad(res, 'User not found', 404);

  const okPw = await bcrypt.compare(String(oldPassword), user.passwordHash);
  if (!okPw) return bad(res, 'Old password incorrect', 400);

  const passwordHash = await bcrypt.hash(String(newPassword), 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return ok(res, {}, 'Password changed');
}

// POST /api/auth/toggle-2fa   (auth required)  -> requires twoFactorEnabled column
export async function toggle2FA(req, res) {
  const userId = req.user?.sub;
  if (!userId) return bad(res, 'Unauthorized', 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return bad(res, 'User not found', 404);

  const next = !(user.twoFactorEnabled ?? false);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: next },
  });

  return ok(res, { twoFactorEnabled: updated.twoFactorEnabled }, '2FA flag toggled');
}

// ---- exports ---------------------------------------------------------------

