import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { handleValidationErrors } from '../middleware/validateMiddleware.ts';
import { body } from 'express-validator';
import {
    sendInvitation,
    getPendingInvitations,
    respondToInvitation
} from '../controllers/invitationController.ts';

const router = express.Router();

router.use(authenticateToken);

router.post(
    '/send',
    [
        body('groupId').isInt(),
        body('email').isEmail().normalizeEmail({ gmail_remove_dots: false })
    ],
    handleValidationErrors,
    sendInvitation
);

router.get('/pending', getPendingInvitations);

router.post(
    '/respond',
    [
        body('invitationId').isInt(),
        body('action').isIn(['accept', 'reject'])
    ],
    handleValidationErrors,
    respondToInvitation
);

export default router;
