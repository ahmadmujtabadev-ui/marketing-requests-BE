// src/routes/user.js
import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { changePassword, forgotPassword, login, me, refresh, register, resetPassword, toggle2FA , updateUser , deleteUser , getDashboardStats} from '../controllers/user.js';

const router = express.Router();

router.post('/register', register);

router.post('/login',  login);

router.post('/refresh',  refresh);

router.get('/me', authRequired, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.post('/change-password', changePassword);
router.post('/toggle-2fa',  toggle2FA); 
router.put('/update', authRequired, updateUser);     
router.delete('/users/:id', authRequired, deleteUser); 
router.get('/stats', authRequired, getDashboardStats);


export default router;