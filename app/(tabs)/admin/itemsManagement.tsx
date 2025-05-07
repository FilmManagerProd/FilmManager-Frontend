// @ts-nocheck
import ProtectedRoute from '@/app/_wrappers/ProtectedRoute';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { LinearGradient } from "expo-linear-gradient";
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectItem } from "@/components/ui/select"
import { ChevronDownIcon, CloseIcon, Icon } from "@/components/ui/icon"
import { PencilIcon, Search, SearchIcon, SparklesIcon, Trash2Icon, WarehouseIcon } from 'lucide-react-native';
import { Modal, ModalBackdrop, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { FormControl, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control"
import { Button, ButtonText } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableData } from "@/components/ui/table";
import { Heading } from '@/components/ui/heading';
import server from "../../../networking";
import Constants from "expo-constants";
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';

interface BarcodeItem {
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
}

const ItemsManagement = () => {
    const { width, height } = useWindowDimensions();
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingItems, setPendingItems] = useState<BarcodeItem[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<BarcodeItem | null>(null);
    const [editingBarcode, setEditingBarcode] = useState("");
    const [editingItemName, setEditingItemName] = useState("");
    const [editingItemDescription, setEditingItemDescription] = useState("");
    const [editingItemCount, setEditingItemCount] = useState('');
    const [editingItemLocation, setEditingItemLocation] = useState("");
    const [editingItemPointsToRedeem, setEditingItemPointsToRedeem] = useState("");
    const [editingItemGroup, setEditingItemGroup] = useState("");
    const [editingItemImage, setEditingItemImage] = useState("");
    const [originalItemName, setOriginalItemName] = useState('');
    const [originalItemDescription, setOriginalItemDescription] = useState('');
    const [originalItemCount, setOriginalItemCount] = useState('');
    const [originalItemLocation, setOriginalItemLocation] = useState('');
    const [originalItemPointsToRedeem, setOriginalItemPointsToRedeem] = useState('');
    const [originalItemGroup, setOriginalItemGroup] = useState('');
    const [originalItemImage, setOriginalItemImage] = useState('');
    const [isSelectOpen, setIsSelectOpen] = useState(false)
    const [isOpen, setIsOpen] = useState(false);
    const [imageUrls, setImageUrls] = useState({});
    const [imageLoading, setImageLoading] = useState({});
    const [imagesFetched, setImagesFetched] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        barcode: false,
        itemName: false,
        itemDescription: false,
        location: false,
        itemCount: false,
        pointsToRedeem: false,
    });

    const { barcodes, loading } = useData();

    const { t } = useTranslation();

    const fetchedIdsRef = useRef<string[]>([]);

    const { API_KEY } = Constants.expoConfig.extra;

    const groupLabels = {
        all: t('itemsManagement.groups.all'),
        available: t('itemsManagement.groups.available'),
        unavailable: t('itemsManagement.groups.unavailable'),
        consumable: t('itemsManagement.groups.consumable'),
        rental: t('itemsManagement.groups.rental')
    };

    const editingGroupLabels = {
        consumable: t('itemsManagement.groups.consumable'),
        rental: t('itemsManagement.groups.rental')
    };
    const barcodeArray: BarcodeItem[] = barcodes ? Object.values(barcodes) : [];

    const filteredItems: BarcodeItem[] = barcodeArray.filter((barcode: BarcodeItem) => {
        const searchLower = searchQuery.toLowerCase();

        const matchesSearch =
            barcode.itemName?.toLowerCase().includes(searchLower) ||
            barcode.itemDescription?.toLowerCase().includes(searchLower) ||
            barcode.barcode?.toLowerCase().includes(searchLower);
        barcode.location?.toLowerCase().includes(searchLower);

        const matchesGroup =
            selectedGroup === 'all' ? true :
                selectedGroup === 'available' ? barcode.totalCount > 0 :
                    selectedGroup === 'unavailable' ? barcode.totalCount <= 0 :
                        barcode.group === selectedGroup;

        return matchesSearch && matchesGroup;
    });

    const handleEdit = (item: BarcodeItem) => {
        setEditingItem(item);
        setEditingBarcode(item.barcode ?? "");
        setEditingItemName(item.itemName ?? "");
        setEditingItemDescription(item.itemDescription ?? "");
        setEditingItemCount(item.totalCount?.toString() ?? "0");
        setEditingItemLocation(item.location ?? "");
        setEditingItemPointsToRedeem(item.pointsToRedeem?.toString() ?? "0");
        setEditingItemGroup(item.group ?? "");
        if (item.imageUrl) {
            setEditingItemImage({ uri: item.imageUrl });
        } else {
            setEditingItemImage(null);
        }

        setOriginalItemName(item.itemName ?? "");
        setOriginalItemDescription(item.itemDescription ?? "");
        setOriginalItemCount(item.totalCount?.toString() ?? "0");
        setOriginalItemLocation(item.location ?? "");
        setOriginalItemPointsToRedeem(item.pointsToRedeem?.toString() ?? "0");
        setOriginalItemGroup(item.group ?? "");
        setOriginalItemImage(item.imageUrl ?? "")

        setShowEditModal(true);
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

    const handleCancelDelete = () => {
        setDeleteItemId(null);
        setShowDeleteModal(false);
    };

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

    const handleValidation = () => {
        const errors = validateInputs();
        setValidationErrors(errors);
        return !Object.values(errors).some(Boolean);
    };

    const saveEditedBarcode = async () => {
        if (!editingItem || !handleValidation()) return;
        setIsLoading(true);

        try {
            let uploadedFilePath = editingItem.imageUrl;

            if (editingItemImage?.base64 && editingItemImage?.mimeType) {
                try {
                    const response = await server.post(`/api/image/upload`, {
                        itemId: editingItem.id,
                        base64: editingItemImage.base64,
                        mimeType: editingItemImage.mimeType,
                    });

                    uploadedFilePath = response.data.imageUrl;
                    editingItem.imageUrl = uploadedFilePath;
                    setEditingItemImage(uploadedFilePath);
                } catch (error) {
                    console.error("Error uploading image:", error);
                    showToast(t('itemsManagement.toast.imageError'), t('itemsManagement.toast.imageErrorDesc'));
                    setIsLoading(false);
                    return;
                }
            }

            // Submit updated item
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
                imageUrl: uploadedFilePath,
            }]);

            setShowEditModal(false);
            setEditingItem(null);
            showToast(t('itemsManagement.toast.success'), t('itemsManagement.toast.editSuccess'));
        } catch (error) {
            console.error("Edit Error:", error);
            if (
                error.response &&
                error.response.data &&
                typeof error.response.data.error === "string" &&
                error.response.data.error.startsWith("UERROR: ")
            ) {
                const cleanedMessage = error.response.data.error.replace("UERROR: ", "");
                showToast(t('itemsManagement.toast.editError'), cleanedMessage);
            }
        } finally {
            setIsLoading(false);
            setEditingBarcode(editingItem?.barcode || "");
            setEditingItemName(editingItem?.itemName || "");
            setEditingItemDescription(editingItem?.itemDescription || "");
            setEditingItemCount(editingItem?.totalCount.toString() || "");
            setEditingItemLocation(editingItem?.location || "");
            setEditingItemPointsToRedeem(editingItem?.pointsToRedeem.toString() || "");
            setEditingItemGroup(editingItem?.group || "");
            setEditingItemImage(editingItem?.imageUrl || "")
        }
    };

    const handleDelete = async (id: string) => {
        setIsLoading(true);
        try {
            await server.delete('/api/barcodes', {
                data: [id],
                headers: { apiKey: API_KEY }
            });
            setPendingItems((prev) => prev.filter((item) => item.id !== id));
            showToast(t('itemsManagement.toast.success'), t('itemsManagement.toast.deleteSuccess'));
        } catch (error) {
            console.error("Error deleting barcode:", error);
            showToast(t('itemsManagement.toast.deleteError'), t('itemsManagement.toast.deleteErrorDesc'));
        }
        setIsLoading(false);
        setShowEditModal(false);
    }

    const toast = useToast();
    const [toastId, setToastId] = useState(0);

    const groupedItems: Record<string, BarcodeItem[]> = filteredItems.reduce((groups, item) => {
        const group = item.group?.toLowerCase() || "unknown";
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
    }, {});

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

    const isMediumLaptop = width < 1400;
    const isSmallLaptop = width < 1024;
    const isShortScreen = height < 750;
    const isMobileScreen = width < 680;
    const isTinyScreen = width < 375;
    const isLaptop = width < 1270

    const allColumns = [
        { key: "image", label: "Image", flex: 1, maxWidth: 48, visible: !isLaptop },
        { key: "barcode", label: "Barcode", flex: 1.5, maxWidth: 120, visible: true },
        { key: "itemName", label: "Name", flex: 2, maxWidth: 100, visible: true },
        { key: "itemDescription", label: "Description", flex: 2, maxWidth: 100, visible: !isSmallLaptop },
        { key: "location", label: "Location", flex: 1, maxWidth: 80, visible: !isSmallLaptop },
        { key: "stock", label: "Stock", flex: 0.5, maxWidth: 20, visible: !isMobileScreen },
        { key: "points", label: "Points", flex: 0.5, maxWidth: 20, visible: !isMobileScreen },
        { key: "actions", label: "Actions", flex: 0.5, maxWidth: 80, visible: true },
    ];

    const columns = allColumns.filter(col => col.visible);

    const handleImageSelection = async () => {
        if (Platform.OS === 'web') {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';

            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const previewUrl = URL.createObjectURL(file);
                    const base64 = await readFileAsBase64(file);

                    setEditingItemImage({
                        uri: previewUrl,
                        base64,
                        mimeType: file.type,
                    });
                }
            };

            fileInput.click();
        } else {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                const file = result.assets[0];

                const base64 = await FileSystem.readAsStringAsync(file.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                setEditingItemImage({
                    uri: file.uri,
                    base64,
                    mimeType: file.mimeType || 'image/jpeg',
                });
            }
        }
    };

    const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

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

    useEffect(() => {
        if (barcodes && Object.keys(barcodes).length > 0) {
            fetchImagesForAllBarcodes();
        }
    }, [barcodes]);

    if (loading)
        return (
            <ProtectedRoute showAuth={true}>
                <LinearGradient colors={isMobileScreen ? ["#00FFDD", "#1B9CFF"] : ["#1B9CFF", "#00FFDD"]} start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }} end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Box style={{ padding: 40, alignItems: "center" }}>
                        <Spinner size="large" />
                        <Text style={{ marginTop: 16, color: "black" }}>{t('itemsManagement.loading')}</Text>
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
                    <VStack style={{ padding: isMobileScreen ? 4 : 8, width: "90%", alignSelf: "center", gap: 10, marginTop: isMobileScreen ? 60 : 20, marginBottom: 14 }} space="xl">
                        {/* Filter and Search Row */}
                        <HStack space="xl" style={{ alignItems: "center", justifyContent: isMobileScreen ? "space-between" : "flex-start", marginBottom: 20, width: "100%" }}>
                            {/* Category Dropdown */}
                            <HStack style={{ marginRight: isMobileScreen ? 0 : 12 }}>
                                <Select open={isOpen} onOpenChange={setIsOpen} onValueChange={(value) => { setSelectedGroup(value); setIsOpen(false); }}>
                                    <SelectTrigger
                                        variant="outline"
                                        size={isMobileScreen ? "sm" : "md"}
                                        style={{ backgroundColor: "white" }}
                                    >
                                        {!isMobileScreen && (
                                            <SelectInput value={groupLabels[selectedGroup]} placeholder={t('itemsManagement.groups.all')} style={{ color: "black" }} />
                                        )}
                                        {isMobileScreen && (
                                            <Text style={{ color: "black", fontSize: 14, padding: 10 }}>{groupLabels[selectedGroup]}</Text>
                                        )}
                                        <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                    </SelectTrigger>
                                    <SelectPortal>
                                        <SelectBackdrop />
                                        <SelectContent style={{ backgroundColor: "white" }}>
                                            <SelectDragIndicatorWrapper>
                                                <SelectDragIndicator />
                                            </SelectDragIndicatorWrapper>
                                            {Object.entries(groupLabels).map(([key, label]) => (
                                                <SelectItem
                                                    key={key}
                                                    label={label}
                                                    value={key}
                                                    style={{ backgroundColor: "white" }}
                                                />
                                            ))}
                                        </SelectContent>
                                    </SelectPortal>
                                </Select>
                            </HStack>

                            {/* Search Input */}
                            <Input style={{ backgroundColor: "white" }} size={isShortScreen ? "sm" : "md"}>
                                {!isShortScreen && (
                                    <InputField
                                        placeholder={t('itemsManagement.search.placeholder')}
                                        value={searchQuery}
                                        onChangeText={(text) => setSearchQuery(text)}
                                        style={{ color: "black" }}
                                    />
                                )}
                                {isShortScreen && (
                                    <InputField
                                        placeholder={t('itemsManagement.search.shortPlaceholder')}
                                        value={searchQuery}
                                        onChangeText={(text) => setSearchQuery(text)}
                                        style={{ color: "black" }}
                                    />
                                )}
                                <InputSlot style={{ paddingRight: 4 }}>
                                    <Icon as={SearchIcon} size="md" style={{ color: "gray", display: isMobileScreen ? "none" : "flex" }} />
                                </InputSlot>
                            </Input>
                        </HStack>

                        {filteredItems.length === 0 && (
                            <VStack
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: 24,
                                    padding: isMobileScreen ? 16 : 24,
                                    marginTop: 10,
                                    marginBottom: 10,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 6,
                                    elevation: 2,
                                    minHeight: 200
                                }}
                            >
                                <WarehouseIcon size={48} color="#4f46e5" style={{ marginBottom: 16 }} />
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontWeight: "700",
                                        color: "#4f46e5",
                                        textAlign: "center",
                                        marginBottom: 8
                                    }}
                                >
                                    {t('itemsManagement.noItems.title')}
                                </Text>

                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: "#6b7280",
                                        textAlign: "center"
                                    }}
                                >
                                    {t('itemsManagement.noItems.description')}
                                </Text>
                            </VStack>
                        )}

                        {filteredItems.length > 0 && (
                            <ScrollView>
                                <VStack space="2xl" style={{ flex: 1, paddingRight: isMobileScreen ? 0 : 20 }}>
                                    {Object.entries(groupedItems).map(([groupKey, items]) => (
                                        <VStack
                                            key={groupKey}
                                            space="lg"
                                            style={{
                                                backgroundColor: "white",
                                                borderRadius: 24,
                                                padding: isMobileScreen ? 10 : 16,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 6,
                                                elevation: 2
                                            }}
                                        >
                                            {/* Group Title */}
                                            <HStack style={{
                                                alignItems: "center",
                                                gap: 6,
                                                padding: 12,
                                                backgroundColor: "#eef2ff",
                                                borderRadius: 16
                                            }}>
                                                <Text style={{
                                                    fontSize: 20,
                                                    fontWeight: "900",
                                                    color: "#4f46e5",
                                                    letterSpacing: -0.5,
                                                    textTransform: "uppercase"
                                                }}>
                                                    {groupLabels[groupKey] || t('itemsManagement.groups.other')}
                                                </Text>
                                            </HStack>

                                            {/* Table Structure */}
                                            <Table style={{ width: "100%" }}>
                                                <TableHeader style={{
                                                    backgroundColor: "#f8fafc",
                                                    borderRadius: 12,
                                                    padding: 12,
                                                    borderBottomWidth: 0,
                                                }}>
                                                    <TableRow style={{
                                                        shadowColor: "transparent",
                                                        borderBottomWidth: 0,
                                                        backgroundColor: "transparent",
                                                    }}>
                                                        {columns
                                                            .filter(col => col.visible)
                                                            .map((col, index, visibleCols) => {
                                                                const isFirstCol = index === 0;
                                                                const isLastCol = index === visibleCols.length - 1;

                                                                return (
                                                                    <TableHead
                                                                        key={col.key}
                                                                        style={{
                                                                            width: col.maxWidth,
                                                                            paddingVertical: isTinyScreen ? 8 : isMobileScreen ? 10 : 14,
                                                                            paddingHorizontal: isTinyScreen ? 6 : 10,
                                                                            backgroundColor: "#4f46e5",
                                                                            borderTopLeftRadius: isFirstCol ? 12 : 0,
                                                                            borderTopRightRadius: isLastCol ? 12 : 0,
                                                                        }}
                                                                    >
                                                                        <Text
                                                                            style={{
                                                                                color: "white",
                                                                                fontWeight: "800",
                                                                                letterSpacing: 0.5,
                                                                                textTransform: "uppercase",
                                                                                fontSize: isTinyScreen ? 10 : isMobileScreen ? 12 : 14
                                                                            }}
                                                                        >
                                                                            {t(`itemsManagement.columns.${col.key}`)}
                                                                        </Text>
                                                                    </TableHead>
                                                                );
                                                            })}
                                                    </TableRow>
                                                </TableHeader>

                                                <TableBody>
                                                    {items.map(item => (
                                                        <TableRow key={item.id} style={{ backgroundColor: "transparent" }}>
                                                            {columns.map(col => {
                                                                // common style object for each cell
                                                                const cellStyle = { flex: col.flex, minWidth: col.maxWidth, justifyContent: col.key === "image" || col.key === "actions" ? "center" : undefined };

                                                                switch (col.key) {
                                                                    case "image":
                                                                        return (
                                                                            <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center" }}>
                                                                                <Box
                                                                                    style={{
                                                                                        width: isTinyScreen ? 36 : 90,
                                                                                        height: isTinyScreen ? 36 : 90,
                                                                                        borderRadius: 8,
                                                                                        overflow: 'hidden',
                                                                                    }}
                                                                                >
                                                                                    <Image
                                                                                        size='lg'
                                                                                        source={{
                                                                                            uri:
                                                                                                imageUrls[item.id] ||
                                                                                                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVNer1ZryNxWVXojlY9Hoyy1-4DVNAmn7lrg&s',
                                                                                        }}
                                                                                        alt="item image"
                                                                                    />
                                                                                </Box>
                                                                            </TableData>
                                                                        );
                                                                    case "stock":
                                                                        return (
                                                                            <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center" }}>
                                                                                <Badge
                                                                                    style={{
                                                                                        backgroundColor:
                                                                                            item.totalCount <= 10
                                                                                                ? "#fef2f2"
                                                                                                : item.totalCount <= 100
                                                                                                    ? "#fefce8"
                                                                                                    : "#f0fdf4",
                                                                                        borderRadius: 10,
                                                                                        paddingVertical: isTinyScreen ? 2 : 4,
                                                                                        paddingHorizontal: isTinyScreen ? 4 : 8,
                                                                                        flexDirection: "row",
                                                                                        alignItems: "center",
                                                                                        gap: isTinyScreen ? 4 : 6,
                                                                                        width: "100%"
                                                                                    }}
                                                                                >
                                                                                    <Box
                                                                                        style={{
                                                                                            width: isTinyScreen ? 6 : 8,
                                                                                            height: isTinyScreen ? 6 : 8,
                                                                                            borderRadius: 4,
                                                                                            backgroundColor:
                                                                                                item.totalCount <= 10
                                                                                                    ? "#dc2626"
                                                                                                    : item.totalCount <= 100
                                                                                                        ? "#eab308"
                                                                                                        : "#16a34a"
                                                                                        }}
                                                                                    />
                                                                                    <Text
                                                                                        style={{
                                                                                            fontWeight: "700",
                                                                                            fontSize: isTinyScreen ? 10 : 12,
                                                                                            color:
                                                                                                item.totalCount <= 10
                                                                                                    ? "#991b1b"
                                                                                                    : item.totalCount <= 100
                                                                                                        ? "#854d0e"
                                                                                                        : "#166534"
                                                                                        }}
                                                                                    >
                                                                                        {item.totalCount}
                                                                                    </Text>
                                                                                </Badge>
                                                                            </TableData>
                                                                        );
                                                                    case "points":
                                                                        return (
                                                                            <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center" }}>
                                                                                <Badge
                                                                                    style={{
                                                                                        backgroundColor: "rgba(234, 179, 8, 0.1)",
                                                                                        borderRadius: 10,
                                                                                        paddingVertical: 4,
                                                                                        paddingHorizontal: 8,
                                                                                        flexDirection: "row",
                                                                                        alignItems: "center",
                                                                                        gap: 6,
                                                                                        width: "100%"
                                                                                    }}
                                                                                >
                                                                                    <SparklesIcon size={isTinyScreen ? 12 : 14} color="#eab308" />
                                                                                    <Text
                                                                                        style={{
                                                                                            fontWeight: "700",
                                                                                            fontSize: isTinyScreen ? 10 : 12,
                                                                                            color: "#854d0e"
                                                                                        }}
                                                                                    >
                                                                                        {item.pointsToRedeem}
                                                                                    </Text>
                                                                                </Badge>
                                                                            </TableData>
                                                                        );
                                                                    case "actions":
                                                                        return (
                                                                            <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center" }}>
                                                                                <HStack space="md" style={{ width: isTinyScreen ? 44 : 60 }}>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        action="secondary"
                                                                                        onPress={() => handleEdit(item)}
                                                                                        isDisabled={isLoading}
                                                                                        style={{ padding: 4, backgroundColor: "transparent" }}
                                                                                    >
                                                                                        <PencilIcon size={isTinyScreen ? 12 : 16} color="#4f46e5" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        action="secondary"
                                                                                        onPress={() => {
                                                                                            setDeleteItemId(item.id);
                                                                                            setShowDeleteModal(true);
                                                                                        }}
                                                                                        isDisabled={isLoading}
                                                                                        style={{ padding: 4, backgroundColor: "transparent", color: "red" }}
                                                                                    >
                                                                                        <Trash2Icon size={isTinyScreen ? 12 : 16} color="#dc2626" />
                                                                                    </Button>
                                                                                </HStack>
                                                                            </TableData>
                                                                        );
                                                                    default:
                                                                        const text = item[col.key as keyof BarcodeItem] ?? "";
                                                                        return (
                                                                            <TableData key={col.key} style={{ ...cellStyle, justifyContent: "center", maxWidth: col.maxWidth }}>
                                                                                <Text
                                                                                    style={{
                                                                                        color: "black",
                                                                                        fontSize: isTinyScreen ? 10 : isMobileScreen ? 12 : 14,
                                                                                        maxWidth: col.maxWidth,
                                                                                        flexWrap: "wrap",
                                                                                        wordBreak: 'break-word',
                                                                                    }}
                                                                                >
                                                                                    {text}
                                                                                </Text>
                                                                            </TableData>
                                                                        );
                                                                }
                                                            })}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </VStack>
                                    ))}
                                </VStack>
                            </ScrollView>
                        )}

                        {/* Delete Confirmation Modal */}
                        <Modal isOpen={showDeleteModal} onClose={handleCancelDelete}>
                            <ModalBackdrop />
                            <ModalContent>
                                <ModalHeader>
                                    <Heading>{t('itemsManagement.deleteModal.title')}</Heading>
                                    <ModalCloseButton>
                                        <Icon as={CloseIcon} />
                                    </ModalCloseButton>
                                </ModalHeader>
                                <ModalBody>
                                    <Text>{t('itemsManagement.deleteModal.content')}</Text>
                                </ModalBody>
                                <ModalFooter>
                                    <Button variant="outline" style={{ marginRight: 3 }} onPress={handleCancelDelete}>
                                        <ButtonText>{t('itemsManagement.deleteModal.cancel')}</ButtonText>
                                    </Button>
                                    <Button
                                        style={{ backgroundColor: "red" }}
                                        onPress={() => {
                                            if (deleteItemId) handleDelete(deleteItemId);
                                            setShowDeleteModal(false);
                                        }}
                                    >
                                        <ButtonText>{t('itemsManagement.deleteModal.confirm')}</ButtonText>
                                    </Button>
                                </ModalFooter>
                            </ModalContent>
                        </Modal>

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
                                            <InputField value={editingBarcode} onChangeText={setEditingBarcode} placeholder={t('itemsManagement.editModal.barcode')} style={{ height: 40, width: "100%" }} />
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
                                            <InputField value={editingItemName} onChangeText={setEditingItemName} placeholder={t('itemsManagement.editModal.itemName')} style={{ height: 40, width: "100%" }} />
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
                                            <InputField value={editingItemDescription} onChangeText={setEditingItemDescription} placeholder={t('itemsManagement.editModal.itemDescription')} style={{ height: 40, width: "100%" }} />
                                        </Input>
                                        {validationErrors.itemDescription && (
                                            <FormControlHelper>
                                                <FormControlHelperText style={{ color: "red", fontSize: 12 }}>* {t('itemsManagement.editModal.validation.itemDescription')}</FormControlHelperText>
                                            </FormControlHelper>
                                        )}
                                    </FormControl>

                                    <HStack
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            flexWrap: "wrap",
                                            gap: 12,
                                            marginBottom: 12,
                                        }}
                                    >
                                        {/* Item Group */}
                                        <VStack style={{ width: "48%" }}>
                                            <FormControl>
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
                                                    <SelectTrigger
                                                        variant="outline"
                                                        size="md"
                                                        style={{
                                                            height: 40,
                                                            alignItems: "center",
                                                            justifyContent: isMobileScreen ? "flex-start" : "space-between",
                                                        }}
                                                    >
                                                        <SelectInput value={editingGroupLabels[editingItemGroup]} placeholder={t('itemsManagement.editModal.itemGroup')} />
                                                        <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                                    </SelectTrigger>
                                                    <SelectPortal>
                                                        <SelectBackdrop />
                                                        <SelectContent>
                                                            <SelectDragIndicatorWrapper>
                                                                <SelectDragIndicator />
                                                            </SelectDragIndicatorWrapper>
                                                            {Object.entries(editingGroupLabels).map(([value, label]) => (
                                                                <SelectItem key={value} label={label} value={value} />
                                                            ))}
                                                        </SelectContent>
                                                    </SelectPortal>
                                                </Select>
                                            </FormControl>
                                        </VStack>

                                        {/* Location */}
                                        <VStack style={{ width: "48%" }}>
                                            <FormControl isInvalid={validationErrors.location}>
                                                <FormControlLabel>
                                                    <FormControlLabelText>{t('itemsManagement.editModal.location')}</FormControlLabelText>
                                                </FormControlLabel>
                                                <Input isDisabled={isLoading}>
                                                    <InputField
                                                        value={editingItemLocation}
                                                        onChangeText={setEditingItemLocation}
                                                        placeholder={t('itemsManagement.editModal.location')}
                                                        style={{ height: 40, width: "100%" }}
                                                    />
                                                </Input>
                                                {validationErrors.location && (
                                                    <FormControlHelper>
                                                        <FormControlHelperText style={{ color: "red", fontSize: 12 }}>
                                                            * {t('itemsManagement.editModal.validation.location')}
                                                        </FormControlHelperText>
                                                    </FormControlHelper>
                                                )}
                                            </FormControl>
                                        </VStack>
                                    </HStack>

                                    <FormControl style={{ marginBottom: 12 }}>
                                        <FormControlLabel>
                                            <FormControlLabelText>{t('itemsManagement.editModal.itemImage')}</FormControlLabelText>
                                        </FormControlLabel>
                                        <Button
                                            onPress={handleImageSelection}
                                            style={{ height: 160, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#ccc", backgroundColor: "transparent", borderRadius: 8 }}
                                        >
                                            {editingItemImage?.uri ? (
                                                <Box
                                                    style={{
                                                        width: 120,
                                                        height: 120,
                                                        borderRadius: 8,
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <Image
                                                        source={{ uri: editingItemImage.uri }}
                                                        size="xl"
                                                        alt="selected item image"
                                                    />
                                                </Box>
                                            ) : (
                                                <Text>{t('itemsManagement.editModal.selectImage')}</Text>
                                            )}
                                        </Button>
                                    </FormControl>

                                    <HStack
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            flexWrap: "wrap",
                                            gap: 12,
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
                    </VStack>
                </LinearGradient>
            </ProtectedRoute>
        );
};

export default ItemsManagement;
