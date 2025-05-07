// @ts-nocheck
import { useState, useEffect } from "react";
import { ScrollView, useWindowDimensions } from "react-native";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { LinearGradient } from "expo-linear-gradient";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { CloseIcon, Icon } from "@/components/ui/icon";
import { SearchIcon, Trash2Icon } from "lucide-react-native";
import { Modal, ModalBackdrop, ModalContent, ModalCloseButton, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableData } from "@/components/ui/table";
import { Heading } from "@/components/ui/heading";
import { Toast, ToastDescription, ToastTitle, useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/app/_wrappers/ProtectedRoute";
import server from "../../../networking";
import { Pressable } from "@/components/ui/pressable";
import { Box } from "@/components/ui/box";
import { Spinner } from "@/components/ui/spinner";
import { useTranslation } from 'react-i18next';

interface User {
	uid: string;
	username: string;
	email: string;
	role: string;
	points: number;
	createdAt: number;
}

export default function UserManagement() {
	const { width, height } = useWindowDimensions();
	const { t } = useTranslation();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [deleteUserEmail, setDeleteUserEmail] = useState<string | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deletingUsers, setDeletingUsers] = useState<Set<string>>(new Set());

	const { userData } = useAuth();

	const toast = useToast();
	const [toastId, setToastId] = useState(0);

	const isSmallLaptop = width < 1024;
	const isShortScreen = height < 750;
	const isMobileScreen = width < 680;
	const isTinyScreen = width < 375;

	useEffect(() => {
		if (userData) {
			fetchUsers();
		}
	}, [userData]);

	const fetchUsers = async () => {
		try {
			const response = await server.get("/api/users");
			setUsers(response.data.result);
		} catch (error) {
			console.error("Error fetching users:", error);
			showToast(t('userManagement.fetchErrorTitle'), t('userManagement.fetchErrorDesc'));
		} finally {
			setLoading(false);
		}
	};

	const filteredUsers = users.filter(user => {
		const searchLower = searchQuery.toLowerCase();
		return user.username.toLowerCase().includes(searchLower) || user.email.toLowerCase().includes(searchLower);
	});

	const handleDelete = async (email: string) => {
		setDeletingUsers(prev => new Set(prev).add(email));
		try {
			await server.delete(`/api/users/${email}`);
			setUsers(prev => prev.filter(user => user.email !== email));
			showToast(t('userManagement.deleteSuccessTitle'), t('userManagement.deleteSuccessDesc'));
		} catch (error) {
			console.error("Error deleting user:", error);
			showToast(t('userManagement.deleteFailedTitle'), t('userManagement.deleteFailedDesc'));
		}
		setDeletingUsers(prev => {
			const newSet = new Set(prev);
			newSet.delete(email);
			return newSet;
		});
		setShowDeleteModal(false);
	};

	const showToast = (title: string, description: string) => {
		const newId = Math.random();
		setToastId(newId);
		toast.show({
			id: newId.toString(),
			placement: "top",
			duration: 3000,
			render: ({ id }) => {
				return (
					<Toast nativeID={id} action="muted" variant="solid">
						<ToastTitle>{title}</ToastTitle>
						<ToastDescription>{description}</ToastDescription>
					</Toast>
				);
			}
		});
	};

	const columns = [
		{ key: "avatar", label: "Avatar", flex: 1, maxWidth: 48, visible: true },
		{ key: "username", label: "Username", flex: 2, maxWidth: 120, visible: true },
		{ key: "email", label: "Email", flex: 2.5, maxWidth: 160, visible: !isSmallLaptop },
		{ key: "points", label: "Points", flex: 1, maxWidth: 80, visible: !isMobileScreen },
		{ key: "created", label: "Joined", flex: 1.5, maxWidth: 100, visible: !isMobileScreen },
		{ key: "actions", label: "Actions", flex: 0.5, maxWidth: 60, visible: true }
	].filter(col => col.visible);

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric"
		});
	};

	if (loading)
		return (
			<ProtectedRoute showAuth={true}>
				<LinearGradient colors={isMobileScreen ? ["#00FFDD", "#1B9CFF"] : ["#1B9CFF", "#00FFDD"]} start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }} end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
					<Box style={{ padding: 40, alignItems: "center" }}>
						<Spinner size="large" />
						<Text style={{ marginTop: 16, color: "black" }}>{t('userManagement.loading')}</Text>
					</Box>
				</LinearGradient>
			</ProtectedRoute>
		)

	if (!loading)
		return (
			<ProtectedRoute showAuth={true}>
				<LinearGradient colors={isMobileScreen ? ["#00FFDD", "#1B9CFF"] : ["#1B9CFF", "#00FFDD"]} start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }} end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }} style={{ flex: 1 }}>
					<VStack style={{ padding: isMobileScreen ? 4 : 8, width: "90%", alignSelf: "center", gap: 10, marginTop: isMobileScreen ? 60 : 20, marginBottom: 14 }} space="xl">
						<HStack space="xl" style={{ alignItems: "center", justifyContent: "flex-start", marginBottom: 20, width: "100%" }}>
							<Input style={{ flex: isMobileScreen ? 1 : 0.4, backgroundColor: "white" }} size={isShortScreen ? "sm" : "md"}>
								<InputField placeholder={t('userManagement.searchPlaceholder')} value={searchQuery} onChangeText={setSearchQuery} style={{ color: "black" }} />
								<InputSlot style={{ paddingRight: 4 }}>
									<Icon as={SearchIcon} size="md" style={{ color: "gray" }} />
								</InputSlot>
							</Input>
						</HStack>

						<ScrollView style={{ paddingRight: isMobileScreen ? 0 : 20 }}>
							<VStack space="2xl" style={{ flex: 1, paddingRight: isMobileScreen ? 0 : 20 }}>
								<VStack
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
									<Table style={{ width: "100%" }}>
										<TableHeader style={{ backgroundColor: "#f8fafc", borderRadius: 12 }}>
											<TableRow style={{ backgroundColor: "transparent" }}>
												{columns.map((col, index, visibleCols) => {
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
																borderTopRightRadius: isLastCol ? 12 : 0
															}}
														>
															<Text
																style={{
																	color: "white",
																	fontWeight: "800",
																	fontSize: isTinyScreen ? 10 : isMobileScreen ? 12 : 14
																}}
															>
																{t(`userManagement.table.${col.key}`)}
															</Text>
														</TableHead>
													);
												})}
											</TableRow>
										</TableHeader>

										{filteredUsers.length > 0 ? (
											<TableBody>
												{filteredUsers.map(user => (
													<TableRow key={user.uid} style={{ backgroundColor: "transparent" }}>
														{columns.map(col => {
															const cellStyle = {
																flex: col.flex,
																minWidth: col.maxWidth,
																justifyContent: col.key === "avatar" ? "center" : "flex-start"
															};

															switch (col.key) {
																case "avatar":
																	return (
																		<TableData key={col.key} style={{ ...cellStyle, justifyContent: col.key === "avatar" ? "center" : "flex-start" }}>
																			<Image
																				style={{
																					width: isTinyScreen ? 36 : 48,
																					height: isTinyScreen ? 36 : 48,
																					borderRadius: 24
																				}}
																				source={{ uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
																				alt="user avatar"
																			/>
																		</TableData>
																	);
																case "points":
																	return (
																		<TableData key={col.key} style={{ ...cellStyle, justifyContent: col.key === "points" ? "center" : "flex-start" }}>
																			<Text
																				style={{
																					fontWeight: "700",
																					fontSize: isTinyScreen ? 10 : 12,
																					color: "#854d0e"
																				}}
																			>
																				{user.points}
																			</Text>
																		</TableData>
																	);
																case "created":
																	return (
																		<TableData key={col.key} style={{ ...cellStyle, justifyContent: col.key === "created" ? "center" : "flex-start" }}>
																			<Text style={{ fontSize: isTinyScreen ? 10 : 12 }}>{formatDate(user.createdAt)}</Text>
																		</TableData>
																	);
																case "actions":
																	return (
																		<TableData key={col.key} style={{ ...cellStyle, justifyContent: col.key === "actions" ? "center" : "flex-start" }}>
																			<Pressable
																				disabled={deletingUsers.has(user.email)}
																				onPress={() => {
																					setDeleteUserEmail(user.email);
																					setShowDeleteModal(true);
																				}}
																			>
																				{deletingUsers.has(user.email) ? t('userManagement.deleting') : <Text style={{ color: "#dc2626", cursor: "pointer" }}>{t('userManagement.delete')}</Text>}
																			</Pressable>
																		</TableData>
																	);
																default:
																	return (
																		<TableData key={col.key} style={{ ...cellStyle, justifyContent: "flex-start" }}>
																			<Text
																				style={{
																					fontSize: isTinyScreen ? 10 : isMobileScreen ? 12 : 14,
																					maxWidth: col.maxWidth
																				}}
																			>
																				{user[col.key as keyof User]}
																			</Text>
																		</TableData>
																	);
															}
														})}
													</TableRow>
												))}
											</TableBody>
										) : (
											<TableBody>
												<TableRow style={{ backgroundColor: "transparent" }}>
													<TableData
														colSpan={columns.length}
														style={{
															width: "100%",
															justifyContent: "center",
															alignItems: "center",
															paddingVertical: 20
														}}
													>
														<Text
															style={{
																fontSize: isTinyScreen ? 10 : isMobileScreen ? 12 : 14,
																color: "#6b7280",
																textAlign: "center"
															}}
														>
															{t('userManagement.noUsers')}
														</Text>
													</TableData>
												</TableRow>
											</TableBody>
										)}
									</Table>
								</VStack>
							</VStack>
						</ScrollView>

						<Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
							<ModalBackdrop />
							<ModalContent>
								<ModalHeader>
									<Heading>{t('userManagement.confirmDeletion')}</Heading>
									<ModalCloseButton>
										<Icon as={CloseIcon} />
									</ModalCloseButton>
								</ModalHeader>
								<ModalBody>
									<Text>{t('userManagement.deleteConfirmation')}</Text>
								</ModalBody>
								<ModalFooter>
									<Button variant="outline" style={{ marginRight: 3 }} onPress={() => setShowDeleteModal(false)}>
										<ButtonText>{t('userManagement.cancel')}</ButtonText>
									</Button>
									<Button
										style={{ backgroundColor: "red" }}
										onPress={() => {
											if (deleteUserEmail) handleDelete(deleteUserEmail);
											setShowDeleteModal(false);
										}}
									>
										<ButtonText>{t('userManagement.delete')}</ButtonText>
									</Button>
								</ModalFooter>
							</ModalContent>
						</Modal>
					</VStack>
				</LinearGradient>
			</ProtectedRoute>
		);
}