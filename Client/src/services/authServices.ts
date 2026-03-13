import api from './api';

export interface AuthResponse {
    user: {
        id: string;
        name: string;
        email: string;
    };
    message: string;
}

export const register = async (data: object): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
};


export const login = async (data: object): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
};
