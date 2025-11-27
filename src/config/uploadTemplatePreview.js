// src/middleware/requestUpload.js
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

// Allow ANY file type (images, videos, pdf, docs, etc.)
const requestFileFilter = (req, file, cb) => {
  // If you want to restrict to some types, you can do it here.
  // For now, allow everything:
  cb(null, true);
};

export const templateUpload = multer({
  storage: multerS3({
    s3,
    bucket: ENV.AWS_S3_TEMPLATES_BUCKET, // same bucket as templates
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key(req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const fileName = `${base}-${Date.now()}${ext}`;
      // store in a different folder so it's separated from template previews
      cb(null, `requests/${fileName}`);
    },
  }),
  fileFilter: requestFileFilter,
  limits: {
    // increase if you want larger files
    fileSize: 20 * 1024 * 1024, // 20 MB per file
  },
});
