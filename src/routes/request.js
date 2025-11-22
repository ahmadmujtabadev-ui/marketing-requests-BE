import { Router } from 'express';
import {
  getRequests,
  getRequest,
  createRequest,
  updateRequestStatus,
  uploadCompletedFile,
  deleteRequestFile,
  getRequestStats
} from '../controllers/request.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// All authenticated users can view their relevant requests
router.get('/', authRequired, getRequests);
router.get('/stats', authRequired, getRequestStats);
router.get('/:id', authRequired, getRequest);

// Agent-only routes - Submit requests
router.post('/', authRequired,createRequest);
// router.put('/:id/notes', authRequired, updateRequestNotes);

// VA/Admin routes - Manage requests
router.put('/:id/status', authRequired, updateRequestStatus);
router.post('/:id/files', authRequired, uploadCompletedFile);
router.delete('/:id/files/:fileId', authRequired , deleteRequestFile);

export default router;