import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCategories,
  createTemplatesBulk
} from '../controllers/template.js';
import { authRequired } from '../middleware/auth.js';
import { templateUpload } from '../config/uploadTemplatePreview.js';

const router = Router();

router.get('/', authRequired, getTemplates);
router.get('/categories', authRequired, getCategories);
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

export default router;