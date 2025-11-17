import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCategories
} from '../controllers/template.js';
import { requireRole } from '../middleware/roles.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Public/Authenticated routes - All users can view templates
router.get('/', getTemplates);
router.get('/categories', authRequired, getCategories);
router.get('/:id', authRequired, getTemplate);

// Admin-only routes - Only admins can manage templates
router.post('/', authRequired, createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', requireRole(['admin']), deleteTemplate);

export default router;