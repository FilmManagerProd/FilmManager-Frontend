// @ts-nocheck
import { createContext, useContext, useEffect, useState } from "react";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";

export type DataContextType = {
    barcodes: any | null;
    loading: boolean;
};

const DataContext = createContext<DataContextType>({
    barcodes: null,
    loading: true,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [barcodes, setBarcodes] = useState<any | null>(null);
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        const db = getDatabase();
        const barcodesRef = ref(db, "Barcodes");

        const unsubscribeBarcodes = onValue(
            barcodesRef,
            (snap) => {
                setBarcodes(snap.val());
                setLoading(false);
            },
            (err) => {
                console.error("DB error (Barcodes):", err);
                setLoading(false);
            }
        );

        return () => {
            unsubscribeBarcodes();
        };
    }, [user, authLoading]);

    return (
        <DataContext.Provider value={{ barcodes, loading }}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => useContext(DataContext);