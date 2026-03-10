import db from '../config/db.ts';
import * as ExpenseModel from '../models/expenseModel.ts';
import * as GroupModel from '../models/groupModel.ts';
import asyncHandler from '../utils/asyncHandler.ts';

/**
 * Creates an expense and its corresponding splits within a single transaction.
 */
export const createExpense = asyncHandler(async (req: any, res: any) => {
     const groupId = req.params.groupId ?? req.body.groupId;
     const payerId = req.user?.id ?? req.body.payerId;
     const description = req.body.description ?? req.body.title;
     const { amount } = req.body;

     if (!groupId || !payerId || !description || !amount) {
          return res.status(400).json({ error: "Missing required fields" });
     }

     const client = await db.pool.connect();

     try {
          const isMember = await GroupModel.isMember(groupId, payerId);
          if (!isMember) {
               return res.status(403).json({ error: "Unauthorized: Payer is not a group member" });
          }

          const groupData = await GroupModel.getGroupById(groupId);
          if (!groupData) {
               return res.status(404).json({ error: "Group not found" });
          }
          const members = groupData.members.map((m: any) => m.id);

          await client.query('BEGIN');

          const expenseRes = await client.query(
               `INSERT INTO expenses (group_id, payer_id, description, amount) 
        VALUES ($1, $2, $3, $4) RETURNING *`,
               [groupId, payerId, description, amount]
          );
          const newExpense = expenseRes.rows[0];

          const count = members.length;
          const baseShare = Math.floor((amount / count) * 100) / 100;
          const remainder = Math.round((amount - (baseShare * count)) * 100) / 100;

          for (let i = 0; i < members.length; i++) {
               const finalShare = (i === 0) ? (baseShare + remainder) : baseShare;

               await client.query(
                    `INSERT INTO expense_splits (expense_id, user_id, share) VALUES ($1, $2, $3)`,
                    [newExpense.id, members[i], finalShare]
               );
          }

          await client.query('COMMIT');

          res.status(201).json({
               id: newExpense.id,
               title: newExpense.description,
               amount: newExpense.amount,
               paid_by: newExpense.payer_id,
               paid_by_username: req.user?.username ?? 'You',
               created_at: newExpense.created_at,
               split_count: count,
          });

     } catch (error) {
          await client.query('ROLLBACK');
          throw error; // Let asyncHandler handle it
     } finally {
          client.release();
     }
});

export const getExpensesByGroup = asyncHandler(async (req: any, res: any) => {
     const { groupId } = req.params;
     const userId = req.user.id;

     const memberCheck = await db.query(
          'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userId]
     );

     if (memberCheck.rowCount === 0) {
          return res.status(403).json({ error: "Access denied: You are not a member of this group" });
     }

     const query = `
      SELECT 
        e.id,
        e.description AS title,
        e.amount, 
        e.payer_id AS paid_by,
        u.username AS paid_by_username,
        e.created_at,
        (SELECT COUNT(*) FROM expense_splits es WHERE es.expense_id = e.id)::int AS split_count
      FROM expenses e
      JOIN users u ON e.payer_id = u.id
      WHERE e.group_id = $1
      ORDER BY e.created_at DESC
    `;

     const result = await db.query(query, [groupId]);
     res.status(200).json(result.rows);
});

export const updateExpense = asyncHandler(async (req: any, res: any) => {
     const { id } = req.params;
     const { description, amount } = req.body;
     const userId = req.user.id;

     const expenseRes = await db.query('SELECT payer_id, group_id FROM expenses WHERE id = $1', [id]);
     const expense = expenseRes.rows[0];

     if (!expense) return res.status(404).json({ error: "Not found" });

     if (expense.payer_id !== userId) {
          return res.status(403).json({ error: "Forbidden: You are not the payer" });
     }

     const membersRes = await db.query('SELECT user_id FROM group_members WHERE group_id = $1', [expense.group_id]);
     const memberIds = membersRes.rows.map(m => m.user_id);

     const updated = await ExpenseModel.updateExpense(Number(id), description, amount, memberIds);

     res.status(200).json(updated);
});

export const deleteExpense = asyncHandler(async (req: any, res: any) => {
     const { id } = req.params;
     const userId = req.user.id;

     const expenseRes = await db.query(
          'SELECT payer_id FROM expenses WHERE id = $1',
          [id]
     );

     if (expenseRes.rowCount === 0) {
          return res.status(404).json({ error: "Expense not found" });
     }

     if (expenseRes.rows[0].payer_id !== userId) {
          return res.status(403).json({ error: "Unauthorized: Only the payer can delete this expense" });
     }

     const deleted = await ExpenseModel.deleteExpense(Number(id));

     if (!deleted) {
          return res.status(400).json({ error: "Delete failed" });
     }

     res.status(200).json({ message: "Expense and associated splits deleted successfully" });
});

