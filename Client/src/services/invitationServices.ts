import api from './api';

export interface Invitation {
    id: string;
    group_id: string;
    user_id: string;
    invited_by: string;
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

export const respondToInvitation = async (invitationId: string, action: 'accept' | 'reject') => {
    const response = await api.post('/invitations/respond', { invitationId, action });
    return response.data;
};

export const sendInvitation = async (groupId: string, email: string) => {
    const response = await api.post('/invitations/send', { groupId, email });
    return response.data;
};
