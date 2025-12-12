'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';


interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount (client-side only)


        // Read token directly from localStorage first
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            api.setToken(storedToken); // Sync to api client
            api.getMe()
                .then((userData) => {
                    setUser({
                        id: userData.id,
                        email: userData.email,
                        name: userData.name,
                        profilePicture: userData.profilePicture,
                        roles: userData.roles as ('USER' | 'ADMIN')[],
                        authProvider: userData.authProvider as 'LOCAL' | 'GOOGLE',
                        createdAt: userData.createdAt,
                    });
                })
                .catch(() => {
                    api.setToken(null);
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            const timeout = setTimeout(() => setLoading(false), 0);
            return () => clearTimeout(timeout);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.login(email, password);
        api.setToken(response.token);

        // Fetch full profile to get roles
        const userData = await api.getMe();
        setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            profilePicture: userData.profilePicture,
            roles: userData.roles as ('USER' | 'ADMIN')[],
            authProvider: userData.authProvider as 'LOCAL' | 'GOOGLE',
            createdAt: userData.createdAt,
        });
    };

    const register = async (email: string, password: string, name: string) => {
        const response = await api.register(email, password, name);
        api.setToken(response.token);

        // Fetch full profile to get roles
        const userData = await api.getMe();
        setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            profilePicture: userData.profilePicture,
            roles: userData.roles as ('USER' | 'ADMIN')[],
            authProvider: userData.authProvider as 'LOCAL' | 'GOOGLE',
            createdAt: userData.createdAt,
        });
    };

    const logout = () => {
        api.setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
