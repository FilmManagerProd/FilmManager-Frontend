require("dotenv/config");

module.exports = ({ config }) => ({
    ...config,
    name: "Film Manager",
    slug: "client",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sadliquid.Film-Manager",
    },
    android: {
      package: "com.sadliquid.filmmanager",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-build-properties",
        {
          ios: {
            newArchEnabled: true,
          },
          android: {
            newArchEnabled: true,
            kotlinVersion: "1.9.25",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      BASE_URL: process.env.BASE_URL,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_DB_URL: process.env.FIREBASE_DB_URL,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_SENDER_ID: process.env.FIREBASE_SENDER_ID,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      API_KEY: process.env.API_KEY,
      eas: {
        projectId: "d6f7b2a9-6744-42a0-9bea-494dfbeb8ccf",
      },
    },
});