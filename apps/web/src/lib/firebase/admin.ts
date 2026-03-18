import * as admin from 'firebase-admin';
import { getServerEnvStatus } from '@/lib/server/env';

// Initialize the admin app only if it hasn't been initialized yet
if (!admin.apps.length) {
    try {
        const envStatus = getServerEnvStatus();
        if (!envStatus.ok) {
            throw new Error(`Missing required env vars: ${envStatus.missing.join(', ')}`);
        }

        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY!;

        const serviceAccount = JSON.parse(serviceAccountJson);
        
        // Handle potentially escaped newlines in the private key string
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // storageBucket is configured in regular config, but we can reuse it
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
    }
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminAuth = admin.auth();
