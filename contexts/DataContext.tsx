// @ts-nocheck
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import server from "../networking";

export type Barcode = {
    id: string;
    barcode: string;
    group: string;
    itemName: string;
    itemDescription: string;
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
    totalCount: number;
    sessionCount: number;
    location: string;
    pointsToRedeem: number;
    imageUrl?: string;
};

export type DataContextType = {
    barcodes: Barcode[] | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

const DataContext = createContext<DataContextType>({
    barcodes: null,
    loading: true,
    error: null,
    refetch: async () => { },
});

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { userData, loading: authLoading } = useAuth();
    const [barcodes, setBarcodes] = useState<Barcode[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBarcodes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await server.get("/api/barcodes");
            setBarcodes(res.data?.result || []);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || "Unknown error");
            setBarcodes(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading || !userData) {
            setLoading(false);
            return;
        }

        fetchBarcodes();
    }, [userData, authLoading, fetchBarcodes]);

    return (
        <DataContext.Provider value={{ barcodes, loading, error, refetch: fetchBarcodes }}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => useContext(DataContext);