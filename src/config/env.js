import 'dotenv/config';

const required = (v, key) => {
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  BASE_URL: "http://localhost:5000",

  // Do NOT hardcode secrets/keys here. Keep them in env.
  DATABASE_URL: required(
    process.env.DATABASE_URL /* or process.env.PRISMA_DATABASE_URL */,
    'DATABASE_URL'
  ),

  // JWT secrets (separate for access/refresh)
  JWT_ACCESS_SECRET: required(
    process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET,
    'JWT_ACCESS_SECRET' || "pa123"
  ),
  JWT_REFRESH_SECRET: required(
    process.env.JWT_REFRESH_SECRET ?? process.env.REFRESH_SECRET ?? process.env.JWT_SECRET,
    'JWT_REFRESH_SECRET' || "123"
  ),

  // Token lifetimes
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL ?? process.env.JWT_EXPIRES_IN ?? '12h',
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL ?? process.env.REFRESH_EXPIRES_IN ?? '7d',
};
