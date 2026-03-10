import { Router } from 'express';
import * as UserController from '../controllers/userController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';

const router = Router();

router.use(authenticateToken);

// GET /api/users/dashboard
router.get('/dashboard', UserController.getDashboardData);

export default router;
