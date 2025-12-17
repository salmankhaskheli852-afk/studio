import { initializeApp, getApps, App } from 'firebase-admin/app';
import { ServiceAccount, cert } from 'firebase-admin/app';

function getServiceAccount(): ServiceAccount {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
  }
  return JSON.parse(serviceAccount);
}

export function initFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert(getServiceAccount()),
  });
}
