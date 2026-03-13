import { Router } from 'express';
import * as ExpenseController from '../controllers/expenseController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { handleValidationErrors } from '../middleware/validateMiddleware.ts';
import { body, param } from 'express-validator';

const router = Router();

router.use(authenticateToken);

// CREATE
router.post(
    '/', 
    [
        body('groupId').isUUID(),
        body('payerId').isUUID().optional(), // Often taken from auth
        body('description').notEmpty().withMessage('Description is required').trim(),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
    ],
    handleValidationErrors,
    ExpenseController.createExpense
);

// READ (Group View)
router.get(
    '/group/:groupId', 
    [param('groupId').isUUID()],
    handleValidationErrors,
    ExpenseController.getExpensesByGroup
);

// UPDATE
router.put(
    '/:id', 
    [
        param('id').isUUID(),
        body('description').notEmpty().withMessage('Description is required').trim(),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
    ],
    handleValidationErrors,
    ExpenseController.updateExpense
);

// DELETE
router.delete(
    '/:id', 
    [param('id').isUUID()],
    handleValidationErrors,
    ExpenseController.deleteExpense
);

export default router;
