import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCategories,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  createCategory,
  createTemplatesBulk
} from '../controllers/template.js';
import { authRequired } from '../middleware/auth.js';
import { templateUpload } from '../config/uploadTemplatePreview.js';

const router = Router();

router.get('/', authRequired, getTemplates);
router.get('/categories', authRequired, getAllCategories);
router.get('/:id', authRequired, getTemplate);

// router.post('/',
//   uploadTemplatePreview.single("previewUrl"),
//   authRequired, createTemplate);

// routes/templates.ts
router.post(
  "/bulk",
  templateUpload.array("previewUrl", 200),
  createTemplatesBulk
);

router.put(
  "/:id",
  templateUpload.single("previewUrl"),
  updateTemplate
);

router.delete('/:id', deleteTemplate);
// Public routes (or agent-accessible)
router.get('/categories', getAllCategories);
router.get('/:id', getCategoryById);

// Admin-only routes
router.post('/categories', authRequired, createCategory);
router.put('/:id', authRequired, updateCategory);
router.delete('/:id',authRequired, deleteCategory);

export default router;