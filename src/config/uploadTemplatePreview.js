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
  // Optional: Add specific restrictions if needed
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`), false);
  }
};

export const templateUpload = multer({
  storage: multerS3({
    s3,
    bucket: ENV.AWS_S3_TEMPLATES_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key(req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const sanitizedBase = base.replace(/[^a-zA-Z0-9-_]/g, '_');
      const fileName = `${sanitizedBase}-${Date.now()}${ext}`;
      cb(null, `requests/${fileName}`);
    },
    metadata(req, file, cb) {
      cb(null, {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      });
    }
  }),
  fileFilter: requestFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 20 MB per file
    files: 10, // Maximum 10 files per request
  },
});

// Error handler middleware for multer errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 25MB limit',
        error: err.message
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 files allowed',
        error: err.message
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Unknown upload error'
    });
  }
  
  next();
};