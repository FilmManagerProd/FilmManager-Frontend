// @ts-nocheck
import { useAuth } from "@/contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname } from "expo-router";
import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { auth } from "@/firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState, useRef } from "react";
import { Input, InputField } from "@/components/ui/input";
import { Eye, EyeClosed, LogInIcon } from "lucide-react-native";
import { Platform, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import server from "../../networking";
import FirebaseDecoder from "../tools/FirebaseDecoder";

type AuthFormProps = {
	isRegister: boolean;
	onSubmit: (email: string, password: string, username?: string) => Promise<void>;
	switchForm: () => void;
};

const AuthForm = ({ isRegister, onSubmit, switchForm }: AuthFormProps) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const toast = useToast();

	const { t } = useTranslation();

	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [usernameError, setUsernameError] = useState("");
	const [attemptedSubmit, setAttemptedSubmit] = useState(false);

	const isWeb = Platform.OS === "web";

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
			}
		});
	};

	const validateEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email) {
			setEmailError(t("auth.emailRequired"));
			return false;
		} else if (!emailRegex.test(email)) {
			setEmailError(t("auth.invalidEmail"));
			return false;
		} else {
			setEmailError("");
			return true;
		}
	};

	const validatePassword = (password: string) => {
		const errors = [];

		if (!password) {
			errors.push(t("auth.passwordRequired"));
		} else {
			if (password.length < 12) {
				errors.push(t("auth.passwordLength"));
			}
			if (!/[A-Z]/.test(password)) {
				errors.push(t("auth.passwordUppercase"));
			}
			if (!/[0-9]/.test(password)) {
				errors.push(t("auth.passwordNumber"));
			}
			if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
				errors.push(t("auth.passwordSpecial"));
			}
		}

		if (errors.length > 0) {
			setPasswordError(errors.join(", "));
			return false;
		} else {
			setPasswordError("");
			return true;
		}
	};

	const validateUsername = (username: string) => {
		if (isRegister && !username) {
			setUsernameError(t("auth.usernameRequired"));
			return false;
		} else {
			setUsernameError("");
			return true;
		}
	};

	useEffect(() => {
		setEmailError("");
		setPasswordError("");
		setUsernameError("");
		setAttemptedSubmit(false);
	}, [isRegister]);

	useEffect(() => {
		if (!isWeb) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				handleSubmit();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [email, password, username, isRegister]);

	const validateForm = () => {
		const isEmailValid = validateEmail(email.trim());
		const isPasswordValid = validatePassword(password.trim());
		const isUsernameValid = validateUsername(username.trim());

		return isEmailValid && isPasswordValid && (isRegister ? isUsernameValid : true);
	};

	const handleSubmit = async () => {
		setAttemptedSubmit(true);

		const isValid = validateForm();

		if (!isValid) {
			showToast(t("auth.uhOh"), t("auth.checkInputs"));
			return;
		}

		try {
			setIsSubmitting(true);
			await onSubmit(email.trim(), password.trim(), username.trim());
		} catch (err) {
			showToast(t("auth.uhOh"), err);
			setIsSubmitting(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card
			style={{
				backgroundColor: "white",
				borderRadius: 20,
				padding: isWeb ? 24 : 16,
				width: "100%",
				maxWidth: isWeb ? 480 : "100%",
				alignSelf: "center",
				boxShadow: isWeb ? "0px 4px 20px rgba(0, 0, 0, 0.1)" : undefined
			}}
		>
			<VStack space="md" style={{ padding: isWeb ? 24 : 16 }}>
				<Text
					style={{
						fontSize: 24,
						fontWeight: "800",
						textAlign: "center",
						padding: 10,
						color: "#333"
					}}
				>
					{isRegister ? t("auth.register") : t('auth.login')}
				</Text>

				{isRegister && (
					<VStack style={{ marginBottom: isWeb ? 16 : 8 }}>
						<Text style={{ color: "#A0A0A0", fontWeight: "500" }}>{t("account.username")}</Text>
						<Input variant="underlined" style={{ marginTop: 4 }}>
							<InputField value={username} onChangeText={setUsername} placeholder={t("auth.enterUsername")} autoCapitalize="none" style={{ fontSize: isWeb ? 16 : 14 }} />
						</Input>
						{attemptedSubmit && usernameError ? (
							<Text
								style={{
									color: "red",
									fontSize: 12,
									marginTop: 4
								}}
							>
								{usernameError}
							</Text>
						) : null}
					</VStack>
				)}

				<VStack style={{ marginBottom: isWeb ? 16 : 8 }}>
					<Text style={{ color: "#A0A0A0", fontWeight: "500" }}>{t("auth.email")}</Text>
					<Input variant="underlined" style={{ marginTop: 4 }}>
						<InputField value={email.trim()} onChangeText={setEmail} placeholder={t("auth.enterEmail")} autoCapitalize="none" keyboardType="email-address" style={{ fontSize: isWeb ? 16 : 14 }} onSubmitEditing={handleSubmit} />
					</Input>
					{attemptedSubmit && emailError ? <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>{emailError}</Text> : null}
				</VStack>

				<VStack style={{ marginBottom: isWeb ? 24 : 16 }}>
					<Text style={{ color: "#A0A0A0", fontWeight: "500" }}>{t("auth.password")}</Text>
					<HStack style={{ alignItems: "center", marginTop: 4 }}>
						<Input variant="underlined" style={{ flex: 1 }}>
							<InputField value={password.trim()} onChangeText={setPassword} placeholder={t("auth.enterPassword")} secureTextEntry={!showPassword} style={{ fontSize: isWeb ? 16 : 14 }} onSubmitEditing={handleSubmit} />
						</Input>
						<Button
							onPress={() => setShowPassword(!showPassword)}
							style={{
								backgroundColor: "transparent",
								...(isWeb && { cursor: "pointer" })
							}}
						>
							<Icon as={showPassword ? EyeClosed : Eye} size="md" color="#000" />
						</Button>
					</HStack>
					{attemptedSubmit && passwordError ? <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>{passwordError}</Text> : null}
				</VStack>

				<Button
					onPress={handleSubmit}
					style={{
						backgroundColor: "#1B9CFF",
						borderRadius: 8,
						paddingVertical: isWeb ? 12 : 8,
						marginTop: 8,
						...(isWeb && { cursor: "pointer" })
					}}
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<Spinner size="small" color={"white"} />
					) : (
						<Text
							style={{
								color: "white",
								fontWeight: "700",
								fontSize: isWeb ? 16 : 14
							}}
						>
							{isRegister ? t("auth.register") : t('auth.login')}
						</Text>
					)}
				</Button>

				<Button
					variant="link"
					onPress={switchForm}
					style={{
						marginTop: 16,
						marginBottom: 8,
						...(isWeb && { cursor: "pointer" })
					}}
				>
					<Text
						style={{
							color: "#1B9CFF",
							textAlign: "center",
							fontSize: isWeb ? 15 : 14
						}}
					>
						{isRegister ? t("auth.alreadyHaveAccount") : t("auth.noAccount")}
					</Text>
				</Button>
			</VStack>
		</Card>
	);
};

