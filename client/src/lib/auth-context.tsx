'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, decryptData } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const res = await authAPI.getMe();
            if (res.data.success && res.data.data) {
                const userData = decryptData(res.data.data);
                setUser(userData);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email: string, password: string) => {
        const res = await authAPI.login({ email, password });
        if (res.data.success && res.data.data) {
            const userData = decryptData(res.data.data);
            setUser(userData);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await authAPI.register({ name, email, password });
        if (res.data.success && res.data.data) {
            const userData = decryptData(res.data.data);
            setUser(userData);
        }
    };

    const logout = async () => {
        await authAPI.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
