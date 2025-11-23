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

router.get('/', authRequired, getRequests);
router.get('/stats', authRequired, getRequestStats);
router.get('/:id', authRequired, getRequest);

router.post('/', authRequired,createRequest);

router.put('/:id/status', authRequired, updateRequestStatus);
router.post('/:id/files', authRequired, uploadCompletedFile);
router.delete('/:id/files/:fileId', authRequired , deleteRequestFile);

export default router;