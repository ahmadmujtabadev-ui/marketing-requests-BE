// src/routes/stats.js
import express from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  getOverview,
  getUserStats,
  getTemplateStats,
  getRequestStats
} from '../controllers/stats.js';

const router = express.Router();

router.use(authRequired);

router.get('/view', getOverview);

router.get('/users', getUserStats);

router.get('/templates', getTemplateStats);

router.get('/requests', getRequestStats);

export default router;