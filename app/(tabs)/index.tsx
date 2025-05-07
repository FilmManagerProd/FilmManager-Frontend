// @ts-nocheck
import { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import ProtectedRoute from "../_wrappers/ProtectedRoute";
import { useTranslation } from "react-i18next";

export default function HomepageScreen() {
    const [activeTab, setActiveTab] = useState<"scanner" | "management">("scanner");
    const [hoverScannerTab, setHoverScannerTab] = useState(false);
    const [hoverManagementTab, setHoverManagementTab] = useState(false);
    const [hoverReceive, setHoverReceive] = useState(false);
    const [hoverDispatch, setHoverDispatch] = useState(false);
    const [hoverCheckInfo, setHoverCheckInfo] = useState(false);
    const [hoverItem, setHoverItem] = useState(false);
    const [hoverUser, setHoverUser] = useState(false);
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const isShortScreen = height < 750;
    const isMobileScreen = width < 680;
    const { t } = useTranslation();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('greeting.morning');
        if (hour < 18) return t('greeting.afternoon');
        return t('greeting.evening');
    };

    const getHoverStyle = (hovered: boolean, baseStyle: object = {}) => ({
        transform: [{ scale: hovered ? 1.02 : 1 }],
        transitionDuration: "400ms",
        backgroundColor: "white",
        ...baseStyle,
    });

    return (
        <ProtectedRoute showAuth={false}>
            {(userData) => (
                userData.role === "Admin" ? (
                    <LinearGradient
                        colors={isMobileScreen ? ['#00FFDD', '#1B9CFF'] : ['#1B9CFF', '#00FFDD']}
                        start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                        end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    >
                        <VStack style={{ flex: 1, padding: 20 }} space="2xl">
                            <Box
                                style={{
                                    marginBottom: isMobileScreen ? 20: 50,
                                    marginTop: isMobileScreen
                                        ? isShortScreen
                                            ? 36
                                            : 100
                                        : isShortScreen
                                        ? 36
                                        : 40,
                                    width: "100%",
                                    alignItems: "center",
                                    height: "5%"
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={{
                                        color: "white",
                                        fontSize: isMobileScreen
                                            ? isShortScreen
                                                ? 20
                                                : 28
                                            : isShortScreen
                                            ? 36
                                            : 40,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        paddingTop: isMobileScreen ? 0 : 8,
                                    }}
                                >
                                    {getGreeting()}, {userData?.username}!
                                </Text>
                            </Box>

                            {/* Tab Navigation */}
                            <HStack style={{ backgroundColor: "backgroundLight100", padding: 2, width: "100%", maxWidth: 600, alignSelf: "center", borderRadius: 999, margin: "auto", marginBottom: 0, height: "5%" }} space="xl">
                                <Button
                                    onHoverIn={() => setHoverScannerTab(true)}
                                    onHoverOut={() => setHoverScannerTab(false)}
                                    onPress={() => setActiveTab("scanner")}
                                    style={{
                                        flex: 1,
                                        borderColor: "transparent",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        borderRadius: 10,
                                        ...getHoverStyle(hoverScannerTab, {
                                            backgroundColor:
                                                activeTab === "scanner"
                                                    ? "#1B9CFF"
                                                    : "white",
                                        }),
                                    }}
                                >
                                    <HStack space="sm" style={{ alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name="scan" size={ isMobileScreen ? 16 : 24} color={activeTab === "scanner" ? "white" : "black"} />
                                        <ButtonText style={{
                                            fontWeight: "600", color: activeTab === "scanner" ? "white" : "black",
                                            fontSize: isMobileScreen ? 15 : isShortScreen ? 20 : 20, textAlign: "center"
                                        }}>
                                            {t('adminTab.scanner')}
                                        </ButtonText>
                                    </HStack>
                                </Button>

                                <Button
                                    onHoverIn={() => setHoverManagementTab(true)}
                                    onHoverOut={() => setHoverManagementTab(false)}
                                    onPress={() => setActiveTab("management")}
                                    style={{
                                        flex: 1,
                                        borderColor: "transparent",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        borderRadius: 10,
                                        ...getHoverStyle(hoverManagementTab, {
                                            backgroundColor:
                                                activeTab === "management"
                                                    ? "#1B9CFF"
                                                    : "white",
                                        }),
                                    }}
                                >
                                    <HStack space="sm" style={{ alignItems: "center", justifyContent: "center" }}>
                                        <Ionicons name="settings" size={ isMobileScreen ? 16 : 24} color={activeTab === "management" ? "white" : "black"} />
                                        <ButtonText style={{
                                            fontWeight: "600", color: activeTab === "management" ? "white" : "black",
                                            fontSize: isMobileScreen ? 15 : isShortScreen ? 20 : 20, textAlign: "center"
                                        }}>
                                            {t('adminTab.management')}
                                        </ButtonText>
                                    </HStack>
                                </Button>
                            </HStack>

                            {activeTab === "scanner" ? (
                                <VStack space="xl" style={{ flex: 1, height: "90%" }}>
                                    <HStack
                                        style={{
                                            flexDirection: isMobileScreen
                                                ? "column"
                                                : isShortScreen
                                                ? "row"
                                                : "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            width: isMobileScreen ? "100%" : "70%",
                                            margin: "auto",
                                            marginBottom: isMobileScreen ? 10 : 30,
                                            marginTop: 40,
                                            height: isMobileScreen ? "70%" : "60%",
                                            gap: isMobileScreen ? 50 : 100,
                                        }}
                                        space="lg"
                                    >
                                        <Button
                                            size="xl"
                                            onHoverIn={() => setHoverReceive(true)}
                                            onHoverOut={() => setHoverReceive(false)}
                                            onPress={() => {
                                                router.push("/admin/scanner?mode=receive");
                                            }}
                                            style={{
                                                height: isMobileScreen
                                                    ? "auto"
                                                    : "100%",
                                                width: isMobileScreen ? "50%" : "50%",
                                                elevation: 5,
                                                flex: 1,
                                                borderRadius: 20,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 4,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                ...getHoverStyle(hoverReceive),
                                            }}
                                        >
                                            <VStack
                                                style={{ alignItems: "center" }}
                                                space="sm"
                                            >
                                                <Ionicons
                                                    name="download"
                                                    size={
                                                        isMobileScreen
                                                            ? isShortScreen
                                                                ? 50
                                                                : 80
                                                            : isShortScreen
                                                            ? 50
                                                            : 200
                                                    }
                                                    color="#1B9CFF"
                                                />
                                                <ButtonText
                                                    style={{
                                                        color: "#1B9CFF",
                                                        fontSize: isMobileScreen
                                                            ? 20
                                                            : isShortScreen
                                                            ? 24
                                                            : 24,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {t('adminButton.receive')}
                                                </ButtonText>
                                            </VStack>
                                        </Button>

                                        <Button
                                            size="xl"
                                            onHoverIn={() => setHoverDispatch(true)}
                                            onHoverOut={() => setHoverDispatch(false)}
                                            onPress={() => {
                                                router.push("/admin/scanner?mode=dispatch");
                                            }}
                                            style={{
                                                height: isMobileScreen
                                                    ? "auto"
                                                    : "100%",
                                                width: isMobileScreen ? "50%" : "50%",
                                                elevation: 5,
                                                flex: 1,
                                                borderRadius: 20,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 4,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                ...getHoverStyle(hoverDispatch),
                                            }}
                                        >
                                            <VStack
                                                style={{ alignItems: "center" }}
                                                space="sm"
                                            >
                                                <Ionicons
                                                    name="arrow-up"
                                                    size={
                                                        isMobileScreen
                                                            ? isShortScreen
                                                                ? 50
                                                                : 80
                                                            : isShortScreen
                                                            ? 50
                                                            : 200
                                                    }
                                                    color="#1B9CFF"
                                                />
                                                <ButtonText
                                                    style={{
                                                        color: "#1B9CFF",
                                                        fontSize: isMobileScreen
                                                            ? 20
                                                            : isShortScreen
                                                            ? 24
                                                            : 24,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {t('adminButton.dispatch')}
                                                </ButtonText>
                                            </VStack>
                                        </Button>
                                    </HStack>

                                    <Button
                                        onHoverIn={() => setHoverCheckInfo(true)}
                                        onHoverOut={() => setHoverCheckInfo(false)}
                                        onPress={() => {
                                            router.push("/admin/scanner?mode=info")
                                        }}
                                        style={{
                                            height: isMobileScreen
                                                ? "10%"
                                                : isShortScreen
                                                ? "20%"
                                                : "10%",
                                            alignSelf: "center",
                                            elevation: 5,
                                            borderRadius: 20,
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 4,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            ...getHoverStyle(hoverCheckInfo, {
                                                backgroundColor: "white",
                                            }),
                                        }}
                                    >
                                        <HStack space="sm">
                                            <Ionicons
                                                name="information-circle"
                                                size={24}
                                                color="#1B9CFF"
                                            />
                                            <ButtonText
                                                style={{
                                                    color: "#1B9CFF",
                                                    fontSize: 18,
                                                }}
                                            >
                                                {t('adminButton.checkInfo')}
                                            </ButtonText>
                                        </HStack>
                                    </Button>
                                </VStack>
                            ) : (
                                <VStack space="xl" style={{ flex: 1, height: "90%" }}>
                                    <HStack
                                        style={{
                                            flexDirection: isMobileScreen
                                                ? "column"
                                                : isShortScreen
                                                ? "row"
                                                : "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            width: isMobileScreen ? "100%" : "70%",
                                            margin: "auto",
                                            marginBottom: isMobileScreen ? 24 : 40,
                                            marginTop: 40,
                                            height: isMobileScreen ? "70%" : "60%",
                                            gap: isMobileScreen ? 50 : 100,
                                        }}
                                        space="lg"
                                    >
                                        <Button
                                            size="xl"
                                            onHoverIn={() => setHoverItem(true)}
                                            onHoverOut={() => setHoverItem(false)}
                                            onPress={() => {
                                                router.push("/admin/itemsManagement")
                                            }}
                                            style={{
                                                height: isMobileScreen
                                                    ? "auto"
                                                    : "100%",
                                                width: isMobileScreen ? "50%" : "50%",
                                                elevation: 5,
                                                flex: 1,
                                                borderRadius: 20,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 4,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                ...getHoverStyle(hoverItem),
                                            }}
                                        >
                                            <VStack
                                                style={{ alignItems: "center" }}
                                                space="sm"
                                            >
                                                <Ionicons
                                                    name="gift"
                                                    size={
                                                        isMobileScreen
                                                            ? 80
                                                            : isShortScreen
                                                            ? 50
                                                            : 200
                                                    }
                                                    color="#1B9CFF"
                                                />
                                                <ButtonText
                                                    style={{
                                                        color: "#1B9CFF",
                                                        fontSize: isMobileScreen
                                                            ? 20
                                                            : isShortScreen
                                                            ? 24
                                                            : 24,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {t('adminButton.itemsManagement')}
                                                </ButtonText>
                                            </VStack>
                                        </Button>

                                        <Button
                                            size="xl"
                                            onHoverIn={() => setHoverUser(true)}
                                            onHoverOut={() => setHoverUser(false)}
                                            onPress={() => {
                                                router.push("/admin/userManagement")
                                            }}
                                            style={{
                                                height: isMobileScreen
                                                    ? "auto"
                                                    : "100%",
                                                width: isMobileScreen ? "50%" : "50%",
                                                elevation: 5,
                                                flex: 1,
                                                borderRadius: 20,
                                                shadowColor: "#000",
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.2,
                                                shadowRadius: 4,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                ...getHoverStyle(hoverUser),
                                            }}
                                        >
                                            <VStack
                                                style={{ alignItems: "center" }}
                                                space="sm"
                                            >
                                                <Ionicons
                                                    name="people"
                                                    size={
                                                        isMobileScreen
                                                            ? 80
                                                            : isShortScreen
                                                            ? 50
                                                            : 200
                                                    }
                                                    color="#1B9CFF"
                                                />
                                                <ButtonText
                                                    style={{
                                                        color: "#1B9CFF",
                                                        fontSize: isMobileScreen
                                                            ? 20
                                                            : isShortScreen
                                                            ? 24
                                                            : 24,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {t('adminButton.userManagement')}
                                                </ButtonText>
                                            </VStack>
                                        </Button>
                                    </HStack>
                                </VStack>
                            )}
                        </VStack>
                    </LinearGradient>
                ) : (
                    <LinearGradient
                        colors={isMobileScreen ? ['#00FFDD', '#1B9CFF'] : ['#1B9CFF', '#00FFDD']}
                        start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                        end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    >
                        <VStack style={{ flex: 1, padding: 20 }} space="2xl">
                            <Box style={{ marginTop: isMobileScreen ? 40 : 80, width: "100%" }}>
                                <Text style={{
                                    color: "white",
                                    fontSize: isMobileScreen ? 28 : 36,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    paddingTop: isMobileScreen ? 30 : 0
                                }}>
                                    {getGreeting()}, {userData?.username}!
                                </Text>
                                <Text style={{
                                    color: "rgba(255,255,255,0.9)",
                                    fontSize: isMobileScreen ? 16 : 18,
                                    textAlign: "center",
                                    marginTop: 20
                                }}>
                                    {t("userHomepage.readyToExplore")}
                                </Text>
                            </Box>

                            <HStack
                                style={{
                                    flex: 1,
                                    flexDirection: isMobileScreen ? "column" : "row",
                                    gap: 24,
                                    padding: 20,
                                    justifyContent: "center",
                                    alignItems: "center"
                                }}
                            >
                                <Button
                                    onHoverIn={() => setHoverReceive(true)}
                                    onHoverOut={() => setHoverReceive(false)}
                                    onPress={() => router.push("/client/redeem")}
                                    style={{
                                        width: isMobileScreen ? "100%" : 300,
                                        height: isMobileScreen ? 200 : 350,
                                        backgroundColor: "white",
                                        borderRadius: 24,
                                        padding: 24,
                                        ...getHoverStyle(hoverReceive, {
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 12,
                                        }),
                                    }}
                                >
                                    <VStack space="md" style={{ alignItems: "center" }}>
                                        <LinearGradient
                                            colors={['#1B9CFF', '#00FFDD']}
                                            style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 16,
                                                justifyContent: "center",
                                                alignItems: "center"
                                            }}
                                        >
                                            <Ionicons name="gift" size={40} color="white" />
                                        </LinearGradient>
                                        <Text style={{
                                            fontSize: isMobileScreen ? 20 : 24,
                                            fontWeight: "bold",
                                            color: "#1B9CFF",
                                            marginTop: 16
                                        }}>
                                            {t("userHomepage.availableRewards")}
                                        </Text>
                                        <Text style={{
                                            textAlign: "center",
                                            color: "#666",
                                            fontSize: isMobileScreen ? 14 : 16
                                        }}>
                                            {t("userHomepage.availableRewardsDesc")}
                                        </Text>
                                    </VStack>
                                </Button>

                                <Button
                                    onHoverIn={() => setHoverDispatch(true)}
                                    onHoverOut={() => setHoverDispatch(false)}
                                    onPress={() => router.push("/client/rewards")}
                                    style={{
                                        width: isMobileScreen ? "100%" : 300,
                                        height: isMobileScreen ? 200 : 350,
                                        backgroundColor: "white",
                                        borderRadius: 24,
                                        padding: 24,
                                        ...getHoverStyle(hoverDispatch, {
                                            shadowColor: "#000",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 12,
                                        }),
                                    }}
                                >
                                    <VStack space="md" style={{ alignItems: "center" }}>
                                        <LinearGradient
                                            colors={['#FF6B6B', '#FF8E53']}
                                            style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 16,
                                                justifyContent: "center",
                                                alignItems: "center"
                                            }}
                                        >
                                            <Ionicons name="trophy" size={40} color="white" />
                                        </LinearGradient>
                                        <Text style={{
                                            fontSize: isMobileScreen ? 20 : 24,
                                            fontWeight: "bold",
                                            color: "#FF6B6B",
                                            marginTop: 16
                                        }}>
                                            {t("userHomepage.myRewards")}
                                        </Text>
                                        <Text style={{
                                            textAlign: "center",
                                            color: "#666",
                                            fontSize: isMobileScreen ? 14 : 16
                                        }}>
                                            {t("userHomepage.myRewardsDesc")}
                                        </Text>
                                    </VStack>
                                </Button>
                            </HStack>

                            <Box style={{
                                backgroundColor: "rgba(255,255,255,0.2)",
                                padding: 16,
                                borderRadius: 16,
                                marginBottom: 24,
                                alignSelf: "center"
                            }}>
                                <HStack space="sm" style={{ alignItems: "center" }}>
                                    <Ionicons name="wallet" size={24} color="white" />
                                    <Text style={{ color: "white", fontSize: 16 }}>
                                        {t("userHomepage.availablePoints")}
                                    </Text>
                                    <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                                        {userData?.points || 0} {t("userHomepage.points")}
                                    </Text>
                                </HStack>
                            </Box>
                        </VStack>
                    </LinearGradient>
                )
            )}
        </ProtectedRoute>
    );
}