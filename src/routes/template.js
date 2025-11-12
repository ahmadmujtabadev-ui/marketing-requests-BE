import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCategories
} from '../controllers/template.js';
import {   authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// Public/Authenticated routes - All users can view templates
router.get('/', authRequired, getTemplates);
router.get('/categories', authRequired, getCategories);
router.get('/:id', authRequired, getTemplate);

// Admin-only routes - Only admins can manage templates
router.post('/', authRequired, createTemplate);
router.put('/:id', requireRole(['admin']), updateTemplate);
router.delete('/:id', requireRole(['admin']), deleteTemplate);

export default router;