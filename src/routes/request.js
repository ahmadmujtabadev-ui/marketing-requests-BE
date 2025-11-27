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
import { templateUpload } from '../config/uploadTemplatePreview.js';

const router = Router();

router.get('/', authRequired, getRequests);
router.get('/stats', authRequired, getRequestStats);
router.get('/:id', getRequest);

router.post(
  '/',
  authRequired,
  templateUpload.array('files', 20), // field name "files" matches formData.append('files', ...)
  createRequest
);

router.put('/:id/status', authRequired, updateRequestStatus);
router.post(
  "/:id/files",
  authRequired,
  templateUpload.single("file"), // <— IMPORTANT: field name "file"
  uploadCompletedFile
);
router.delete('/:id/files/:fileId', authRequired , deleteRequestFile);

export default router;