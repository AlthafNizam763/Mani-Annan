import dotenv from 'dotenv';
import path from 'path';

// Load root workspace .env as well as local .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'mani-annan',
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
    authEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  llm: {
    provider: process.env.NODE_ENV === 'test' ? 'mock' : (process.env.LLM_PROVIDER || 'mock'), // 'gemini' | 'mock'
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  }
};
