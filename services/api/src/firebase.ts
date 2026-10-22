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

  admin.initializeApp({
    projectId: projId
  });
}

export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth = admin.auth();
export { admin };
