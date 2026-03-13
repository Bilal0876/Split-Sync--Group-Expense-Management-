import prisma from '../config/prisma.ts';

export const recordSettlement = async (groupId: string, senderId: string, receiverId: string, amount: number) => {
    return await prisma.settlements.create({
        data: {
            group_id: groupId,
            sender_id: senderId,
            receiver_id: receiverId,
            amount: amount,
        }
    });
};

export const getSettlements = async (groupId: string) => {
    const settlements = await prisma.settlements.findMany({
        where: { 
            group_id: groupId,
            is_deleted: false
        } as any,
        include: {
            users_settlements_sender_idTousers: { select: { username: true } },
            users_settlements_receiver_idTousers: { select: { username: true } },
        },
        orderBy: { settled_at: 'desc' }
    });

    // Remap to match previous raw SQL results (adding sender_name and receiver_name)
    return settlements.map(s => ({
        ...s,
        sender_name: s.users_settlements_sender_idTousers?.username,
        receiver_name: s.users_settlements_receiver_idTousers?.username
    }));
};
