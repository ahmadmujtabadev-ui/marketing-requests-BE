import multer from "multer";
import fs from "fs";
import path from "path";

// In serverless (Vercel / Lambda etc.), /tmp is the only writable dir
const BASE_UPLOAD_DIR = "/tmp";

// Folder where you want template previews stored
const TEMPLATE_UPLOAD_DIR = path.join(BASE_UPLOAD_DIR, "uploads", "templates");

// Ensure directory exists (ignore error if cannot create in read-only env)
try {
  fs.mkdirSync(TEMPLATE_UPLOAD_DIR, { recursive: true });
} catch (err) {
  console.error("Failed to create upload dir:", err);
}

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
