"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.auth = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
exports.admin = admin;
const config_1 = require("./config");
if (!admin.apps.length) {
    // In test environment, automatically default to local emulator ports if not already set
    if (process.env.NODE_ENV === 'test') {
        process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
        process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    }
    const projId = process.env.GCLOUD_PROJECT || config_1.config.firebase.projectId || 'mani-annan';
    process.env.GCLOUD_PROJECT = projId;
    const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
    let credential;
    if (isEmulator) {
        // Emulators do not require cloud credentials
        console.log(`[Firebase] Initialized with local emulators (Firestore: ${process.env.FIRESTORE_EMULATOR_HOST || 'none'}, Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST || 'none'})`);
    }
    else if (config_1.config.firebase.serviceAccountKey) {
        try {
            const parsed = JSON.parse(config_1.config.firebase.serviceAccountKey);
            credential = admin.credential.cert(parsed);
            console.log(`[Firebase] Initialized with FIREBASE_SERVICE_ACCOUNT_KEY for project: ${projId}`);
        }
        catch (err) {
            console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', err.message);
        }
    }
    else if (config_1.config.firebase.clientEmail && config_1.config.firebase.privateKey) {
        try {
            const formattedKey = config_1.config.firebase.privateKey.replace(/\\n/g, '\n');
            credential = admin.credential.cert({
                projectId: projId,
                clientEmail: config_1.config.firebase.clientEmail,
                privateKey: formattedKey
            });
            console.log(`[Firebase] Initialized with FIREBASE_CLIENT_EMAIL (${config_1.config.firebase.clientEmail}) for project: ${projId}`);
        }
        catch (err) {
            console.error('[Firebase] Failed to configure credentials from FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY:', err.message);
        }
    }
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log(`[Firebase] Using GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    }
    else {
        console.warn(`[Firebase] WARNING: No Firebase Admin credentials found (FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY). Firestore and Auth operations will fail on cloud platforms without Google Application Default Credentials.`);
    }
    admin.initializeApp({
        projectId: projId,
        ...(credential ? { credential } : {})
    });
}
exports.db = admin.firestore();
exports.db.settings({ ignoreUndefinedProperties: true });
exports.auth = admin.auth();
