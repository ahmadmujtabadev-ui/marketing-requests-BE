import jwt from 'jsonwebtoken';
import { unauthorized } from '../utils/http.js';
import { ENV } from '../config/env.js';

export function signTokens(payload) {
  const access  = jwt.sign(payload, ENV.JWT_ACCESS_SECRET,  { expiresIn: ENV.JWT_ACCESS_TTL  });
  const refresh = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: ENV.JWT_REFRESH_TTL });
  return { access, refresh };
}

export function authRequired(req, res, next) {
  const auth = req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return unauthorized(res, 'Missing token');

  try {
    // Verify with the SAME secret used to sign the access token
    req.user = jwt.verify(token, ENV.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    next();
  } catch (err) {
    return unauthorized(res, 'Invalid token');
  }
}
