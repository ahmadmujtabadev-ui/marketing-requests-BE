import express from 'express';
import userRoutes from './user.js';
import requestRoutes from './request.js';
import adminRoutes from './admin.js';
import templateRoutes from './template.js'
import statsRoutes from './stats.js'


const router = express.Router();

router.use('/api/user', userRoutes);
router.use('/api/request', requestRoutes);
router.use('/api/template', templateRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/stats', statsRoutes);


export default router;
