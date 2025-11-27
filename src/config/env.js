import "dotenv/config";

const required = (v, key) => {
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),

  BASE_URL: process.env.BASE_URL ?? "https://marketing-requests-be.vercel.app",

  DATABASE_URL: required(process.env.DATABASE_URL, "DATABASE_URL"),

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

  JWT_ACCESS_TTL:
    process.env.JWT_ACCESS_TTL ?? process.env.JWT_EXPIRES_IN ?? "12h",
  JWT_REFRESH_TTL:
    process.env.JWT_REFRESH_TTL ??
    process.env.REFRESH_EXPIRES_IN ??
    "7d",

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

  // ───────── EMAIL CONFIG (for Nodemailer + Gmail) ─────────
  MAIL_USER: required(process.env.MAIL_USER, "MAIL_USER"),
  MAIL_PASS: required(process.env.MAIL_PASS, "MAIL_PASS"),

  // Admin notification email(s)
  MARKETING_ADMIN_EMAIL: process.env.MARKETING_ADMIN_EMAIL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
};
