// @ts-nocheck
import { createContext, useContext, useEffect, useState } from "react";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { useTranslation } from "react-i18next";
import server from "@/networking";

type AuthContextType = {
    userData: any | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
    userData: null,
    loading: true,
    login: async () => {},
    register: async () => {},
    logout: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [userData, setUserData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
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
            const response = await server.get('/api/user');
            return response.data;
        } catch (error) {
            return null;
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const userData = await validateToken(token);
                    if (userData) {
                        setUserData(userData);
                        server.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    }
                } catch (error) {
                    console.error('Token validation failed:', error);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await server.post('/api/login', { email, password });
            localStorage.setItem('authToken', response.data.token);
            server.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            setUserData(response.data.user);
        } catch (error) {
            showToast(t("auth.uhOh"), error.response?.data?.error || t("auth.error"));
            throw error;
        }
    };

    const register = async (email: string, password: string, username: string) => {
        const response = await server.post('/api/register', { email, password, username });

        localStorage.setItem('authToken', response.data.token);
        server.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUserData(response.data.user);
    };


    const logout = () => {
        localStorage.removeItem('authToken');
        delete server.defaults.headers.common['Authorization'];
        setUserData(null);
    };

    return (
        <AuthContext.Provider value={{ userData, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);