// @ts-nocheck
import { createContext, useContext, useEffect, useState } from "react";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { User, onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { getDatabase, ref, onValue, off } from "firebase/database";
import server from "@/networking";

type AuthContextType = {
    user: User | null;
    userData: any;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const toast = useToast();
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

    useEffect(() => {
        let userRefCleanup: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                const db = getDatabase();
                const userRef = ref(db, `Users/${firebaseUser.uid}`);
                userRefCleanup = () => off(userRef);

                onValue(
                    userRef,
                    (snapshot) => {
                        setUserData(snapshot.val());
                        setLoading(false);
                    },
                    (error) => {
                        if (auth.currentUser) {
                            showToast(t("auth.uhOh"), t("failedToLoadUser"));
                            console.error("Realtime DB error:", error);
                        }
                        setLoading(false);
                    }
                );
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (userRefCleanup) userRefCleanup();
        };
    }, []);

    useEffect(() => {
        const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const freshToken = await firebaseUser.getIdToken();
                server.defaults.headers.common["Authorization"] = `Bearer ${freshToken}`;
            } else {
                delete server.defaults.headers.common["Authorization"];
            }
        });

        return () => {
            unsubscribeToken();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);