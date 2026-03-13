import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { login as loginApi, register as registerApi } from '../services/authServices';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: object) => Promise<void>;
    register: (data: object) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (data: object) => {
        const res = await loginApi(data);
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
    };

    const register = async (data: object) => {
        const res = await registerApi(data);
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
    };

    const logout = async () => {
        // 1. Decisively clear state immediately to trigger redirect and stop background UI activity
        setUser(null);
        localStorage.removeItem('user');

        // 2. Notify backend (silently, as we don't want to block the UI or show errors if it fails)
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.warn('Logout notification failed (expected if already unauthorized):', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
