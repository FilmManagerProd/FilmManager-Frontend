import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_DB_URL,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_SENDER_ID,
    FIREBASE_APP_ID,
} = Constants.expoConfig?.extra || {};

const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    databaseURL: FIREBASE_DB_URL,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_SENDER_ID,
    appId: FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let persistence;

if (Platform.OS === 'web') {
    // Web persistence
    const { browserSessionPersistence } = require("firebase/auth");
    persistence = browserSessionPersistence;
} else {
    // React Native persistence
    const { getReactNativePersistence } = require("firebase/auth/react-native");
    persistence = getReactNativePersistence(AsyncStorage);
}

export const auth = initializeAuth(app, {
    persistence
});

export const db = getDatabase(app);