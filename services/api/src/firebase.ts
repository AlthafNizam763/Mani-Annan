import * as admin from 'firebase-admin';
import { config } from './config';
if (!admin.apps.length) {
  // In test environment, automatically default to local emulator ports if not already set
  if (process.env.NODE_ENV === 'test') {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
  }

  const projId = process.env.GCLOUD_PROJECT || config.firebase.projectId || 'mani-annan';
  process.env.GCLOUD_PROJECT = projId;

  const isEmulator = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST
  );

  let credential: admin.credential.Credential | undefined;

  if (isEmulator) {
    // Emulators do not require cloud credentials
    console.log(`[Firebase] Initialized with local emulators (Firestore: ${process.env.FIRESTORE_EMULATOR_HOST || 'none'}, Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST || 'none'})`);
  } else if (config.firebase.serviceAccountKey) {
    try {
      const parsed = JSON.parse(config.firebase.serviceAccountKey);
      credential = admin.credential.cert(parsed);
      console.log(`[Firebase] Initialized with FIREBASE_SERVICE_ACCOUNT_KEY for project: ${projId}`);
    } catch (err: any) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', err.message);
    }
  } else if (config.firebase.clientEmail && config.firebase.privateKey) {
    try {
      const formattedKey = config.firebase.privateKey.replace(/\\n/g, '\n');
      credential = admin.credential.cert({
        projectId: projId,
        clientEmail: config.firebase.clientEmail,
        privateKey: formattedKey
      });
      console.log(`[Firebase] Initialized with FIREBASE_CLIENT_EMAIL (${config.firebase.clientEmail}) for project: ${projId}`);
    } catch (err: any) {
      console.error('[Firebase] Failed to configure credentials from FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY:', err.message);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log(`[Firebase] Using GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
  } else {
    console.warn(`[Firebase] WARNING: No Firebase Admin credentials found (FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY). Firestore and Auth operations will fail on cloud platforms without Google Application Default Credentials.`);
  }

  admin.initializeApp({
    projectId: projId,
    ...(credential ? { credential } : {})
  });
}

export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth = admin.auth();
export { admin };
