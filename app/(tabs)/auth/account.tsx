// @ts-nocheck
import { useState } from "react";
import { useWindowDimensions, ScrollView, Alert } from "react-native";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { useTranslation } from "react-i18next";
import FirebaseDecoder from "@/app/tools/FirebaseDecoder";
import ProtectedRoute from "@/app/_wrappers/ProtectedRoute";

export default function ProfileScreen() {
    const [isHovered, setIsHovered] = useState(false);
    const { width, height } = useWindowDimensions();
    const isLargeScreen = width >= 765;
    const isShortScreen = height < 750;
    const isMobileScreen = width < 680;

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { t } = useTranslation();

    const toast = useToast();

    const LG = LinearGradient as unknown as React.ComponentType<LinearGradientProps>;

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

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(auth);
            showToast(t("account.logoutSuccessTitle"), t("account.logoutSuccessDesc"));
        } catch (error: any) {
            showToast(t("account.logoutFailTitle"), FirebaseDecoder({ error: error }));
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <ProtectedRoute showAuth={true}>
            {(userData) => (
                <LG
                    colors={isMobileScreen ? ['#00FFDD', '#1B9CFF'] : ['#1B9CFF', '#00FFDD']}
                    start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                    end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <HStack
                            style={{
                                maxHeight: "100%",
                                flex: 1,
                                gap: isLargeScreen ? 16 : 8,
                                padding: isLargeScreen ? 16 : 24,
                                marginTop: isLargeScreen && isShortScreen ? 20 : 0,
                                justifyContent: isLargeScreen ? "center" : "space-between",
                                alignItems: "center",
                                flexDirection: isLargeScreen ? "row" : "column",
                            }}
                        >
                            <HStack
                                style={{
                                    justifyContent: "center",
                                    alignItems: "center",
                                    width: isLargeScreen ? "40%" : "100%",
                                    height: isLargeScreen ? "100%" : "30%",
                                    marginTop: isMobileScreen ? 0 : -40,
                                    marginBottom: isLargeScreen ? -20 : 10,
                                }}
                            >
                                <Avatar
                                    style={{
                                        borderRadius: 9999,
                                        width: isLargeScreen ? 300 : isShortScreen ? 100 : 140,
                                        height: isLargeScreen ? 300 : isShortScreen ? 100 : 140,
                                        overflow: "hidden",
                                        marginTop: isLargeScreen ? -80 : 50,
                                    }}
                                >
                                    <AvatarFallbackText>{userData?.username}</AvatarFallbackText>
                                    <AvatarImage
                                        accessibilityLabel={userData?.username}
                                        source={{ uri: "https://bit.ly/dan-abramov" }}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                </Avatar>
                            </HStack>

                            <VStack
                                style={{
                                    justifyContent: "center",
                                    alignItems: "center",
                                    width: isLargeScreen ? "60%" : "100%",
                                    padding: isLargeScreen ? 0 : 16,
                                    height: isLargeScreen ? "100%" : "70%",
                                    gap: 16,
                                    flex: 1,
                                }}
                            >
                                <Card
                                    style={{
                                        backgroundColor: "white",
                                        borderRadius: 20,
                                        padding: isLargeScreen ? 10 : isShortScreen ? 5 : 10,
                                        width: isLargeScreen ? "80%" : "100%",
                                    }}
                                >
                                    <VStack style={{ padding: 16, gap: 12 }}>
                                        <Text
                                            style={{
                                                fontSize: isLargeScreen ? 32 : 28,
                                                fontWeight: "800",
                                                textAlign: "center",
                                                paddingTop: 10,
                                                marginBottom: 10,
                                            }}
                                        >
                                            {userData?.username || t("account.filmManagerUser")}
                                        </Text>

                                        <VStack style={{ marginBottom: 10 }}>
                                            <Text
                                                style={{
                                                    color: "#A0A0A0",
                                                    fontWeight: "500",
                                                    fontSize: 20,
                                                }}
                                            >
                                                {t("account.username")}
                                            </Text>

                                            <Input
                                                variant="underlined"
                                                style={{
                                                    marginTop: 5,
                                                    backgroundColor: "transparent",
                                                    padding: 0,
                                                }}
                                            >
                                                <InputField
                                                    editable={false}
                                                    value={userData?.username || t("account.fetching")}
                                                    style={{
                                                        fontSize: 20,
                                                        fontWeight: "600",
                                                        color: "gray"
                                                    }}
                                                />
                                            </Input>
                                        </VStack>

                                        <VStack style={{ marginBottom: 10 }}>
                                            <Text
                                                style={{
                                                    color: "#A0A0A0",
                                                    fontWeight: "500",
                                                    fontSize: 20,
                                                }}
                                            >
                                                {t("account.email")}
                                            </Text>

                                            <Input
                                                variant="underlined"
                                                style={{
                                                    marginTop: 5,
                                                    backgroundColor: "transparent",
                                                    padding: 0,
                                                }}
                                            >
                                                <InputField
                                                    editable={false}
                                                    value={userData?.email || t("account.fetching")}
                                                    style={{
                                                        fontSize: 20,
                                                        fontWeight: "600",
                                                        color: "gray"
                                                    }}
                                                />
                                            </Input>
                                        </VStack>

                                        {userData.role === "User" ? userData?.points !== null ? (
                                            <VStack style={{ marginTop: 20 }}>
                                                <Text
                                                    style={{
                                                        textAlign: "center",
                                                        fontSize: isLargeScreen ? 36 : 30,
                                                        fontWeight: "800",
                                                        color: "#1B9CFF",
                                                        paddingTop: 15,
                                                        marginBottom: isLargeScreen	? 15 : 0,
                                                    }}
                                                >
                                                    {userData?.points}
                                                </Text>

                                                <Text
                                                    style={{
                                                        textAlign: "center",
                                                        color: "#A0A0A0",
                                                        fontWeight: "500",
                                                        fontSize: isLargeScreen ? 20 : 14,
                                                    }}
                                                >
                                                    {t("account.pointsRemaining")}
                                                </Text>
                                            </VStack>
                                        ) : (
                                            <Text
                                                style={{
                                                    textAlign: "center",
                                                    color: "#A0A0A0",
                                                    fontWeight: "500",
                                                    fontSize: isLargeScreen ? 20 : 14,
                                                }}
                                            >
                                                {t("account.fetchingPoints")}
                                            </Text>
                                        ) : (
                                            <Text
                                                style={{
                                                    textAlign: "center",
                                                    color: "#A0A0A0",
                                                    fontWeight: "500",
                                                    fontSize: isLargeScreen ? 20 : 14,
                                                }}
                                            >
                                                {t("account.admin")}
                                            </Text>
                                        )}
                                    </VStack>
                                </Card>

                                <Button
                                    onHoverIn={() => setIsHovered(true)}
                                    onHoverOut={() => setIsHovered(false)}
                                    onPress={handleLogout}
                                    disabled={isLoggingOut}
                                    style={{
                                        marginTop: 10,
                                        marginBottom: 20,
                                        backgroundColor: isHovered ? "#FF4D4D" : "#FF8383",
                                        borderRadius: 10,
                                        alignSelf: "center",
                                        width: isLargeScreen ? "80%" : "100%",
                                        transform: [{ scale: isHovered ? 1.01 : 1 }],
                                        transitionDuration: "200ms",
                                    }}
                                >
                                    {isLoggingOut ? (
                                        <Spinner size="small" color="white" />
                                    ) : (
                                        <Text style={{ color: "white", fontWeight: "700" }}>
                                            {t("account.logout")}
                                        </Text>
                                    )}
                                </Button>
                            </VStack>
                        </HStack>
                    </ScrollView>
                </LG>
            )}
        </ProtectedRoute>
    );
}