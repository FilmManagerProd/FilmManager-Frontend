// @ts-nocheck
import { createContext, useContext, useEffect, useState } from "react";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { useTranslation } from "react-i18next";
import server from "@/networking";
import * as SecureStore from 'expo-secure-store';
import { Platform } from "react-native";

// Fallback local storage for web platform
const tokenStorage = {
    async getItem(key) {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    async setItem(key, value) {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        return SecureStore.setItemAsync(key, value);
    },
    async removeItem(key) {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        return SecureStore.deleteItemAsync(key);
    }
};

const TOKEN_KEY = 'authToken';

type AuthContextType = {
    userData: any | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    userData: null,
    loading: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userData, setUserData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const toast = useToast();

    const { t } = useTranslation();

    const showToast = (title: string, description: string) => {
        const newId = Math.random();
        toast.show({
            id: newId.toString(),
            placement: "top",
            duration: 3000,
            render: ({ id }) => {
                const uniqueToastId = "toast-" + id;
                return (
                    <Toast nativeID={uniqueToastId} action="muted" variant="solid">
                        <ToastTitle>{title}</ToastTitle>
                        <ToastDescription>{description}</ToastDescription>
                    </Toast>
                );
            },
        });
    };

    const validateToken = async (token: string) => {
        try {
            // Set the token in the headers for this request
            server.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await server.get('/api/user');
            return response.data;
        } catch (error) {
            console.error('Token validation error:', error);
            // Clear the token from headers if validation fails
            delete server.defaults.headers.common['Authorization'];
            return null;
        }
    };

    // This effect runs once at component mount to check for stored auth token
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setLoading(true);
                const storedToken = await tokenStorage.getItem(TOKEN_KEY);

                if (storedToken) {
                    const userData = await validateToken(storedToken);
                    if (userData) {
                        setUserData(userData);
                        setToken(storedToken);
                    } else {
                        // Token is invalid, remove it
                        await tokenStorage.removeItem(TOKEN_KEY);
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // This effect runs whenever the token changes to update the auth header
    useEffect(() => {
        if (token) {
            server.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete server.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = async (email: string, password: string) => {
        try {
            const response = await server.post('/api/login', { email, password });
            const newToken = response.data.token;

            await tokenStorage.setItem(TOKEN_KEY, newToken);
            setToken(newToken);
            setUserData(response.data.user);
        } catch (error) {
            showToast(t("auth.uhOh"), error.response?.data?.error || t("auth.error"));
            throw error;
        }
    };

    const register = async (email: string, password: string, username: string) => {
        try {
            const response = await server.post('/api/register', { email, password, username });
            const newToken = response.data.token;

            await tokenStorage.setItem(TOKEN_KEY, newToken);
            setToken(newToken);
            setUserData(response.data.user);
        } catch (error) {
            showToast(t("auth.uhOh"), error.response?.data?.error || t("auth.error"));
            throw error;
        }
    };

    const logout = async () => {
        await tokenStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUserData(null);
        delete server.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ userData, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);