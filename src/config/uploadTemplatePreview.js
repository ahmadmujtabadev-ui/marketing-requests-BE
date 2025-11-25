// src/middleware/templateUpload.js
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { S3Client } from "@aws-sdk/client-s3";
import { ENV } from "../config/env.js";

const s3 = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
};

export const templateUpload = multer({
  storage: multerS3({
    s3,
    bucket: ENV.AWS_S3_TEMPLATES_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key(req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const fileName = `${base}-${Date.now()}${ext}`;
      cb(null, `templates/${fileName}`);
    },
  }),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
