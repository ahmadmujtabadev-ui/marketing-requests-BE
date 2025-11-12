import { Router } from 'express';
import {
  getRequests,
  getRequest,
  createRequest,
  updateRequestStatus,
  uploadCompletedFile,
  deleteRequestFile,
  updateRequestNotes,
  getRequestStats
} from '../controllers/request.js';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// All authenticated users can view their relevant requests
router.get('/', authRequired, getRequests);
router.get('/stats', authRequired, getRequestStats);
router.get('/:id', authRequired, getRequest);

// Agent-only routes - Submit requests
router.post('/', authRequired, createRequest);
router.put('/:id/notes', authRequired, updateRequestNotes);

// VA/Admin routes - Manage requests
router.put('/:id/status', requireRole, requireRole(['va', 'admin']), updateRequestStatus);
router.post('/:id/files', requireRole, requireRole(['va', 'admin']), uploadCompletedFile);
router.delete('/:id/files/:fileId', requireRole , requireRole(['va', 'admin']), deleteRequestFile);

export default router;