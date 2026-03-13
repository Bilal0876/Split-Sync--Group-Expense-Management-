import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { handleValidationErrors } from '../middleware/validateMiddleware.ts';
import { body, param } from 'express-validator';
import {
    createGroup,
    getGroupsByUser,
    getGroupById,
    addMember,
    removeMember,
    leaveGroup,
} from '../controllers/groupController.ts';
import {
    getExpensesByGroup,
    createExpense,
} from '../controllers/expenseController.ts';

const router = express.Router();

router.use(authenticateToken);

// /api/groups - to create a new group
router.post(
    '/',
    [body('name').notEmpty().withMessage('Group name is required').trim()],
    handleValidationErrors,
    createGroup
);

// /api/groups — to get all groups for the user
router.get('/', getGroupsByUser);

//  /api/groups/:groupId/members — to add a member to a group
router.post(
    '/:groupId/members',
    param('groupId').notEmpty().withMessage('GroupId is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail({ gmail_remove_dots: false }),
    handleValidationErrors,
    addMember
);

//  /api/groups/:groupId/members — to remove a member from a group
router.delete(
    '/:groupId/members',
    param('groupId').notEmpty().withMessage('GroupId is required'),
    body('userId').notEmpty().withMessage('UserId is required'),
    handleValidationErrors,
    removeMember
);

// /api/groups/:groupId/leave — for a user to leave the group
router.delete(
    '/:groupId/leave',
    param('groupId').notEmpty().withMessage('GroupId is required'),
    handleValidationErrors,
    leaveGroup
);

// /api/groups/:groupId/expenses — to get all expenses for a group
router.get(
    '/:groupId/expenses',
    param('groupId').notEmpty().withMessage('GroupId is required'),
    handleValidationErrors,
    getExpensesByGroup
);

// /api/groups/:groupId/expenses — to add a new expense in a group
router.post(
    '/:groupId/expenses',
    param('groupId').notEmpty().withMessage('GroupId is required'),
    body('title').notEmpty().withMessage('Description/Title is required').trim(),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    handleValidationErrors,
    createExpense
);

// /api/groups/:groupId — to Get a single group by ID (Moved to bottom to prevent catch-all conflict)
router.get(
    '/:groupId',
    param('groupId').notEmpty().withMessage('GroupId is required'),
    handleValidationErrors,
    getGroupById
);

export default router;
