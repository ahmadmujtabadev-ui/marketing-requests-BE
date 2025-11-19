// src/routes/userManagement.js
import express from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  adminResetPassword,
  toggleUserActive,
  getUserStats
} from '../controllers/admin.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authRequired);

// Statistics
router.get('/stats', getUserStats);

// CRUD operations
router.get('/', listUsers);
router.get('/:id', getUser);    
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// User management actions
router.post('/:id/reset-password', adminResetPassword);
router.post('/:id/toggle-active', toggleUserActive);

export default router;