import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.ts';
import db from '../config/db.ts';
import * as GroupModel from '../models/groupModel.ts';
import * as SettlementModel from '../models/settlementModel.ts';
import * as ExpenseModel from '../models/expenseModel.ts';
import { calculateBalancesFromData } from '../utils/balanceCalculator.ts';

export const getDashboardData = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        // 1. Get user's groups
        const groups = await GroupModel.getGroupsByUser(userId);
        const groupIds = groups.map(g => g.id);

        if (groupIds.length === 0) {
            return res.json({
                groupsCount: 0,
                netBalance: 0,
                recentActivity: [],
                summarizedBalances: []
            });
        }

        // 2. Fetch data for Net Balance calculation
        // Total Paid (as payer)
        const totalPaidRes = await db.query(
            'SELECT SUM(amount)::float FROM expenses WHERE payer_id = $1',
            [userId]
        );
        const totalPaid = totalPaidRes.rows[0].sum || 0;

        // Total Owed (from splits)
        const totalOwedRes = await db.query(
            'SELECT SUM(share)::float FROM expense_splits WHERE user_id = $1',
            [userId]
        );
        const totalOwed = totalOwedRes.rows[0].sum || 0;

        // Total Sent in settlements
        const totalSentRes = await db.query(
            'SELECT SUM(amount)::float FROM settlements WHERE sender_id = $1',
            [userId]
        );
        const totalSent = totalSentRes.rows[0].sum || 0;

        // Total Received in settlements
        const totalReceivedRes = await db.query(
            'SELECT SUM(amount)::float FROM settlements WHERE receiver_id = $1',
            [userId]
        );
        const totalReceived = totalReceivedRes.rows[0].sum || 0;

        const netBalance = totalPaid - totalOwed + totalSent - totalReceived;

        // 3. Fetch Recent Activity (Latest 5 expenses or settlements across all groups)
        const activityQuery = `
            (
                SELECT 
                    'expense' as type, 
                    description as title, 
                    e.amount::float, 
                    e.created_at, 
                    u.username as paid_by_username,
                    payer_id as paid_by_id,
                    g.name as group_name
                FROM expenses e
                JOIN users u ON e.payer_id = u.id
                JOIN groups g ON e.group_id = g.id
                WHERE e.group_id = ANY($1)
            )
            UNION ALL
            (
                SELECT 
                    'settlement' as type, 
                    'Settlement' as title, 
                    s.amount::float, 
                    settled_at as created_at, 
                    u.username as paid_by_username,
                    sender_id as paid_by_id,
                    g.name as group_name
                FROM settlements s
                JOIN users u ON s.sender_id = u.id
                JOIN groups g ON s.group_id = g.id
                WHERE s.group_id = ANY($1)
            )
            ORDER BY created_at DESC
            LIMIT 5
        `;
        const activityRes = await db.query(activityQuery, [groupIds]);
        const recentActivity = activityRes.rows;

        // 4. Summarized Balances (Aggregated debt/credit across all groups)
        // We need to run the greedy algorithm per group and then merge
        const allTransactions: any[] = [];
        
        for (const group of groups) {
            const expenses = await ExpenseModel.getExpensesByGroup(group.id);
            const expenseIds = expenses.map(e => e.id);
            let splits: any[] = [];
            if (expenseIds.length > 0) {
                const splitRes = await db.query(
                    'SELECT * FROM expense_splits WHERE expense_id = ANY($1)',
                    [expenseIds]
                );
                splits = splitRes.rows;
            }
            const settlements = await SettlementModel.getSettlements(group.id);
            const groupDetails = await GroupModel.getGroupById(group.id);
            
            if (groupDetails && groupDetails.members) {
                const groupTransactions = calculateBalancesFromData(expenses, splits, groupDetails.members, settlements);
                allTransactions.push(...groupTransactions);
            }
        }

        // Final merging logic:
        const finalBalancesMap: Record<number, number> = {};
        allTransactions.forEach(tx => {
            if (tx.from.userId === userId) {
                // I owe tx.to.userId
                finalBalancesMap[tx.to.userId] = (finalBalancesMap[tx.to.userId] || 0) - tx.amount;
            } else if (tx.to.userId === userId) {
                // tx.from.userId owes me
                finalBalancesMap[tx.from.userId] = (finalBalancesMap[tx.from.userId] || 0) + tx.amount;
            }
        });

        const finalizedBalances = [];
        for (const [otherIdStr, net] of Object.entries(finalBalancesMap)) {
            const otherId = parseInt(otherIdStr);
            const amount = Math.abs(net);
            if (amount < 0.01) continue;

            // Find username from transactions
            const tx = allTransactions.find(t => t.from.userId === otherId || t.to.userId === otherId);
            const username = tx.from.userId === otherId ? tx.from.username : tx.to.username;

            finalizedBalances.push({
                userId: otherId,
                username,
                amount: Math.round(amount * 100) / 100,
                dir: net > 0 ? 'owed_to_me' : 'i_owe'
            });
        }

        res.json({
            groupsCount: groups.length,
            netBalance: Math.round(netBalance * 100) / 100,
            recentActivity,
            summarizedBalances: finalizedBalances.sort((a, b) => b.amount - a.amount)
        });

    } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: error.message });
    }
};
