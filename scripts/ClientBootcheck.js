const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");

const envPath = path.resolve(__dirname, "../.env");

if (!fs.existsSync(envPath)) {
    console.log(`\n[BOOTCHECK] - FAILED: File not found; ${envPath}\n`);
    process.exit(1);
}

const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
    console.log(`\n[BOOTCHECK] - FAILED: Couldn't load ${envPath}: ${envResult.error}\n`);
    process.exit(1);
}

const envVars = envResult.parsed || {};

const configPath = path.resolve(__dirname, "../app.config.js");

let appConfigFunction;

try {
    appConfigFunction = require(configPath);
} catch (error) {
    console.log(`\n[BOOTCHECK] - FAILED: Couldn't load app.config.js: ${error}\n`);
    process.exit(1);
}

const appConfig = typeof appConfigFunction === "function" ? appConfigFunction({ config: {} }) : appConfigFunction;

if (!appConfig.extra) {
    console.log(`\n[BOOTCHECK] - FAILED: 'extra' property not found in app.config.js\n`);
    process.exit(1);
}

const extraVars = appConfig.extra;

const missingKeys = [];

for (const key of Object.keys(envVars)) {
    if (!(key in extraVars)) {
        missingKeys.push(key);
    }
}

if (missingKeys.length > 0) {
    console.log(`\n[BOOTCHECK] - FAILED: Missing environment variables in app.config.js: ${missingKeys.join(", ")}\n`);
    process.exit(1);
} else {
    console.log(`\n[BOOTCHECK] - SUCCESS: All environment variables audited. SYSTEM READY.\n`);
    process.exit(0);
}