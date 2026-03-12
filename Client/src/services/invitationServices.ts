import api from './api';

export interface Invitation {
    id: number;
    group_id: number;
    user_id: number;
    invited_by: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    groups: {
        name: string;
    };
    sender: {
        username: string;
    };
}

export const getPendingInvitations = async (): Promise<Invitation[]> => {
    const response = await api.get('/invitations/pending');
    return response.data;
};

export const respondToInvitation = async (invitationId: number, action: 'accept' | 'reject') => {
    const response = await api.post('/invitations/respond', { invitationId, action });
    return response.data;
};

export const sendInvitation = async (groupId: number, email: string) => {
    const response = await api.post('/invitations/send', { groupId, email });
    return response.data;
};
