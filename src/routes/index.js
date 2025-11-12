import express from 'express';
import userRoutes from './user.js';
import requestRoutes from './request.js';
import templateRoutes from './template.js';


const router = express.Router();

router.use('/api/user', userRoutes);
router.use('/api/request', requestRoutes);
router.use('/api/template', templateRoutes);

export default router;