type ProtectedRouteProps = {
	showAuth?: boolean;
	children: React.ReactNode | ((userData: any) => React.ReactNode);
};

export default function ProtectedRoute({ showAuth, children }: ProtectedRouteProps) {
	const [isRegister, setIsRegister] = useState(false);
	const { userData, loading, login, register, logout } = useAuth();
	const router = useRouter();
	const isWeb = Platform.OS === "web";
	const toast = useToast();

	const pathname = usePathname();

	const { t } = useTranslation();

	const { width, height } = useWindowDimensions();
	const isMobileScreen = width < 680;

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
			}
		});
	};

	const handleAuth = async (email: string, password: string, username?: string) => {
		try {
			if (isRegister && username) {
				await register(email, password, username);
				showToast(t("auth.success"), t("auth.loginSuccess"));
			} else {
				await login(email, password);
				showToast(t("auth.success"), t("auth.loginSuccess"));
			}
		} catch (error) {
			showToast(t("auth.uhOh"), error?.response?.data?.error || error.message || t("auth.error"));
		}
	};

	useEffect(() => {
		if (pathname) {
			if (userData) {
				if (userData.role === "User" && !pathname.startsWith("/auth") && !pathname.startsWith("/client") && pathname !== "/") {
					router.replace("/auth/account");
					showToast(t("auth.accessDenied"), t("auth.notPermitted"));
				}

				if (userData.role === "Admin" && !pathname.startsWith("/auth") && !pathname.startsWith("/admin") && pathname !== "/") {
					router.replace("/auth/account");
					showToast(t("auth.accessDenied"), t("auth.notPermitted"));
				}
			}
		}
	}, [pathname, userData]);

	if (loading) {
		return (
			<LinearGradient colors={isMobileScreen ? ["#00FFDD", "#1B9CFF"] : ["#1B9CFF", "#00FFDD"]} start={isMobileScreen ? { x: 0, y: 0 } : { x: 0, y: 0 }} end={isMobileScreen ? { x: 0, y: 1 } : { x: 1, y: 1 }} style={{ flex: 1, justifyContent: "center",alignItems: "center"}}>
				<Spinner size="large" />
			</LinearGradient>
		);
	}

	if (!userData) {
		if (showAuth) {
			return (
				<LinearGradient
					colors={["#00FFDD", "#1B9CFF"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					style={{
						flex: 1,
						justifyContent: "center",
						padding: isWeb ? 40 : 24,
						minHeight: isWeb ? "100%" : undefined
					}}
				>
					<AuthForm isRegister={isRegister} onSubmit={handleAuth as any} switchForm={() => setIsRegister(!isRegister)} />
				</LinearGradient>
			);
		} else {
			return (
				<LinearGradient
					colors={["#00FFDD", "#1B9CFF"]}
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						padding: isWeb ? 12 : 16,
						minHeight: "100%"
					}}
				>
					<Card
						style={{
							backgroundColor: "rgba(255, 255, 255, 0.95)",
							borderRadius: 24,
							padding: 24,
							width: "90%",
							maxWidth: 400,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.2,
							shadowRadius: 8,
							elevation: 5
						}}
					>
						<VStack space="xl" style={{ alignItems: "center" }}>
							<HStack
								space="xl"
								style={{
									alignItems: "center",
									marginTop: 0,
									display: "flex",
									flexDirection: "column"
								}}
							>
								<Text
									style={{
										marginTop: 5,
										fontSize: isWeb ? 20 : 18,
										fontWeight: "800",
										color: "#333"
									}}
								>
									{t("auth.welcomeToFilmManager")}
								</Text>
							</HStack>

							<Text
								style={{
									fontSize: isWeb ? 13 : 12,
									textAlign: "center",
									color: "#666",
									marginTop: 2,
									marginBottom: 6
								}}
							>
								{t("auth.pleaseLogin")}
							</Text>

							<Button
								onPress={() => {
									router.push("/auth/account");
								}}
								style={{
									backgroundColor: "#1B9CFF",
									borderRadius: 12,
									width: "100%",
									elevation: 3
								}}
							>
								<HStack
									space="sm"
									style={{
										alignItems: "center",
										justifyContent: "center"
									}}
								>
									<Icon as={LogInIcon} size="md" color="white" />
									<Text
										style={{
											fontSize: 18,
											fontWeight: "600",
											color: "white"
										}}
									>
										{t("auth.loginOrRegister")}
									</Text>
								</HStack>
							</Button>
						</VStack>
					</Card>
				</LinearGradient>
			);
		}
	}

	return typeof children === "function" ? children(userData) : children;
}