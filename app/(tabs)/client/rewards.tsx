// @ts-nocheck
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { SafeAreaView } from "react-native-safe-area-context";
import ProtectedRoute from "@/app/_wrappers/ProtectedRoute";
import { Package, Gift, Zap } from "lucide-react-native";

export default function RewardsScreen() {
	const { t } = useTranslation();

	return (
		<ProtectedRoute>
			{userData => {
				type Redemption = {
					productId: string;
					productName: string;
					productGroup: string;
					quantity: number;
				};

				const redemptions: Redemption[] = userData?.redemptions ? (Object.values(userData.redemptions) as Redemption[]) : [];

				return (
					<LinearGradient colors={["#F0FDF4", "#ECFEFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
						<SafeAreaView style={{ flex: 1 }}>
							{/* Header Section */}
							<VStack space="sm" style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" }}>
								<Heading size="lg" style={{ color: "#166534" }}>
									{t("userRewards.header.title")}
								</Heading>
								<HStack space="xs" style={{ alignItems: "center" }}>
									<Icon as={Zap} size="sm" style={{ color: "#059669" }} />
									<Text style={{ color: "#059669", fontWeight: "medium" }}>{t("userRewards.header.availablePoints", { points: userData?.points || 0 })}</Text>
								</HStack>
							</VStack>

							{/* Table Header */}
							<Card
								style={{
									margin: 16,
									marginBottom: 8,
									padding: 16,
									backgroundColor: "#E3F9EF",
									borderColor: "#E3F9EF",
									borderRadius: 8
								}}
							>
								<HStack style={{ alignItems: "center" }}>
									<Text style={{ flex: 3, fontSize: 14, fontWeight: "600", color: "#64748B" }}>{t("userRewards.table.item")}</Text>
									<Text style={{ flex: 2, fontSize: 14, fontWeight: "600", color: "#64748B" }}>{t("userRewards.table.group")}</Text>
									<Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#64748B", textAlign: "right" }}>{t("userRewards.table.quantity")}</Text>
								</HStack>
							</Card>

							{/* Rewards List */}
							<ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
								{redemptions.length === 0 ? (
									<VStack space="md" style={{ alignItems: "center", padding: 24 }}>
										<Icon as={Package} size="xl" style={{ color: "#D1D5DB" }} />
										<Text style={{ color: "#6B7280", textAlign: "center" }}>
											{t("userRewards.emptyState.title")}
											{"\n"}
											{t("userRewards.emptyState.description")}
										</Text>
									</VStack>
								) : (
									<VStack space="sm">
										{redemptions.map(redemption => (
											<Card
												key={redemption.productId}
												style={{
													padding: 16,
													borderRadius: 8,
													backgroundColor: "white",
													borderColor: "#E2E8F0",
													shadowColor: "#000",
													shadowOffset: { width: 0, height: 1 },
													shadowOpacity: 0.05,
													shadowRadius: 2,
													elevation: 1
												}}
											>
												<HStack style={{ alignItems: "center" }}>
													{/* Item Column */}
													<HStack space="md" style={{ flex: 3, alignItems: "center" }}>
														<Box
															style={{
																width: 40,
																height: 40,
																borderRadius: 6,
																backgroundColor: "#ECFDF5",
																justifyContent: "center",
																alignItems: "center"
															}}
														>
															<Icon as={Gift} size="md" style={{ color: "#10B981" }} />
														</Box>
														<Text
															style={{
																fontSize: 14,
																fontWeight: "500",
																color: "#1E293B",
																maxWidth: "80%"
															}}
															numberOfLines={1}
														>
															{redemption.productName}
														</Text>
													</HStack>

													{/* Group Column */}
													<Text style={{ flex: 2, fontSize: 14, color: "#64748B" }}>{redemption.productGroup}</Text>

													{/* Quantity Column */}
													<Text
														style={{
															flex: 1,
															fontSize: 14,
															color: "#1E293B",
															textAlign: "right",
															fontWeight: "500"
														}}
													>
														{redemption.quantity}
													</Text>
												</HStack>
											</Card>
										))}
									</VStack>
								)}
							</ScrollView>
						</SafeAreaView>
					</LinearGradient>
				);
			}}
		</ProtectedRoute>
	);
}