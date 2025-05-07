// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { ScrollView, useWindowDimensions } from "react-native";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Modal, ModalBackdrop, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Checkbox, CheckboxIndicator, CheckboxIcon } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem } from '@/components/ui/select';
import { FormControl, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control"
import { Icon, CloseIcon, CheckIcon, ChevronDownIcon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import Constants from "expo-constants";
import { Radio, RadioGroup, RadioIndicator, RadioLabel } from '@/components/ui/radio';
import server from "../../../networking";
import ProtectedRoute from "@/app/_wrappers/ProtectedRoute";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangleIcon, ArrowDownCircle, ArrowUpCircle, CheckCircleIcon, MinusCircleIcon, PencilIcon, ScanIcon, SparklesIcon, StopCircleIcon, WarehouseIcon } from "lucide-react-native";
import { Box } from "@/components/ui/box";
import { useData } from "@/contexts/DataContext";
import { useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from 'react-i18next';

interface ScannedItem {
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
}

export default function ScannerScreen() {
    const [currentScan, setCurrentScan] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [scannedCode, setScannedCode] = useState("");
    const [editingItem, setEditingItem] = useState<ScannedItem | null>(null);
    const [editingBarcode, setEditingBarcode] = useState("");
    const [pendingItems, setPendingItems] = useState<ScannedItem[]>([]);
    const [pendingUnknownItems, setPendingUnknownItems] = useState<ScannedItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingItemName, setEditingItemName] = useState("");
    const [editingItemDescription, setEditingItemDescription] = useState("");
    const [editingItemCount, setEditingItemCount] = useState('');
    const [editingItemLocation, setEditingItemLocation] = useState("");
    const [editingItemPointsToRedeem, setEditingItemPointsToRedeem] = useState("");
    const [editingItemGroup, setEditingItemGroup] = useState("");
    const [isEditingUnknown, setIsEditingUnknown] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [showUnknownEditModal, setShowUnknownEditModal] = useState(false);
    const [isSelectOpen, setIsSelectOpen] = useState(false)
    const [currentMode, setCurrentMode] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isInventoryMode, setIsInventoryMode] = useState(false);
    const [imageUrls, setImageUrls] = useState({})
    const [validationErrors, setValidationErrors] = useState({
        barcode: false,
        itemName: false,
        itemDescription: false,
        location: false,
        itemCount: false,
        pointsToRedeem: false,
    });
    const { width, height } = useWindowDimensions();
    const isMediumLaptop = width < 1400;
    const isSmallLaptop = width < 1024;
    const isShortScreen = height < 750;
    const isMobileScreen = width < 680;
    const isTinyScreen = width < 375;

    const { API_KEY } = Constants.expoConfig.extra;

    const { barcodes, loading } = useData()

    const { t } = useTranslation();

    const { mode } = useLocalSearchParams();
    const initialMode = typeof mode === "string" ? mode : "info";
    useEffect(() => {
        setCurrentMode(initialMode);
    }, [initialMode]);

    useEffect(() => {
        console.log(barcodes)
    }, [barcodes])

    const groupLabels = { consumable: "消耗品", rental: "租赁物" };
    const radioOptions = [
        { value: 'receive', key: 'scanner.radio.receive' },
        { value: 'dispatch', key: 'scanner.radio.dispatch' },
        { value: 'info', key: 'scanner.radio.info' },
    ];
    const scanInputRef = useRef<any>(null)
    const inputRef = useRef<any>(null);

    const trueLength = (str) => [...str].length;

    const validateInputs = () => {
        const alphanumeric = /^[a-zA-Z0-9 ]*$/;
        const generalTextPattern = /^[\u4e00-\u9fa5\p{L}\p{N}\p{P}\p{Emoji_Presentation} ]*$/u;
        const numeric = /^[0-9]+$/;
        const locationPattern = /^[0-9-]*$/;

        return {
            barcode:
                trueLength(editingBarcode) > 100 ||
                !alphanumeric.test(editingBarcode),

            itemName:
                trueLength(editingItemName) > 100 ||
                !generalTextPattern.test(editingItemName),

            itemDescription:
                trueLength(editingItemDescription) > 250 ||
                !generalTextPattern.test(editingItemDescription),

            location:
                trueLength(editingItemLocation) > 20 ||
                !locationPattern.test(editingItemLocation),

            itemCount:
                trueLength(editingItemCount) > 6 ||
                !numeric.test(editingItemCount),

            pointsToRedeem:
                trueLength(editingItemPointsToRedeem) > 6 ||
                !numeric.test(editingItemPointsToRedeem),
        };
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (
                typeof document !== "undefined" &&
                scanInputRef.current &&
                document.activeElement !== scanInputRef.current &&
                document.activeElement !== inputRef.current &&
                !isSelectOpen
            ) {
                scanInputRef.current.focus()
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [isSelectOpen])

    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const BASE_URL = Constants.expoConfig?.extra?.BASE_URL;

    // Toast helper
    const showToast = (title: string, description: string) => {
        const newId = Math.random();
        setToastId(newId);
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

    // Set up socket connection to listen for barcode updates
    useEffect(() => {
        const socket = io(BASE_URL, {
            path: "/socket.io",
            transports: ["websocket"],
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            if (!toast.isActive(toastId.toString())) {
                showToast(t('scanner.toast.socketErrorTitle'), t('scanner.toast.socketErrorDesc'));
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Auto-submit scan when the length of the scanned text meets a threshold
    useEffect(() => {
        const MIN_BARCODE_LENGTH = 6;
        if (currentScan.trim().length < MIN_BARCODE_LENGTH) return;

        const timeout = setTimeout(() => {
            handleScannedItems();
        }, 100);

        return () => clearTimeout(timeout);
    }, [currentScan]);

    const handleScannedItems = async () => {
        if (currentScan.trim()) {
            setIsLoading(true);
            const barcodeToScan = currentScan.trim();

            if (barcodeToScan.startsWith("http")) {
                showToast(t('scanner.toast.invalidBarcodeTitle'), t('scanner.toast.invalidBarcodeDesc'));
                setCurrentScan("");
                setScannedCode("")
                setIsLoading(false);
                setIsFocused(false);
                return;
            }

            try {
                const barcodesArray = Object.values(barcodes ? barcodes : []) as ScannedItem[];

                const matchedItem = barcodesArray.find(item => item.barcode === barcodeToScan);
                const isKnown = !!matchedItem;

                const currentPendingList = isKnown ? pendingItems : pendingUnknownItems;
                const setPendingList = isKnown ? setPendingItems : setPendingUnknownItems;

                const existingPendingItem = currentPendingList.find(
                    item => item.barcode === barcodeToScan
                );

                let newPendingItems: ScannedItem[];

                if (existingPendingItem) {
                    newPendingItems = currentPendingList.map(item =>
                        item.barcode === barcodeToScan
                            ? { ...item, sessionCount: (item.sessionCount || 0) + 1 }
                            : item
                    );
                    setPendingList(newPendingItems);
                } else {
                    const newItem: ScannedItem = matchedItem
                        ? {
                            ...matchedItem,
                            totalCount: matchedItem.totalCount || 0,
                            sessionCount: 1,
                        }
                        : {
                            id: uuidv4(),
                            barcode: barcodeToScan,
                            group: "consumable",
                            itemName: "New Item",
                            itemDescription: "",
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            updatedBy: "",
                            totalCount: 0,
                            sessionCount: 1,
                            location: "",
                            pointsToRedeem: 0,
                        };

                    if (isKnown) {
                        newPendingItems = [...currentPendingList, newItem];
                        setPendingList(newPendingItems);
                    } else {
                        if (!isKnown) {
                            if (isInventoryMode) {
                                // Append directly, skip modal
                                setPendingUnknownItems((prev) => [
                                    ...prev,
                                    {
                                        id: uuidv4(),
                                        barcode: barcodeToScan,
                                        group: "consumable",
                                        itemName: "New Item",
                                        itemDescription: "",
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                        updatedBy: "",
                                        totalCount: 0,
                                        sessionCount: 1,
                                        location: "",
                                        pointsToRedeem: 0,
                                    },
                                ]);
                            } else {
                                handleEditUnknownItem(newItem);
                            }
                        }
                    }
                }

                setCurrentScan("");
                setScannedCode(barcodeToScan);
                setIsFocused(false);
                setIsLoading(false);
            } catch (error) {
                console.error("Scanner Error:", error);
                if (
                    error.response &&
                    error.response.data &&
                    typeof error.response.data.error === "string" &&
                    error.response.data.error.startsWith("UERROR: ")
                ) {
                    const cleanedMessage = error.response.data.error.replace("UERROR: ", "");
                    showToast(t('scanner.toast.scannerErrorTitle'), cleanedMessage);
                } else {
                    showToast(t('scanner.toast.scannerErrorTitle'), t('scanner.toast.scannerErrorServerDesc'));
                }
                setIsLoading(false);
                setIsFocused(false);
            }
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    }

    const areAllGroupItemsSelected = (groupItems: ScannedItem[]) => {
        return groupItems.every(item => selectedIds.has(item.id));
    };

    const toggleSelectGroup = (group: string) => {
        const groupItems = groupedItems[group];
        const allSelected = areAllGroupItemsSelected(groupItems);

        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                groupItems.forEach(item => newSet.delete(item.id));
            } else {
                groupItems.forEach(item => newSet.add(item.id));
            }
            return newSet;
        });
    };

    const allPendingItems = [...(pendingItems || []), ...(pendingUnknownItems || [])];

    const groupedItems: Record<string, ScannedItem[]> = allPendingItems.reduce((groups, item) => {
        const group = item.group?.toLowerCase() || "Unknown";
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
    }, {});

    const allSelected = selectedIds.size === allPendingItems.length;

    const selectAll = () => {
        setSelectedIds(new Set(allPendingItems.map(item => item.id)));
    };

    const unselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleClearResults = () => {
        setIsLoading(true);
        setCurrentScan("");
        setIsFocused(false);
        setScannedCode("")
        setPendingItems([]);
        setPendingUnknownItems([]);
        setSelectedIds(new Set());
        showToast(t('scanner.toast.clearedTitle'), t('scanner.toast.clearedDesc'));
        setIsLoading(false);
    };

    const handleRemove = (id: string) => {
        let updatedKnown = pendingItems;
        let updatedUnknown = pendingUnknownItems;

        if (pendingItems.some(item => item.id === id)) {
            updatedKnown = pendingItems.filter(item => item.id !== id);
            setPendingItems(updatedKnown);
        } else {
            updatedUnknown = pendingUnknownItems.filter(item => item.id !== id);
            setPendingUnknownItems(updatedUnknown);
        }

        // Check if both are empty AFTER updating
        if (updatedKnown.length === 0 && updatedUnknown.length === 0) {
            setCurrentScan("");
            setScannedCode("");
        }
    };

    const handleEdit = (item: ScannedItem) => {
        setEditingItem(item);
        setEditingBarcode(item.barcode ?? "");
        setEditingItemName(item.itemName ?? "");
        setEditingItemDescription(item.itemDescription ?? "");
        setEditingItemCount(item.totalCount?.toString() ?? "0");
        setEditingItemLocation(item.location ?? "");
        setEditingItemPointsToRedeem(item.pointsToRedeem?.toString() ?? "0");
        setEditingItemGroup(item.group ?? "");

        const isUnknown = pendingUnknownItems.some(i => i.id === item.id);
        setIsEditingUnknown(isUnknown);

        setShowEditModal(true);
    };

    const handleEditUnknownItem = (item: ScannedItem) => {
        setEditingItem(item);
        setEditingBarcode(item.barcode ?? "");
        setEditingItemName(item.itemName ?? "");
        setEditingItemDescription(item.itemDescription ?? "");
        setEditingItemCount(item.totalCount?.toString() ?? "0");
        setEditingItemLocation(item.location ?? "");
        setEditingItemPointsToRedeem(item.pointsToRedeem?.toString() ?? "0");
        setEditingItemGroup(item.group ?? "unknown");

        setShowUnknownEditModal(true);
    };

    const handleReceive = async () => {
        setIsLoading(true);
        const knownItemsToReceive = pendingItems.filter(item => selectedIds.has(item.id));
        const unknownItemsToReceive = pendingUnknownItems.filter(item => selectedIds.has(item.id));

        const selectedBarcodes = new Set([...knownItemsToReceive, ...unknownItemsToReceive].map(item => item.barcode));

        try {
            // Update known items (PUT)
            if (knownItemsToReceive.length > 0) {
                const updatePayload = knownItemsToReceive.map(item => ({
                    id: item.id,
                    operation: 'receive',
                    count: item.sessionCount,
                    barcode: item.barcode,
                    itemName: item.itemName,
                    itemDescription: item.itemDescription,
                    group: item.group,
                    location: item.location,
                    pointsToRedeem: item.pointsToRedeem,
                }));
                const response = await server.put('/api/barcodes', updatePayload);
            }

            // Create unknown items (POST)
            if (unknownItemsToReceive.length > 0) {
                const createPayload = unknownItemsToReceive.map(item => ({
                    barcode: item.barcode,
                    itemName: item.itemName,
                    itemDescription: item.itemDescription,
                    count: item.totalCount + item.sessionCount,
                    group: item.group,
                    location: item.location,
                    pointsToRedeem: item.pointsToRedeem,
                }));
                const response = await server.post('/api/barcodes', createPayload);
            }

            await Promise.all([knownItemsToReceive, unknownItemsToReceive]);

            setPendingItems(prev => prev.filter(item => !selectedBarcodes.has(item.barcode)));
            setPendingUnknownItems(prev => prev.filter(item => !selectedBarcodes.has(item.barcode)));
            setSelectedIds(new Set());

            const totalReceived = knownItemsToReceive.length + unknownItemsToReceive.length;
            showToast(t('scanner.toast.itemsReceivedTitle'), t('scanner.toast.itemsReceivedDesc', { count: totalReceived }));
        } catch (error) {
            console.error("Receive Error:", error);
            if (
                error.response &&
                error.response.data &&
                typeof error.response.data.error === "string" &&
                error.response.data.error.startsWith("UERROR: ")
            ) {
                const cleanedMessage = error.response.data.error.replace("UERROR: ", "");
                showToast(t('scanner.toast.receiveErrorTitle'), cleanedMessage);
            } else {
                showToast(t('scanner.toast.receiveErrorTitle'), t('scanner.toast.receiveErrorDesc'));
            }
        } finally {
            setIsLoading(false);
            setShowReceiveModal(false);
            setCurrentScan("");
            setScannedCode("");
            setIsFocused(false);
        }
    };

    const handleDispatch = async () => {
        setIsLoading(true);
        const selectedUnknownItems = pendingUnknownItems.filter(item =>
            selectedIds.has(item.id)
        );

        if (selectedUnknownItems.length > 0) {
            showToast(t('scanner.toast.dispatchErrorUnknownTitle'), t('scanner.toast.dispatchErrorUnknownDesc'));
            setIsLoading(false);
            return;
        }

        const dispatchableItems = pendingItems.filter(item =>
            selectedIds.has(item.id) && item.totalCount >= item.sessionCount
        );

        if (dispatchableItems.length === 0) {
            showToast(t('scanner.toast.dispatchErrorStockTitle'), t('scanner.toast.dispatchErrorStockDesc'));
            setIsLoading(false);
            return;
        }

        try {
            const dispatchPayload = dispatchableItems.map(item => ({
                id: item.id,
                operation: 'dispatch',
                count: item.sessionCount,
                barcode: item.barcode,
                itemName: item.itemName,
                itemDescription: item.itemDescription,
                group: item.group,
                location: item.location,
                pointsToRedeem: item.pointsToRedeem,
            }));

            const response = await server.put('/api/barcodes', dispatchPayload);

            await Promise.all(dispatchPayload);

            setPendingItems(prev => prev.filter(item => !selectedIds.has(item.id)));
            setPendingUnknownItems(prev => prev.filter(item => !selectedIds.has(item.id)));
            setSelectedIds(new Set());
            showToast(t('scanner.toast.dispatchSuccessTitle'), t('scanner.toast.dispatchSuccessDesc', { count: dispatchableItems.length }));
        } catch (error) {
            console.error("Dispatch Error:", error);
            if (
                error.response &&
                error.response.data &&
                typeof error.response.data.error === "string" &&
                error.response.data.error.startsWith("UERROR: ")
            ) {
                const cleanedMessage = error.response.data.error.replace("UERROR: ", "");
                showToast(t('scanner.toast.dispatchErrorTitle'), cleanedMessage);
            } else {
                showToast(t('scanner.toast.dispatchErrorTitle'), t('scanner.toast.dispatchErrorDesc'));
            }
        } finally {
            setIsLoading(false);
            setShowDispatchModal(false);
            setCurrentScan("");
            setScannedCode("");
            setIsFocused(false);
        }
    };

    const handleValidation = () => {
        const errors = validateInputs();
        setValidationErrors(errors);
        return !Object.values(errors).some(Boolean);
    };

    const saveEditedBarcode = async () => {
        if (!editingItem || !handleValidation()) return;
        setIsLoading(true);
        const updatedTotalCount = parseInt(editingItemCount) || 0;

        const updatedItem = {
            ...editingItem,
            barcode: editingBarcode.trim(),
            itemName: editingItemName.trim(),
            itemDescription: editingItemDescription.trim(),
            location: editingItemLocation.trim(),
            pointsToRedeem: parseInt(editingItemPointsToRedeem) || 0,
            group: editingItemGroup.trim(),
            totalCount: parseInt(editingItemCount) || 0,
        };

        if (isEditingUnknown) {
            setPendingUnknownItems((prev) =>
                prev.map((item) =>
                    item.id === editingItem.id
                        ? { ...updatedItem, totalCount: updatedTotalCount }
                        : item
                )
            );
        } else {
            try {
                await server.put('/api/barcodes', [{
                    id: editingItem.id,
                    operation: 'edit',
                    barcode: editingBarcode.trim(),
                    group: editingItemGroup.trim(),
                    location: editingItemLocation.trim(),
                    pointsToRedeem: parseInt(editingItemPointsToRedeem) || 0,
                    itemName: editingItemName.trim(),
                    itemDescription: editingItemDescription.trim(),
                    count: parseInt(editingItemCount),
                }]);
            } catch (error) {
                console.error("Edit Error:", error);
                if (
                    error.response &&
                    error.response.data &&
                    typeof error.response.data.error === "string" &&
                    error.response.data.error.startsWith("UERROR: ")
                ) {
                    const cleanedMessage = error.response.data.error.replace("UERROR: ", "");
                    showToast(t('scanner.toast.editErrorTitle'), cleanedMessage);
                } else {
                    showToast(t('scanner.toast.editErrorTitle'), t('scanner.toast.editErrorDesc'));
                }
            }
        }

        setEditingItem(null);
        setShowEditModal(false);
        setIsLoading(false);
        setEditingBarcode(editingItem?.barcode || "");
        setEditingItemName(editingItem?.itemName || "");
        setEditingItemDescription(editingItem?.itemDescription || "");
        setEditingItemCount(editingItem?.totalCount.toString() || "");
        setEditingItemLocation(editingItem?.location || "");
        setEditingItemPointsToRedeem(editingItem?.pointsToRedeem.toString() || "");
        setEditingItemGroup(editingItem?.group || "");
    };

    const saveEditedUnknownItem = () => {
        if (!editingItem || !handleValidation()) return;
        setIsLoading(true);
        const updatedItem: ScannedItem = {
            ...editingItem,
            barcode: editingBarcode.trim(),
            itemName: editingItemName.trim(),
            itemDescription: editingItemDescription.trim(),
            location: editingItemLocation.trim(),
            pointsToRedeem: parseInt(editingItemPointsToRedeem) || 0,
            totalCount: parseInt(editingItemCount),
            group: editingItemGroup.trim(),
        };

        setPendingUnknownItems((prev) => {
            const exists = prev.some(item => item.id === editingItem.id);
            return exists
                ? prev.map(item => (item.id === editingItem.id ? updatedItem : item))
                : [...prev, updatedItem];
        });

        setEditingItem(null);
        setShowUnknownEditModal(false);
        setIsLoading(false);
    };

    const handleCancelUnknownItem = () => {
        setEditingItem(null);
        setValidationErrors({
            barcode: false,
            itemName: false,
            itemDescription: false,
            location: false,
            itemCount: false,
            pointsToRedeem: false,
        });
        setShowUnknownEditModal(false);
    };

    const handleCancelKnownItem = () => {
        setEditingItem(null);
        setValidationErrors({
            barcode: false,
            itemName: false,
            itemDescription: false,
            location: false,
            itemCount: false,
            pointsToRedeem: false,
        });
        setShowEditModal(false)
    }

    const selectedInsufficientStock = [...pendingItems, ...pendingUnknownItems].filter(item => selectedIds.has(item.id)).some(item => item.totalCount < 1 || item.sessionCount > item.totalCount);

    const fetchImagesForAllBarcodes = async () => {
        if (!barcodes || Object.keys(barcodes).length === 0) {
            console.log("Barcodes data not available.");
            return;
        }

        const newImageUrls = {};

        for (const [itemId, item] of Object.entries(barcodes)) {
            let finalUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVNer1ZryNxWVXojlY9Hoyy1-4DVNAmn7lrg&s';

            if (item?.imageUrl) {
                try {
                    const fileName = item.imageUrl.split("/").pop();
                    const response = await server.get(`/api/image/url/${fileName}`);
                    if (response.data?.url) {
                        finalUrl = response.data.url;
                    }
                } catch (err) {
                    console.error(`Error fetching image for ${itemId}:`, err);
                }
            }

            newImageUrls[itemId] = finalUrl;
        }

        setImageUrls(newImageUrls);
    };

    // Update items when realtime database have changes on barcodes
    useEffect(() => {
        if (!barcodes || Object.keys(barcodes).length === 0) return;
        const shouldFetchImages = Object.keys(imageUrls).length !== Object.keys(barcodes).length;
        if (shouldFetchImages) {
            fetchImagesForAllBarcodes();
        }
        const barcodesArray = Object.values(barcodes) as ScannedItem[];

        setPendingItems(prev =>
            prev.map(item => {
                const updated = barcodes[item.id];
                return updated
                    ? {
                        ...item,
                        ...updated,
                    }
                    : item;
            })
        );

        setPendingUnknownItems(prev =>
            prev.map(item => {
                const updated = barcodesArray.find(b => b.barcode === item.barcode);
                return updated
                    ? {
                        ...item,
                        ...updated,
                    }
                    : item;
            })
        );
    }, [barcodes]);

    if (loading)
        return (
            <ProtectedRoute showAuth={true}>
                <LinearGradient colors={isMobileScreen ? ["#00FFDD", "#1B9CFF"] : ["#1B9CFF", "#00FFDD"]} start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }} end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Box style={{ padding: 40, alignItems: "center" }}>
                        <Spinner size="large" />
                    </Box>
                </LinearGradient>
            </ProtectedRoute>
        )

    if (!loading)
        return (
            <ProtectedRoute showAuth={true}>
                <LinearGradient
                    colors={isMobileScreen ? ['#00FFDD', '#1B9CFF'] : ['#1B9CFF', '#00FFDD']}
                    start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                    end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                    style={{ flex: 1 }}
                >
                    <HStack style={{ flex: 1, padding: 16, gap: 16 }}>
                        {isMobileScreen ? (
                            <VStack style={{ flex: 1, gap: isMobileScreen ? 0 : 24 }}>
                                <VStack
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "transparent",
                                        padding: isMobileScreen ? 10 : 24
                                    }}
                                >
                                    <VStack
                                        style={{
                                            width: "100%",
                                            maxWidth: 500,
                                            backgroundColor: "white",
                                            borderRadius: 16,
                                            padding: isMobileScreen ? 10 : 32,
                                            gap: isMobileScreen ? 10 : 24,
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 8,
                                            elevation: 4
                                        }}
                                    >
                                        {/* Title Section */}
                                        <VStack style={{ gap: 8, alignItems: "center" }}>
                                            <ScanIcon size={isMobileScreen ? 40 : 32} color="#3b82f6" style={{ display: isMobileScreen ? "none" : "flex" }} />
                                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b" }}>
                                                {t('scanner.title')}
                                            </Text>
                                        </VStack>

                                        {/* Input Field */}
                                        <VStack style={{ gap: 12 }}>
                                            <Input isDisabled={isLoading} variant="outline">
                                                <InputField
                                                    ref={scanInputRef}
                                                    placeholder={isFocused ? "" : t('scanner.placeholder')}
                                                    value={currentScan}
                                                    onChangeText={(text) => {
                                                        setCurrentScan(text);
                                                        if (text.endsWith("\n")) {
                                                            setCurrentScan(text.trim());
                                                            handleScannedItems();
                                                        }
                                                    }}
                                                    onSubmitEditing={handleScannedItems}
                                                    returnKeyType="done"
                                                    onFocus={() => setIsFocused(true)}
                                                    onBlur={() => setIsFocused(false)}
                                                    style={{
                                                        height: 48,
                                                        fontSize: 16,
                                                        textAlign: "center",
                                                        borderRadius: 8,
                                                        backgroundColor: "#f8fafc"
                                                    }}
                                                />
                                            </Input>

                                            {/* Barcode Type Notice */}
                                            <HStack style={{ gap: 8, alignItems: "center", justifyContent: "center", display: scannedCode.length > 0 ? "none" : "flex" }}>
                                                <AlertTriangleIcon size={isMobileScreen ? 12 : 16} color="#64748b" />
                                                <Text style={{ fontSize: 12, color: "#64748b", textAlign: "center", fontWeight: "500" }}>
                                                    {t('scanner.notice')}
                                                </Text>
                                            </HStack>

                                            <RadioGroup value={currentMode} onChange={setCurrentMode} style={{ justifyContent: "center", alignItems: "center", paddingBottom: pendingItems.length > 0 || pendingUnknownItems.length > 0 ? 0 : 10 }} >
                                                <HStack space="sm" style={{ gap: 30 }}>
                                                    {radioOptions.map(({ value, key }) => (
                                                        <Radio key={value} value={value} size="sm"  >
                                                            <HStack style={{ alignItems: "center", gap: 6 }}>
                                                                <RadioIndicator
                                                                    style={{
                                                                        backgroundColor: "white",
                                                                        borderColor: "#1B9CFF",
                                                                        borderWidth: 2,
                                                                        borderRadius: 9999,
                                                                        width: 16,
                                                                        height: 16,
                                                                        justifyContent: "center",
                                                                        alignItems: "center",
                                                                    }}
                                                                >
                                                                    {currentMode === value && (
                                                                        <RadioIndicator
                                                                            style={{
                                                                                backgroundColor: currentMode === value ? "#1B9CFF" : "white",
                                                                                borderColor: "#1B9CFF",
                                                                                borderWidth: 2,
                                                                                borderRadius: 9999,
                                                                                width: 8,
                                                                                height: 8,
                                                                            }}
                                                                        />
                                                                    )}
                                                                </RadioIndicator>
                                                                <RadioLabel
                                                                    style={{
                                                                        fontSize: 10,
                                                                        fontWeight: "700",
                                                                        color: currentMode === value ? "#1B9CFF" : "#64748b",
                                                                    }}
                                                                >
                                                                    {t(key)}
                                                                </RadioLabel>
                                                            </HStack>
                                                        </Radio>
                                                    ))}
                                                </HStack>
                                            </RadioGroup>
                                        </VStack>

                                        {/* Scanned Result Display */}
                                        {scannedCode && (
                                            <VStack
                                                style={{
                                                    backgroundColor: "#f0fdf4",
                                                    borderRadius: 8,
                                                    padding: isMobileScreen ? 6 : 16,
                                                    alignItems: "center"
                                                }}
                                            >
                                                <HStack style={{ gap: 8, alignItems: "center", justifyContent: "center", }}>
                                                    <CheckCircleIcon size={isMobileScreen ? 14 : 20} color="#16a34a" />
                                                    <Text style={{ fontSize: 14, fontWeight: "500", color: "#166534" }}>
                                                        {t('scanner.scannedResult.lastScanned')}
                                                    </Text>
                                                </HStack>
                                                <Text
                                                    isTruncated={true}
                                                    style={{
                                                        fontSize: isMobileScreen ? 20 : 18,
                                                        fontWeight: "600",
                                                        color: "#166534",
                                                        letterSpacing: 2,
                                                        width: "90%",
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    {scannedCode}
                                                </Text>
                                            </VStack>
                                        )}
                                    </VStack>
                                </VStack>

                                <VStack
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "transparent",
                                        padding: isMobileScreen ? 10 : 24
                                    }}
                                >
                                    <VStack style={{ flex: 1, width: "100%" }}>
                                        <ScrollView style={{ flex: 1, width: "100%", padding: 0 }}>
                                            <VStack style={{ gap: 16 }}>
                                                {Object.entries(groupedItems).length > 0 ? (
                                                    Object.entries(groupedItems).map(([group, items]) => (
                                                        <VStack key={group} style={{
                                                            gap: 12, backgroundColor: "white", padding: 16, borderRadius: 24,
                                                            shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
                                                            shadowRadius: 12, elevation: 8, marginVertical: 8
                                                        }}>
                                                            {/* Group Header */}
                                                            <HStack style={{
                                                                alignItems: "center", gap: 10, padding: 12,
                                                                backgroundColor: "#eef2ff", borderRadius: 16, marginBottom: 8, flex: 1
                                                            }}>
                                                                <Box style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Checkbox
                                                                        value={`select-group-${group}`}
                                                                        size="md"
                                                                        isChecked={areAllGroupItemsSelected(items)}
                                                                        onChange={() => toggleSelectGroup(group)}
                                                                        style={{
                                                                            display: currentMode === "info" ? "none" : "flex",
                                                                        }}
                                                                    >
                                                                        <CheckboxIndicator style={{
                                                                            backgroundColor: areAllGroupItemsSelected(items) ? "#1B9CFF" : "white",
                                                                            borderColor: "#1B9CFF",
                                                                            borderRadius: 6
                                                                        }}>
                                                                            <CheckboxIcon as={CheckIcon} color="white" />
                                                                        </CheckboxIndicator>
                                                                    </Checkbox>
                                                                </Box>
                                                                <Text style={{
                                                                    fontSize: 20, fontWeight: "900", color: "#4f46e5",
                                                                    letterSpacing: -0.5, textTransform: "uppercase"
                                                                }}>
                                                                    {t(`itemsManagement.groups.${group}`, { defaultValue: group })}
                                                                </Text>
                                                            </HStack>

                                                            {items.map((item) => (
                                                                <VStack
                                                                    key={item.id}
                                                                    style={{
                                                                        backgroundColor: currentMode === "dispatch" && item.sessionCount > item.totalCount ? "#FEE2E2" : "#ffffff",
                                                                        borderRadius: 20,
                                                                        padding: 16,
                                                                        marginVertical: 4,
                                                                        shadowColor: "#000",
                                                                        shadowOffset: { width: 0, height: 2 },
                                                                        shadowOpacity: 0.05,
                                                                        shadowRadius: 6,
                                                                        elevation: 2,
                                                                    }}
                                                                >
                                                                    <Box
                                                                        style={{
                                                                            justifyContent: "center",
                                                                            alignSelf: "center",
                                                                            marginBottom: 20,
                                                                            width: isTinyScreen ? 36 : 90,
                                                                            height: isTinyScreen ? 36 : 90,
                                                                            borderRadius: 8,
                                                                            overflow: 'hidden',
                                                                        }}
                                                                    >
                                                                        <Image
                                                                            size="lg"
                                                                            source={{
                                                                                uri:
                                                                                    imageUrls[item.id] ||
                                                                                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVNer1ZryNxWVXojlY9Hoyy1-4DVNAmn7lrg&s',
                                                                            }}
                                                                            alt="item image"
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                    <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
                                                                        {/* Selection & Main Info */}
                                                                        <HStack style={{ flex: 1, gap: 12, alignItems: "center" }}>
                                                                            <Box style={{ position: 'relative' }}>
                                                                                <Checkbox
                                                                                    value="selectItems"
                                                                                    size="md"
                                                                                    isChecked={selectedIds.has(item.id)}
                                                                                    onChange={() => toggleSelect(item.id)}
                                                                                    style={{
                                                                                        display: currentMode === "info" ? "none" : "flex",
                                                                                    }}
                                                                                >
                                                                                    <CheckboxIndicator style={{
                                                                                        backgroundColor: selectedIds.has(item.id) ? "#1B9CFF" : "white",
                                                                                        borderColor: "#1B9CFF",
                                                                                        borderRadius: 6
                                                                                    }}>
                                                                                        <CheckboxIcon as={CheckIcon} color="white" />
                                                                                    </CheckboxIndicator>
                                                                                </Checkbox>
                                                                            </Box>

                                                                            {/* Item Details */}
                                                                            <VStack style={{ flex: 1, gap: 6 }}>
                                                                                <HStack style={{ alignItems: "center", gap: 8, justifyContent: "flex-start", flexWrap: "wrap", width: "100%" }}>
                                                                                    <Text isTruncated={true} style={{
                                                                                        fontSize: isMobileScreen ? 20 : 18, fontWeight: "800", color: "#1e293b",
                                                                                        textShadowColor: "rgba(79, 70, 229, 0.1)",
                                                                                        textShadowOffset: { width: 1, height: 1 },
                                                                                        textShadowRadius: 2,
                                                                                        width: "auto"
                                                                                    }}>
                                                                                        {item.barcode}
                                                                                    </Text>
                                                                                    <Box
                                                                                        style={{
                                                                                            backgroundColor: "#f1f5f9",
                                                                                            paddingHorizontal: 6,
                                                                                            paddingVertical: 2,
                                                                                            borderRadius: 6,
                                                                                            flexDirection: "row",
                                                                                            gap: 6,
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center",
                                                                                            alignSelf: "center",
                                                                                        }}
                                                                                    >
                                                                                        {/* <Button onPress={() => handleDecrease(item.barcode)} style={{ backgroundColor: "transparent" }}>
                                                                                                <ButtonText style={{ fontSize: 18, fontWeight: "700", color: "#94a3b8" }}>−</ButtonText>
                                                                                            </Button> */}

                                                                                        <Text
                                                                                            style={{
                                                                                                fontSize: 16,
                                                                                                fontWeight: "700",
                                                                                                color: "#64748b",
                                                                                                textAlign: "center",
                                                                                                minWidth: 28,
                                                                                            }}
                                                                                        >
                                                                                            X{item.sessionCount}
                                                                                        </Text>

                                                                                        {/* <Button onPress={() => handleIncrease(item.barcode)} disabled={currentMode === "dispatch" && item.sessionCount >= item.totalCount} style={{ backgroundColor: "transparent" }}>
                                                                                                <ButtonText style={{ fontSize: 18, fontWeight: "700", color: "#94a3b8" }}>+</ButtonText>
                                                                                            </Button> */}
                                                                                    </Box>
                                                                                </HStack>

                                                                                <Text isTruncated={true} style={{
                                                                                    fontSize: isMobileScreen ? 20 : 18,
                                                                                    fontWeight: "600",
                                                                                    color: "#334155",
                                                                                    fontStyle: item.itemName ? "normal" : "italic"
                                                                                }}>
                                                                                    {item.itemName || t('scanner.item.unnamed')}
                                                                                </Text>

                                                                                <Text isTruncated={true} style={{
                                                                                    fontSize: isMobileScreen ? 12 : 14,
                                                                                    fontWeight: "600",
                                                                                    color: "#334155",
                                                                                    fontStyle: item.itemName ? "normal" : "italic"
                                                                                }}>
                                                                                    {item.itemDescription || t('scanner.item.noDescription')}
                                                                                </Text>

                                                                                <HStack style={{ gap: 8, flexWrap: "wrap" }}>
                                                                                    <HStack style={{
                                                                                        backgroundColor: "#f8fafc",
                                                                                        padding: 6,
                                                                                        borderRadius: 8,
                                                                                        alignItems: "center",
                                                                                        gap: 4
                                                                                    }}>
                                                                                        <WarehouseIcon size={14} color="#94a3b8" style={{ minWidth: 14 }} />
                                                                                        <Text isTruncated={true} style={{ fontSize: 14, color: "#64748b", fontWeight: "500" }}>
                                                                                            {item.location || t('scanner.item.unknownLocation')}
                                                                                        </Text>
                                                                                    </HStack>

                                                                                    <HStack style={{
                                                                                        backgroundColor: item.totalCount <= 10 ? "#fef2f2" : item.totalCount <= 100 ? "#fefce8" : "#f0fdf4",
                                                                                        padding: 6,
                                                                                        borderRadius: 8,
                                                                                        alignItems: "center",
                                                                                        gap: 8
                                                                                    }}>
                                                                                        <Box style={{ minWidth: 8, width: 8, height: 8, backgroundColor: item.totalCount <= 10 ? "#fca5a5" : item.totalCount <= 100 ? "#fde68a" : "#86efac", borderRadius: 4, marginLeft: 4 }} />
                                                                                        <Text isTruncated={true} style={{
                                                                                            fontSize: 14,
                                                                                            color: item.totalCount <= 10 ? "#991b1b" : item.totalCount <= 100 ? "#92400e" : "#166534",
                                                                                            fontWeight: "600"
                                                                                        }}>
                                                                                            {t('scanner.stock', { count: item.totalCount })}
                                                                                        </Text>
                                                                                    </HStack>
                                                                                </HStack>
                                                                            </VStack>
                                                                        </HStack>

                                                                        {/* Action Buttons */}
                                                                        <HStack style={{ gap: 8, alignItems: "center" }}>
                                                                            <Button
                                                                                size="md"
                                                                                action="secondary"
                                                                                onPress={() => handleEdit(item)}
                                                                                isDisabled={isLoading}
                                                                                style={{
                                                                                    padding: 8,
                                                                                    borderRadius: 12,
                                                                                    backgroundColor: "transparent"
                                                                                }}
                                                                            >
                                                                                <PencilIcon size={20} color="#4f46e5" />
                                                                            </Button>

                                                                            <Button
                                                                                size="md"
                                                                                action="secondary"
                                                                                onPress={() => handleRemove(item.id)}
                                                                                isDisabled={isLoading}
                                                                                style={{
                                                                                    padding: 8,
                                                                                    borderRadius: 12,
                                                                                    backgroundColor: "transparent"
                                                                                }}
                                                                            >
                                                                                <MinusCircleIcon size={20} color="#dc2626" />
                                                                            </Button>
                                                                        </HStack>
                                                                    </HStack>

                                                                    {/* Points Display*/}
                                                                    <HStack style={{
                                                                        marginTop: 12,
                                                                        padding: 10,
                                                                        borderRadius: 12,
                                                                        backgroundColor: "rgba(255, 215, 0, 0.1)",
                                                                        borderWidth: 1,
                                                                        borderColor: "rgba(255, 215, 0, 0.3)",
                                                                        alignItems: "center",
                                                                        gap: 8
                                                                    }}>
                                                                        <SparklesIcon size={16} color="#eab308" style={{ minWidth: 16 }} />
                                                                        <Text isTruncated={true} style={{
                                                                            fontSize: 16,
                                                                            fontWeight: "700",
                                                                            color: "#eab308",
                                                                            textShadowColor: "rgba(234, 179, 8, 0.2)",
                                                                            textShadowOffset: { width: 0, height: 0 },
                                                                            textShadowRadius: 4
                                                                        }}>
                                                                            {t('scanner.requiredPoints', { count: item.pointsToRedeem })}
                                                                        </Text>
                                                                    </HStack>
                                                                </VStack>
                                                            ))}
                                                        </VStack>
                                                    ))
                                                ) : (
                                                    <VStack
                                                        style={{
                                                            margin: "auto",
                                                            width: "100%",
                                                            maxWidth: 500,
                                                            backgroundColor: "#f8fafc",
                                                            borderRadius: 16,
                                                            padding: 32,
                                                            gap: 16,
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            shadowColor: "#000",
                                                            shadowOffset: { width: 0, height: 4 },
                                                            shadowOpacity: 0.1,
                                                            shadowRadius: 8,
                                                            elevation: 4,
                                                        }}
                                                    >
                                                        <HStack style={{ gap: 8, alignItems: "center" }}>
                                                            <ScanIcon size={24} color="#3b82f6" />
                                                            <Text
                                                                style={{
                                                                    fontSize: 14,
                                                                    fontWeight: "600",
                                                                    color: "black",
                                                                    textAlign: "center",
                                                                    letterSpacing: 1
                                                                }}
                                                            >
                                                                {t('scanner.emptyState.title')}
                                                            </Text>
                                                        </HStack>
                                                    </VStack>
                                                )}
                                            </VStack>
                                        </ScrollView>
                                    </VStack>
                                </VStack>
                            </VStack>
                        ) : (
                            <>
                                <VStack
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "transparent",
                                    }}
                                >
                                    <VStack
                                        style={{
                                            width: "100%",
                                            maxWidth: 500,
                                            backgroundColor: "white",
                                            borderRadius: 16,
                                            padding: 32,
                                            gap: 24,
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 8,
                                            elevation: 4
                                        }}
                                    >
                                        {/* Title Section */}
                                        <VStack style={{ gap: 8, alignItems: "center" }}>
                                            <ScanIcon size={32} color="#3b82f6" />
                                            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1e293b" }}>
                                                {t('scanner.title')}
                                            </Text>
                                        </VStack>

                                        {/* Input Field */}
                                        <VStack style={{ gap: 12 }}>
                                            <Input isDisabled={isLoading} variant="outline">
                                                <InputField
                                                    ref={scanInputRef}
                                                    placeholder={isFocused ? "" : t('scanner.placeholder')}
                                                    value={currentScan}
                                                    onChangeText={(text) => {
                                                        setCurrentScan(text);
                                                        if (text.endsWith("\n")) {
                                                            setCurrentScan(text.trim());
                                                            handleScannedItems();
                                                        }
                                                    }}
                                                    onSubmitEditing={handleScannedItems}
                                                    returnKeyType="done"
                                                    onFocus={() => setIsFocused(true)}
                                                    onBlur={() => setIsFocused(false)}
                                                    style={{
                                                        height: 48,
                                                        fontSize: 16,
                                                        textAlign: "center",
                                                        borderRadius: 8,
                                                        backgroundColor: "#f8fafc"
                                                    }}
                                                />
                                            </Input>

                                            {/* Barcode Type Notice */}
                                            <HStack style={{ gap: 8, alignItems: "center", justifyContent: "center" }}>
                                                <AlertTriangleIcon size={16} color="#64748b" />
                                                <Text style={{ fontSize: 12, color: "#64748b", textAlign: "center", fontWeight: "500" }}>
                                                    {t('scanner.notice')}
                                                </Text>
                                            </HStack>

                                            <RadioGroup value={currentMode} onChange={setCurrentMode} style={{ justifyContent: "center", alignItems: "center", marginTop: 8 }} >
                                                <HStack space="sm" style={{ gap: 10 }}>
                                                    {radioOptions.map(({ value, key }) => (
                                                        <Radio key={value} value={value} size="sm"  >
                                                            <HStack style={{ alignItems: "center", gap: 6 }}>
                                                                <RadioIndicator
                                                                    style={{
                                                                        backgroundColor: "white",
                                                                        borderColor: "#1B9CFF",
                                                                        borderWidth: 2,
                                                                        borderRadius: 9999,
                                                                        width: 18,
                                                                        height: 18,
                                                                        justifyContent: "center",
                                                                        alignItems: "center",
                                                                    }}
                                                                >
                                                                    {currentMode === value && (
                                                                        <RadioIndicator
                                                                            style={{
                                                                                backgroundColor: currentMode === value ? "#1B9CFF" : "white",
                                                                                borderColor: "#1B9CFF",
                                                                                borderWidth: 2,
                                                                                borderRadius: 9999,
                                                                                width: 10,
                                                                                height: 10,
                                                                            }}
                                                                        />
                                                                    )}
                                                                </RadioIndicator>
                                                                <RadioLabel
                                                                    style={{
                                                                        fontSize: 14,
                                                                        fontWeight: "700",
                                                                        color: currentMode === value ? "#1B9CFF" : "#64748b",
                                                                    }}
                                                                >
                                                                    {t(`scanner.radio.${value}`)}
                                                                </RadioLabel>
                                                            </HStack>
                                                        </Radio>
                                                    ))}
                                                </HStack>
                                            </RadioGroup>
                                        </VStack>

                                        {/* Scanned Result Display */}
                                        {scannedCode && (
                                            <VStack
                                                style={{
                                                    backgroundColor: "#f0fdf4",
                                                    borderRadius: 8,
                                                    padding: 16,
                                                    gap: 8,
                                                    alignItems: "center"
                                                }}
                                            >
                                                <HStack style={{ gap: 8, alignItems: "center" }}>
                                                    <CheckCircleIcon size={20} color="#16a34a" />
                                                    <Text style={{ fontSize: 14, fontWeight: "500", color: "#166534" }}>
                                                        {t('scanner.scannedResult.lastScanned')}
                                                    </Text>
                                                </HStack>
                                                <Text
                                                    isTruncated={true}
                                                    style={{
                                                        fontSize: 24,
                                                        fontWeight: "600",
                                                        color: "#166534",
                                                        letterSpacing: 2,
                                                        width: "90%",
                                                        textAlign: "center"
                                                    }}
                                                >
                                                    {scannedCode}
                                                </Text>
                                            </VStack>
                                        )}
                                    </VStack>
                                </VStack>

                                <VStack
                                    style={{
                                        flex: 1,
                                        justifyContent: "center",
                                        alignItems: "flex-start",
                                        backgroundColor: "transparent",
                                        padding: isShortScreen ? 0 : pendingItems.length > 0 || pendingUnknownItems.length > 0 ? isSmallLaptop ? 10 : isMediumLaptop ? 30 : 100 : 0,
                                    }}
                                >
                                    <VStack style={{ width: "100%" }}>
                                        <ScrollView style={{ flex: 1, width: "100%", padding: 10 }}>
                                            <VStack style={{ gap: 16 }}>
                                                {Object.entries(groupedItems).length > 0 ? (
                                                    Object.entries(groupedItems).map(([group, items]) => (
                                                        <VStack key={group} style={{
                                                            gap: 12, backgroundColor: "white", padding: 16, borderRadius: 24,
                                                            shadowColor: "#4f46e5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
                                                            shadowRadius: 12, elevation: 8, marginVertical: 8
                                                        }}>
                                                            {/* Group Header */}
                                                            <HStack style={{
                                                                alignItems: "center", gap: 10, padding: 12,
                                                                backgroundColor: "#eef2ff", borderRadius: 16, flex: 1
                                                            }}>
                                                                <Box style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Checkbox
                                                                        value={`select-group-${group}`}
                                                                        size="md"
                                                                        isChecked={areAllGroupItemsSelected(items)}
                                                                        onChange={() => toggleSelectGroup(group)}
                                                                        style={{
                                                                            display: currentMode === "info" ? "none" : "flex",
                                                                        }}
                                                                    >
                                                                        <CheckboxIndicator style={{
                                                                            backgroundColor: areAllGroupItemsSelected(items) ? "#1B9CFF" : "white",
                                                                            borderColor: "#1B9CFF",
                                                                            borderRadius: 6
                                                                        }}>
                                                                            <CheckboxIcon as={CheckIcon} color="white" />
                                                                        </CheckboxIndicator>
                                                                    </Checkbox>
                                                                </Box>
                                                                <Text style={{
                                                                    fontSize: 20, fontWeight: "900", color: "#4f46e5",
                                                                    letterSpacing: -0.5, textTransform: "uppercase"
                                                                }}>
                                                                    {t(`itemsManagement.groups.${group}`, { defaultValue: group })}
                                                                </Text>
                                                            </HStack>

                                                            {items.map((item) => (
                                                                <VStack
                                                                    key={item.id}
                                                                    style={{
                                                                        backgroundColor: currentMode === "dispatch" && item.sessionCount > item.totalCount ? "#FEE2E2" : "#ffffff",
                                                                        borderRadius: 20,
                                                                        padding: 16,
                                                                        shadowColor: "#000",
                                                                        shadowOffset: { width: 0, height: 2 },
                                                                        shadowOpacity: 0.05,
                                                                        shadowRadius: 6,
                                                                        elevation: 2
                                                                    }}
                                                                >
                                                                    <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
                                                                        {/* Selection & Main Info */}
                                                                        <HStack style={{ flex: 1, gap: 12, alignItems: "center" }}>
                                                                            <Box style={{ position: 'relative' }}>
                                                                                <Checkbox
                                                                                    value="selectItems"
                                                                                    size="md"
                                                                                    isChecked={selectedIds.has(item.id)}
                                                                                    onChange={() => toggleSelect(item.id)}
                                                                                    style={{
                                                                                        display: currentMode === "info" ? "none" : "flex",
                                                                                    }}
                                                                                >
                                                                                    <CheckboxIndicator style={{
                                                                                        backgroundColor: selectedIds.has(item.id) ? "#1B9CFF" : "white",
                                                                                        borderColor: "#1B9CFF",
                                                                                        borderRadius: 6
                                                                                    }}>
                                                                                        <CheckboxIcon as={CheckIcon} color="white" />
                                                                                    </CheckboxIndicator>
                                                                                </Checkbox>
                                                                            </Box>

                                                                            <Box
                                                                                style={{
                                                                                    width: isTinyScreen ? 36 : 90,
                                                                                    height: isTinyScreen ? 36 : 90,
                                                                                    borderRadius: 8,
                                                                                    overflow: 'hidden',
                                                                                }}
                                                                            >
                                                                                <Image
                                                                                    size="lg"
                                                                                    source={{
                                                                                        uri:
                                                                                            imageUrls[item.id] ||
                                                                                            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVNer1ZryNxWVXojlY9Hoyy1-4DVNAmn7lrg&s',
                                                                                    }}
                                                                                    alt="item image"
                                                                                    style={{
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                    }}
                                                                                />
                                                                            </Box>

                                                                            {/* Item Details */}
                                                                            <VStack style={{ flex: 1, gap: 6 }}>
                                                                                <HStack style={{ alignItems: "center", gap: 8, justifyContent: "flex-start", flexWrap: "wrap", width: "100%" }}>
                                                                                    <Text isTruncated={true} style={{
                                                                                        fontSize: isMobileScreen ? 20 : 18, fontWeight: "800", color: "#1e293b",
                                                                                        textShadowColor: "rgba(79, 70, 229, 0.1)",
                                                                                        textShadowOffset: { width: 1, height: 1 },
                                                                                        textShadowRadius: 2,
                                                                                        width: "auto"
                                                                                    }}>
                                                                                        {item.barcode}
                                                                                    </Text>
                                                                                    <Box
                                                                                        style={{
                                                                                            backgroundColor: "#f1f5f9",
                                                                                            paddingHorizontal: 6,
                                                                                            paddingVertical: 2,
                                                                                            borderRadius: 6,
                                                                                            flexDirection: "row",
                                                                                            alignItems: "center",
                                                                                            justifyContent: "center",
                                                                                            alignSelf: "center",
                                                                                        }}
                                                                                    >
                                                                                        {/* <Button onPress={() => handleDecrease(item.barcode)} style={{ backgroundColor: "transparent" }}>
                                                                                                <ButtonText style={{ fontSize: 18, fontWeight: "700", color: "#94a3b8" }}>−</ButtonText>
                                                                                            </Button> */}

                                                                                        <Text
                                                                                            style={{
                                                                                                fontSize: 16,
                                                                                                fontWeight: "700",
                                                                                                color: "#64748b",
                                                                                                textAlign: "center",
                                                                                                minWidth: 28,
                                                                                            }}
                                                                                        >
                                                                                            X{item.sessionCount}
                                                                                        </Text>

                                                                                        {/* <Button onPress={() => handleIncrease(item.barcode)} disabled={currentMode === "dispatch" && item.sessionCount >= item.totalCount} style={{ backgroundColor: "transparent" }}>
                                                                                                <ButtonText style={{ fontSize: 18, fontWeight: "700", color: "#94a3b8" }}>+</ButtonText>
                                                                                            </Button> */}
                                                                                    </Box>
                                                                                </HStack>

                                                                                <Text isTruncated={true} style={{
                                                                                    fontSize: isMobileScreen ? 20 : 18,
                                                                                    fontWeight: "600",
                                                                                    color: "#334155",
                                                                                    fontStyle: item.itemName ? "normal" : "italic"
                                                                                }}>
                                                                                    {item.itemName || t('scanner.item.unnamed')}
                                                                                </Text>

                                                                                <Text isTruncated={true} style={{
                                                                                    fontSize: isMobileScreen ? 12 : 14,
                                                                                    fontWeight: "600",
                                                                                    color: "#334155",
                                                                                    fontStyle: item.itemName ? "normal" : "italic"
                                                                                }}>
                                                                                    {item.itemDescription || t('scanner.item.noDescription')}
                                                                                </Text>

                                                                                <HStack style={{ gap: 8, flexWrap: "wrap" }}>
                                                                                    <HStack style={{
                                                                                        backgroundColor: "#f8fafc",
                                                                                        padding: 6,
                                                                                        borderRadius: 8,
                                                                                        alignItems: "center",
                                                                                        gap: 4
                                                                                    }}>
                                                                                        <WarehouseIcon size={14} color="#94a3b8" style={{ minWidth: 14 }} />
                                                                                        <Text isTruncated={true} style={{ fontSize: 14, color: "#64748b", fontWeight: "500" }}>
                                                                                            {item.location || t('scanner.item.unknownLocation')}
                                                                                        </Text>
                                                                                    </HStack>

                                                                                    <HStack style={{
                                                                                        backgroundColor: item.totalCount <= 10 ? "#fef2f2" : item.totalCount <= 100 ? "#fefce8" : "#f0fdf4",
                                                                                        padding: 6,
                                                                                        borderRadius: 8,
                                                                                        alignItems: "center",
                                                                                        gap: 8
                                                                                    }}>
                                                                                        <Box style={{ minWidth: 8, width: 8, height: 8, backgroundColor: item.totalCount <= 10 ? "#fca5a5" : item.totalCount <= 100 ? "#fde68a" : "#86efac", borderRadius: 4, marginLeft: 4 }} />
                                                                                        <Text isTruncated={true} style={{
                                                                                            fontSize: 14,
                                                                                            color: item.totalCount <= 10 ? "#991b1b" : item.totalCount <= 100 ? "#92400e" : "#166534",
                                                                                            fontWeight: "600"
                                                                                        }}>
                                                                                            {t('scanner.stock', { count: item.totalCount })}
                                                                                        </Text>
                                                                                    </HStack>
                                                                                </HStack>
                                                                            </VStack>
                                                                        </HStack>

                                                                        {/* Action Buttons */}
                                                                        <HStack style={{ alignItems: "center" }}>
                                                                            <Button
                                                                                size="md"
                                                                                action="secondary"
                                                                                onPress={() => handleEdit(item)}
                                                                                isDisabled={isLoading}
                                                                                style={{
                                                                                    padding: 8,
                                                                                    borderRadius: 12,
                                                                                    backgroundColor: "transparent"
                                                                                }}
                                                                            >
                                                                                <PencilIcon size={20} color="#4f46e5" />
                                                                            </Button>

                                                                            <Button
                                                                                size="md"
                                                                                action="secondary"
                                                                                onPress={() => handleRemove(item.id)}
                                                                                isDisabled={isLoading}
                                                                                style={{
                                                                                    padding: 8,
                                                                                    borderRadius: 12,
                                                                                    backgroundColor: "transparent"
                                                                                }}
                                                                            >
                                                                                <MinusCircleIcon size={20} color="#dc2626" />
                                                                            </Button>
                                                                        </HStack>
                                                                    </HStack>

                                                                    {/* Points Display*/}
                                                                    <HStack style={{
                                                                        marginTop: 12,
                                                                        padding: 10,
                                                                        borderRadius: 12,
                                                                        backgroundColor: "rgba(255, 215, 0, 0.1)",
                                                                        borderWidth: 1,
                                                                        borderColor: "rgba(255, 215, 0, 0.3)",
                                                                        alignItems: "center",
                                                                        gap: 8
                                                                    }}>
                                                                        <SparklesIcon size={16} color="#eab308" style={{ minWidth: 16 }} />
                                                                        <Text isTruncated={true} style={{
                                                                            fontSize: 16,
                                                                            fontWeight: "700",
                                                                            color: "#eab308",
                                                                            textShadowColor: "rgba(234, 179, 8, 0.2)",
                                                                            textShadowOffset: { width: 0, height: 0 },
                                                                            textShadowRadius: 4
                                                                        }}>
                                                                            {t('scanner.requiredPoints', { count: item.pointsToRedeem })}
                                                                        </Text>
                                                                    </HStack>
                                                                </VStack>
                                                            ))}
                                                        </VStack>
                                                    ))
                                                ) : (
                                                    <VStack
                                                        style={{
                                                            margin: "auto",
                                                            width: "100%",
                                                            maxWidth: 500,
                                                            backgroundColor: "#f8fafc",
                                                            borderRadius: 16,
                                                            padding: 32,
                                                            gap: 16,
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            shadowColor: "#000",
                                                            shadowOffset: { width: 0, height: 4 },
                                                            shadowOpacity: 0.1,
                                                            shadowRadius: 8,
                                                            elevation: 4
                                                        }}
                                                    >
                                                        <HStack style={{ gap: 8, alignItems: "center" }}>
                                                            <ScanIcon size={24} color="#3b82f6" />
                                                            <Text
                                                                style={{
                                                                    fontSize: 16,
                                                                    fontWeight: "600",
                                                                    color: "black",
                                                                    textAlign: "center",
                                                                    letterSpacing: 1
                                                                }}
                                                            >
                                                                {t('scanner.emptyState.title')}
                                                            </Text>
                                                        </HStack>
                                                    </VStack>
                                                )}
                                            </VStack>
                                        </ScrollView>
                                    </VStack>
                                </VStack>
                            </>
                        )}
                    </HStack>
                    <HStack
                        style={{
                            justifyContent: currentMode === "info" ? "center" : "space-between",
                            paddingTop: 12,
                            paddingBottom: 12,
                            paddingLeft: isMobileScreen ? 10 : 20,
                            paddingRight: isMobileScreen ? 10 : 20,
                            backgroundColor: "white",
                            display: (pendingItems.length + pendingUnknownItems.length) > 0 ? "flex" : "none",
                        }}
                    >
                        <HStack space={isTinyScreen ? "xs" : isMobileScreen ? "xs" : "md"} style={{ alignItems: "center", width: "auto" }}>
                            <Checkbox
                                value="selectAll"
                                size={isMobileScreen ? "sm" : "md"}
                                isChecked={allSelected}
                                onChange={(isChecked) => {
                                    isChecked ? selectAll() : unselectAll();
                                }}
                                style={{
                                    display: currentMode !== "info" ? "flex" : "none"
                                }}
                            >
                                <CheckboxIndicator style={{ backgroundColor: allSelected ? "#1B9CFF" : "white", borderColor: "#1B9CFF", borderRadius: 6 }}>
                                    <CheckboxIcon as={CheckIcon} color="white" />
                                </CheckboxIndicator>
                            </Checkbox>
                            <Text size={isMobileScreen ? "xs" : "md"} style={{ color: "black", display: currentMode !== "info" ? "flex" : "none" }} >
                                {allSelected ? t('scanner.footer.unselectAll') : t('scanner.footer.selectAll')}
                            </Text>
                            <Button
                                variant="solid"
                                action="negative"
                                size={isMobileScreen ? "xs" : "md"}
                                onPress={handleClearResults}
                                isDisabled={isLoading}
                            >
                                <MinusCircleIcon size={14} color="white" style={{ display: isTinyScreen ? "flex" : isMobileScreen ? "none" : "flex" }} />
                                {!isTinyScreen && (
                                    <ButtonText size={isMobileScreen ? "sm" : "md"} style={{ color: "white" }}>{t('scanner.footer.clearAll')}</ButtonText>
                                )}
                            </Button>
                        </HStack>

                        <HStack space={isTinyScreen ? "xs" : isMobileScreen && currentMode === "dispatch" ? "xs" : "xl"} style={{ alignItems: "center", width: "auto" }}>
                            <Button
                                onPress={() => setShowReceiveModal(true)}
                                isDisabled={selectedIds.size === 0 || isLoading}
                                size={isTinyScreen ? "xs" : isMobileScreen ? "sm" : "md"}
                                style={{
                                    display: currentMode === "receive" ? "flex" : "none",
                                    backgroundColor: "#1B9CFF",
                                    opacity: selectedIds.size === 0 || isLoading ? 0.5 : 1,
                                }}
                            >
                                <ArrowDownCircle size={14} color="white" style={{ display: isTinyScreen ? "flex" : isMobileScreen ? "none" : "flex" }} />
                                {!isTinyScreen && (
                                    <ButtonText size={isMobileScreen ? "sm" : "md"} style={{ color: "white" }} >{t('scanner.footer.receive')}</ButtonText>
                                )}
                            </Button>

                            {currentMode === "dispatch" && (
                                <HStack space="sm" style={{ alignItems: "center", display: "flex", width: "auto", justifyContent: "flex-end" }}>
                                    {selectedInsufficientStock && (
                                        <Text
                                            size={isTinyScreen ? "2xs" : isMobileScreen ? "2xs" : "md"}
                                            style={{ color: "red", fontSize: 12, fontWeight: "500", display: isTinyScreen ? "none" : "flex", textAlign: "right" }}
                                        >
                                            {t('scanner.footer.insufficientStock')}
                                        </Text>
                                    )}
                                    <Button
                                        onPress={() => setShowDispatchModal(true)}
                                        isDisabled={selectedIds.size === 0 || isLoading || selectedInsufficientStock}
                                        size={isTinyScreen ? "xs" : isMobileScreen ? "sm" : "md"}
                                        style={{
                                            backgroundColor: "#1B9CFF",
                                            opacity: selectedIds.size === 0 || isLoading || selectedInsufficientStock ? 0.5 : 1,
                                        }}
                                    >
                                        <ArrowUpCircle size={14} color="white" style={{ display: isTinyScreen ? "flex" : isMobileScreen ? "none" : "flex" }} />
                                        {!isTinyScreen && (
                                            <ButtonText size={isMobileScreen ? "sm" : "md"} style={{ color: "white" }} >{t('scanner.footer.dispatch')}</ButtonText>
                                        )}
                                    </Button>
                                </HStack>
                            )}
                        </HStack>
                    </HStack>

                    {/* Known Items Editing Modal */}
                    <Modal isOpen={showEditModal} onClose={handleCancelKnownItem} size="lg">
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader>
                                <Heading size="md" className="text-typography-950">{t('itemsManagement.editModal.title')}</Heading>
                                <ModalCloseButton style={{ backgroundColor: "transparent" }}>
                                    <Icon as={CloseIcon} size="md" className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900" />
                                </ModalCloseButton>
                            </ModalHeader>

                            <ModalBody>
                                {/* Barcode */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.barcode}>
                                    <FormControlLabel>
                                        <FormControlLabelText>{t('itemsManagement.editModal.barcode')}</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingBarcode} onChangeText={setEditingBarcode} placeholder={t('itemsManagement.editModal.barcode')} style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.barcode && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red", fontSize: 12 }}>* {t('itemsManagement.editModal.validation.barcode')}</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                {/* Item Name */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.itemName}>
                                    <FormControlLabel>
                                        <FormControlLabelText>{t('itemsManagement.editModal.itemName')}</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemName} onChangeText={setEditingItemName} placeholder={t('itemsManagement.editModal.itemName')} style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.itemName && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red", fontSize: 12 }}>* {t('itemsManagement.editModal.validation.itemName')}</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                {/* Item Description */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.itemDescription}>
                                    <FormControlLabel>
                                        <FormControlLabelText>{t('itemsManagement.editModal.itemDescription')}</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemDescription} onChangeText={setEditingItemDescription} placeholder={t('itemsManagement.editModal.itemDescription')} style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.itemDescription && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red", fontSize: 12 }}>* {t('itemsManagement.editModal.validation.itemDescription')}</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                {/* Item Group (no validation needed) */}
                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel>
                                        <FormControlLabelText>{t('itemsManagement.editModal.itemGroup')}</FormControlLabelText>
                                    </FormControlLabel>
                                    <Select
                                        isDisabled={isLoading}
                                        selectedValue={editingItemGroup}
                                        onValueChange={(value) => {
                                            setEditingItemGroup(value);
                                            setIsSelectOpen(false);
                                        }}
                                        onOpen={() => setIsSelectOpen(true)}
                                        onClose={() => setIsSelectOpen(false)}
                                    >
                                        <SelectTrigger variant="outline" size="md" style={{ height: 40, alignItems: "center", justifyContent: isMobileScreen ? "flex-start" : "space-between" }}>
                                            <SelectInput value={t(`itemsManagement.groups.${editingItemGroup}`)} placeholder={t('itemsManagement.editModal.itemGroup')} />
                                            <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                        </SelectTrigger>
                                        <SelectPortal>
                                            <SelectBackdrop />
                                            <SelectContent>
                                                <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                                {Object.entries(t('itemsManagement.groups', { returnObjects: true })).map(([value, label]) => (
                                                    <SelectItem key={value} label={label} value={value} />
                                                ))}
                                            </SelectContent>
                                        </SelectPortal>
                                    </Select>
                                </FormControl>

                                {/* Location */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.location}>
                                    <FormControlLabel>
                                        <FormControlLabelText>{t('itemsManagement.editModal.location')}</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemLocation} onChangeText={setEditingItemLocation} placeholder={t('itemsManagement.editModal.location')} style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.location && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red", fontSize: 12 }}>* {t('itemsManagement.editModal.validation.location')}</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                <HStack
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 8,
                                        marginTop: 10,
                                    }}
                                >
                                    {/* Item Count */}
                                    <VStack style={{ width: "48%" }}>
                                        <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.itemCount}>
                                            <FormControlLabel>
                                                <FormControlLabelText>{t('itemsManagement.editModal.itemCount')}</FormControlLabelText>
                                            </FormControlLabel>
                                            <Input isDisabled={isLoading}>
                                                <InputField
                                                    ref={inputRef}
                                                    value={editingItemCount}
                                                    onChangeText={setEditingItemCount}
                                                    placeholder={t('itemsManagement.editModal.itemCount')}
                                                    keyboardType="numeric"
                                                    style={{ height: 40, width: "100%" }}
                                                />
                                            </Input>
                                            {validationErrors.itemCount && (
                                                <FormControlHelper>
                                                    <FormControlHelperText style={{ color: "red", fontSize: 12 }}>
                                                        * {t('itemsManagement.editModal.validation.itemCount')}
                                                    </FormControlHelperText>
                                                </FormControlHelper>
                                            )}
                                        </FormControl>
                                    </VStack>

                                    {/* Points to Redeem */}
                                    <VStack style={{ width: "48%" }}>
                                        <FormControl isInvalid={validationErrors.pointsToRedeem}>
                                            <FormControlLabel>
                                                <FormControlLabelText>{t('itemsManagement.editModal.pointsToRedeem')}</FormControlLabelText>
                                            </FormControlLabel>
                                            <Input isDisabled={isLoading}>
                                                <InputField
                                                    ref={inputRef}
                                                    value={editingItemPointsToRedeem}
                                                    onChangeText={setEditingItemPointsToRedeem}
                                                    placeholder={t('itemsManagement.editModal.pointsToRedeem')}
                                                    keyboardType="numeric"
                                                    style={{ height: 40, width: "100%" }}
                                                />
                                            </Input>
                                            {validationErrors.pointsToRedeem && (
                                                <FormControlHelper>
                                                    <FormControlHelperText style={{ color: "red", fontSize: 12 }}>
                                                        * {t('itemsManagement.editModal.validation.points')}
                                                    </FormControlHelperText>
                                                </FormControlHelper>
                                            )}
                                        </FormControl>
                                    </VStack>
                                </HStack>
                            </ModalBody>

                            <ModalFooter>
                                <HStack space="md" style={{ width: "100%" }}>
                                    <Button
                                        variant="outline"
                                        style={{ flex: 1, borderColor: "#6B7280" }}
                                        onPress={handleCancelKnownItem}
                                        isDisabled={isLoading}
                                    >
                                        <Text style={{ color: "#6B7280" }}>{t('itemsManagement.editModal.cancel')}</Text>
                                    </Button>
                                    <Button
                                        style={{ flex: 1, backgroundColor: "#1B9CFF" }}
                                        onPress={saveEditedBarcode}
                                        isDisabled={isLoading}
                                    >
                                        <Text style={{ color: "white", fontWeight: "bold" }}>{t('itemsManagement.editModal.save')}</Text>
                                    </Button>
                                </HStack>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>

                    {/* Unknown Items Editing Modal */}
                    <Modal isOpen={showUnknownEditModal} onClose={handleCancelUnknownItem} size="lg">
                        <ModalBackdrop />
                        <ModalContent>
                            <ModalHeader>
                                <Heading size="md" className="text-typography-950">{t('itemsManagement.unknownEditModal.title')}</Heading>
                                <ModalCloseButton style={{ backgroundColor: "transparent" }}>
                                    <Icon
                                        as={CloseIcon}
                                        size="md"
                                        className="stroke-background-400 group-[:hover]/modal-close-button:stroke-background-700 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900"
                                    />
                                </ModalCloseButton>
                            </ModalHeader>

                            <ModalBody>
                                {/* Barcode */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.barcode}>
                                    <FormControlLabel><FormControlLabelText>{t('itemsManagement.unknownEditModal.barcode')}</FormControlLabelText></FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingBarcode} onChangeText={setEditingBarcode} placeholder={t('itemsManagement.unknownEditModal.barcode')} style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.barcode && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red", fontSize: 12 }}>* {t('itemsManagement.unknownEditModal.validation.barcode')}</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                {/* Item Name */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.itemName}>
                                    <FormControlLabel><FormControlLabelText>{t('itemsManagement.unknownEditModal.itemName')}</FormControlLabelText></FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemName} onChangeText={setEditingItemName} placeholder={t('itemsManagement.unknownEditModal.itemName')} style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.itemName && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red", fontSize: 12 }}>* {t('itemsManagement.unknownEditModal.validation.itemName')}</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                {/* Item Description */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.itemDescription}>
                                    <FormControlLabel><FormControlLabelText>{t('itemsManagement.unknownEditModal.itemDescription')}</FormControlLabelText></FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemDescription} onChangeText={setEditingItemDescription} placeholder={t('itemsManagement.unknownEditModal.itemDescription')} style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.itemDescription && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red", fontSize: 12 }}>* {t('itemsManagement.unknownEditModal.validation.itemDescription')}</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                {/* Item Group */}
                                <FormControl style={{ marginBottom: 12 }}>
                                    <FormControlLabel><FormControlLabelText>{t('itemsManagement.unknownEditModal.itemGroup')}</FormControlLabelText></FormControlLabel>
                                    <Select
                                        isDisabled={isLoading}
                                        selectedValue={editingItemGroup}
                                        onValueChange={(value) => { setEditingItemGroup(value); setIsSelectOpen(false); }}
                                        onOpen={() => setIsSelectOpen(true)}
                                        onClose={() => setIsSelectOpen(false)}
                                    >
                                        <SelectTrigger variant="outline" size="md" style={{ height: 40, alignItems: "center", justifyContent: isMobileScreen ? "flex-start" : "space-between" }}>
                                            <SelectInput value={t(`itemsManagement.groups.${editingItemGroup}`)} placeholder={t('itemsManagement.unknownEditModal.selectGroupPlaceholder')} />
                                            <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                        </SelectTrigger>
                                        <SelectPortal>
                                            <SelectBackdrop />
                                            <SelectContent>
                                                <SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                                {Object.entries(t('itemsManagement.groups', { returnObjects: true })).map(([value, label]) => (
                                                    <SelectItem key={value} label={label} value={value} />
                                                ))}
                                            </SelectContent>
                                        </SelectPortal>
                                    </Select>
                                </FormControl>

                                {/* Item Location */}
                                <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.location}>
                                    <FormControlLabel><FormControlLabelText>{t('itemsManagement.unknownEditModal.location')}</FormControlLabelText></FormControlLabel>
                                    <Input isDisabled={isLoading}>
                                        <InputField ref={inputRef} value={editingItemLocation} onChangeText={setEditingItemLocation} placeholder={t('itemsManagement.unknownEditModal.location')} style={{ height: 40, width: "100%" }} />
                                    </Input>
                                    {validationErrors.location && (
                                        <FormControlHelper>
                                            <FormControlHelperText style={{ color: "red", fontSize: 12 }}>* {t('itemsManagement.unknownEditModal.validation.location')}</FormControlHelperText>
                                        </FormControlHelper>
                                    )}
                                </FormControl>

                                <HStack
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: 8,
                                        marginTop: 10,
                                    }}
                                >
                                    {/* Item Count */}
                                    <VStack style={{ width: "48%" }}>
                                        <FormControl style={{ marginBottom: 12 }} isInvalid={validationErrors.itemCount}>
                                            <FormControlLabel>
                                                <FormControlLabelText>{t('itemsManagement.unknownEditModal.itemCount')}</FormControlLabelText>
                                            </FormControlLabel>
                                            <Input isDisabled={isLoading}>
                                                <InputField
                                                    ref={inputRef}
                                                    value={editingItemCount}
                                                    onChangeText={setEditingItemCount}
                                                    placeholder={t('itemsManagement.unknownEditModal.itemCount')}
                                                    keyboardType="numeric"
                                                    style={{ height: 40, width: "100%" }}
                                                />
                                            </Input>
                                            {validationErrors.itemCount && (
                                                <FormControlHelper>
                                                    <FormControlHelperText style={{ color: "red", fontSize: 12 }}>
                                                        * {t('itemsManagement.unknownEditModal.validation.itemCount')}
                                                    </FormControlHelperText>
                                                </FormControlHelper>
                                            )}
                                        </FormControl>
                                    </VStack>

                                    {/* Points to Redeem */}
                                    <VStack style={{ width: "48%" }}>
                                        <FormControl isInvalid={validationErrors.pointsToRedeem}>
                                            <FormControlLabel>
                                                <FormControlLabelText>{t('itemsManagement.unknownEditModal.pointsToRedeem')}</FormControlLabelText>
                                            </FormControlLabel>
                                            <Input isDisabled={isLoading}>
                                                <InputField
                                                    ref={inputRef}
                                                    value={editingItemPointsToRedeem}
                                                    onChangeText={setEditingItemPointsToRedeem}
                                                    placeholder={t('itemsManagement.unknownEditModal.pointsToRedeem')}
                                                    keyboardType="numeric"
                                                    style={{ height: 40, width: "100%" }}
                                                />
                                            </Input>
                                            {validationErrors.pointsToRedeem && (
                                                <FormControlHelper>
                                                    <FormControlHelperText style={{ color: "red", fontSize: 12 }}>
                                                        * {t('itemsManagement.unknownEditModal.validation.pointsToRedeem')}
                                                    </FormControlHelperText>
                                                </FormControlHelper>
                                            )}
                                        </FormControl>
                                    </VStack>
                                </HStack>

                            </ModalBody>

                            <ModalFooter>
                                <HStack space="md" style={{ width: "100%" }}>
                                    <Button variant="outline" style={{ flex: 1, borderColor: "#6B7280" }} onPress={handleCancelUnknownItem} isDisabled={isLoading}>
                                        <Text style={{ color: "#6B7280" }}>{t('itemsManagement.unknownEditModal.cancel')}</Text>
                                    </Button>
                                    <Button style={{ flex: 1, backgroundColor: "#1B9CFF" }} onPress={saveEditedUnknownItem} isDisabled={isLoading}>
                                        <Text style={{ color: "white", fontWeight: "bold" }}>{t('itemsManagement.unknownEditModal.save')}</Text>
                                    </Button>
                                </HStack>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>

                    {/* Receive Confirmation Modal */}
                    <Modal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} size="md">
                        <ModalBackdrop />
                        <ModalContent style={{ backgroundColor: "white" }}>
                            <ModalHeader>
                                <Heading size="md" style={{ color: "black" }}>{t('scanner.modals.receive.title')}</Heading>
                                <ModalCloseButton>
                                    <Icon
                                        as={CloseIcon}
                                        size="sm"
                                        style={{ color: "#6B7280" }}
                                    />
                                </ModalCloseButton>
                            </ModalHeader>

                            <ModalBody>
                                <VStack
                                    space="md"
                                    style={{
                                        alignItems: "center",
                                        padding: 12,
                                    }}
                                >
                                    <Icon
                                        as={ArrowDownCircle}
                                        size="xl"
                                        style={{ color: "#1B9CFF" }}
                                    />
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            color: "#111827",
                                        }}
                                    >
                                        {t('scanner.modals.receive.body')}
                                    </Text>
                                </VStack>
                            </ModalBody>

                            <ModalFooter>
                                <HStack space="md" style={{ width: "100%" }}>
                                    <Button
                                        variant="outline"
                                        style={{
                                            flex: 1,
                                            borderColor: "#6B7280",
                                        }}
                                        onPress={() => setShowReceiveModal(false)}
                                    >
                                        <Text style={{ color: "#6B7280" }}>{t('scanner.modals.receive.cancel')}</Text>
                                    </Button>
                                    <Button
                                        style={{
                                            flex: 1,
                                            backgroundColor: "#1B9CFF",
                                        }}
                                        onPress={() => {
                                            handleReceive();
                                            setShowReceiveModal(false);
                                        }}
                                    >
                                        <Text style={{ color: "white", fontWeight: "bold" }}>
                                            {t('scanner.modals.receive.confirm')}
                                        </Text>
                                    </Button>
                                </HStack>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>

                    {/* Dispatch Confirmation Modal */}
                    <Modal isOpen={showDispatchModal} onClose={() => setShowDispatchModal(false)} size="md">
                        <ModalBackdrop />
                        <ModalContent style={{ backgroundColor: "white" }}>
                            <ModalHeader>
                                <Heading size="md" style={{ color: "black" }}>{t('scanner.modals.dispatch.title')}</Heading>
                                <ModalCloseButton>
                                    <Icon
                                        as={CloseIcon}
                                        size="sm"
                                        style={{ color: "#1B9CFF" }}
                                    />
                                </ModalCloseButton>
                            </ModalHeader>

                            <ModalBody>
                                <VStack
                                    space="md"
                                    style={{
                                        alignItems: "center",
                                        padding: 12,
                                    }}
                                >
                                    <Icon
                                        as={ArrowDownCircle}
                                        size="xl"
                                        style={{ color: "#1B9CFF" }}
                                    />
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            color: "#111827",
                                        }}
                                    >
                                        {t('scanner.modals.dispatch.body')}
                                    </Text>
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            color: "#6B7280",
                                            fontSize: 13,
                                        }}
                                    >
                                        {t('scanner.modals.dispatch.note')}
                                    </Text>
                                </VStack>
                            </ModalBody>

                            <ModalFooter>
                                <HStack space="md" style={{ width: "100%" }}>
                                    <Button
                                        variant="outline"
                                        style={{
                                            flex: 1,
                                            borderColor: "#6B7280",
                                        }}
                                        onPress={() => setShowDispatchModal(false)}
                                    >
                                        <Text style={{ color: "#6B7280" }}>{t('scanner.modals.dispatch.cancel')}</Text>
                                    </Button>

                                    <Button
                                        style={{
                                            flex: 1,
                                            backgroundColor: "#1B9CFF",
                                        }}
                                        onPress={handleDispatch}
                                    >
                                        <Text style={{ color: "white", fontWeight: "bold" }}>
                                            {t('scanner.modals.dispatch.confirm')}
                                        </Text>
                                    </Button>
                                </HStack>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </LinearGradient>
            </ProtectedRoute>
        );
}
