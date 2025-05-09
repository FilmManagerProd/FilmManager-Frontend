import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
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

export const db = getDatabase(app);