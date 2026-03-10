import express from 'express';
import { register, login } from '../controllers/authController.ts';
import { handleValidationErrors } from '../middleware/validateMiddleware.ts';
import { authRateLimiter } from '../middleware/rateLimiter.ts';
import { body } from 'express-validator';

const router = express.Router();

router.use(authRateLimiter);

// 1. POST /register
router.post(
    '/register', 
    [
        body('name').notEmpty().withMessage('Name is required').trim(),
        body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    handleValidationErrors,
    register
);

// 2. POST /login
router.post(
    '/login', 
    [
        body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    handleValidationErrors,
    login
);

export default router;
