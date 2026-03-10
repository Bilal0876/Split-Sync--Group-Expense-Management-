import { Router } from 'express';
import * as SettlementController from '../controllers/settlementController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { handleValidationErrors } from '../middleware/validateMiddleware.ts';
import { body, param } from 'express-validator';

const router = Router();

router.use(authenticateToken);

// GET /api/settlements/:groupId/balances
router.get(
    '/:groupId/balances', 
    [param('groupId').isInt()],
    handleValidationErrors,
    SettlementController.getBalances
);

// POST /api/settlements/:groupId/record
router.post(
    '/:groupId/record', 
    [
        param('groupId').isInt(),
        body('senderId').isInt(),
        body('receiverId').isInt(),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
    ],
    handleValidationErrors,
    SettlementController.recordSettlement
);

export default router;
