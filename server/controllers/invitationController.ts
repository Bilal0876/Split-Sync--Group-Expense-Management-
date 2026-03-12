import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.ts';
import prisma from '../config/prisma.ts';
import asyncHandler from '../utils/asyncHandler.ts';
import { findByemail } from '../models/userModel.ts';
import * as GroupModel from '../models/groupModel.ts';

export const sendInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { groupId, email } = req.body;
    const senderId = req.user!.id;

    // 1. Check if sender is member of group
    const authorized = await GroupModel.isMember(groupId, senderId);
    if (!authorized) {
        return res.status(403).json({ error: "Access denied: You are not a member of this group." });
    }

    // 2. Find receiver by email
    const receiver = await findByemail(email);
    if (!receiver) {
        return res.status(404).json({ error: `User with email ${email} not found.` });
    }

    // 3. Check if already a member
    const alreadyMember = await GroupModel.isMember(groupId, receiver.id);
    if (alreadyMember) {
        return res.status(400).json({ error: "User is already a member of this group." });
    }

    // 4. Check if invite already exists
    const existingInvite = await prisma.invitations.findFirst({
        where: {
            group_id: groupId,
            user_id: receiver.id,
            status: 'pending'
        }
    });

    if (existingInvite) {
        return res.status(400).json({ error: "An invitation is already pending for this user." });
    }

    // 5. Create invitation
    const invitation = await prisma.invitations.create({
        data: {
            group_id: groupId,
            user_id: receiver.id,
            invited_by: senderId,
            status: 'pending'
        }
    });

    res.status(201).json({ message: "Invitation sent successfully", invitation });
});

export const getPendingInvitations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const invitations = await prisma.invitations.findMany({
        where: {
            user_id: userId,
            status: 'pending'
        },
        include: {
            groups: {
                select: { name: true }
            },
            sender: {
                select: { username: true }
            }
        }
    });

    res.status(200).json(invitations);
});

export const respondToInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { invitationId, action } = req.body; // action: 'accept' | 'reject'
    const userId = req.user!.id;

    const invitation = await prisma.invitations.findUnique({
        where: { id: invitationId }
    });

    if (!invitation || invitation.user_id !== userId) {
        return res.status(404).json({ error: "Invitation not found." });
    }

    if (invitation.status !== 'pending') {
        return res.status(400).json({ error: "Invitation has already been processed." });
    }

    if (action === 'accept') {
        await prisma.$transaction(async (tx) => {
            // 1. Add to group members
            await tx.group_members.create({
                data: {
                    group_id: invitation.group_id,
                    user_id: userId
                }
            });

            // 2. Update invitation status
            await tx.invitations.update({
                where: { id: invitationId },
                data: { status: 'accepted' }
            });
        });

        res.status(200).json({ message: "Invitation accepted. You are now a member of the group." });
    } else if (action === 'reject') {
        await prisma.invitations.update({
            where: { id: invitationId },
            data: { status: 'rejected' }
        });

        res.status(200).json({ message: "Invitation rejected." });
    } else {
        res.status(400).json({ error: "Invalid action." });
    }
});
