// src/config/uploadTemplatePreview.js
import multer from "multer";
import fs from "fs";
import path from "path";

// Folder where you want template previews stored (relative to project root)
const TEMPLATE_UPLOAD_DIR = path.join(process.cwd(), "uploads", "templates");

// Ensure directory exists
fs.mkdirSync(TEMPLATE_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, TEMPLATE_UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
};

export const uploadTemplatePreview = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
