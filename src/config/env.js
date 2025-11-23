import "dotenv/config";

const required = (v) => {
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),

  // If you want this dynamic, you can also move it to env later
  BASE_URL: process.env.BASE_URL ?? "https://marketing-requests-be.vercel.app",

  // Database
  DATABASE_URL: required(
    process.env.DATABASE_URL /* or process.env.PRISMA_DATABASE_URL */,
    "DATABASE_URL"
  ),

  // JWT secrets (separate for access/refresh)
  JWT_ACCESS_SECRET: required(
    process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET,
    "JWT_ACCESS_SECRET"
  ),
  JWT_REFRESH_SECRET: required(
    process.env.JWT_REFRESH_SECRET ??
      process.env.REFRESH_SECRET ??
      process.env.JWT_SECRET,
    "JWT_REFRESH_SECRET"
  ),

  // Token lifetimes
  JWT_ACCESS_TTL:
    process.env.JWT_ACCESS_TTL ?? process.env.JWT_EXPIRES_IN ?? "12h",
  JWT_REFRESH_TTL:
    process.env.JWT_REFRESH_TTL ??
    process.env.REFRESH_EXPIRES_IN ??
    "7d",

  // AWS / S3 for template previews
  AWS_REGION: required(process.env.AWS_REGION, "AWS_REGION"),
  AWS_ACCESS_KEY_ID: required(
    process.env.AWS_ACCESS_KEY_ID,
    "AWS_ACCESS_KEY_ID"
  ),
  AWS_SECRET_ACCESS_KEY: required(
    process.env.AWS_SECRET_ACCESS_KEY,
    "AWS_SECRET_ACCESS_KEY"
  ),
  AWS_S3_TEMPLATES_BUCKET: required(
    process.env.AWS_S3_TEMPLATES_BUCKET,
    "AWS_S3_TEMPLATES_BUCKET"
  ),
};
