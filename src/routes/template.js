import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCategories
} from '../controllers/template.js';
import { authRequired } from '../middleware/auth.js';
import { uploadTemplatePreview } from '../config/uploadTemplatePreview.js';

const router = Router();

// Public/Authenticated routes - All users can view templates
router.get('/', getTemplates);
router.get('/categories', authRequired, getCategories);
router.get('/:id', authRequired, getTemplate);

// Admin-only routes - Only admins can manage templates
router.post('/',
  uploadTemplatePreview.single("previewUrl"),

  authRequired, createTemplate);

router.put(
  "/:id",
  uploadTemplatePreview.single("previewUrl"),
  updateTemplate
);
router.delete('/:id', deleteTemplate);

export default router;