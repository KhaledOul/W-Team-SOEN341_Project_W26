import "dotenv/config";
import admin from "firebase-admin";

function readEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

function getCredentialFields() {
  return {
    projectId: readEnv("FIREBASE_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID"),
    clientEmail: readEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: readEnv("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n"),
  };
}

function hasAnyCredentialField({ projectId, clientEmail, privateKey }) {
  return Boolean(projectId || clientEmail || privateKey);
}

function assertValidCredentials({ projectId, clientEmail, privateKey }) {
  if (!hasAnyCredentialField({ projectId, clientEmail, privateKey })) {
    throw new Error(
      "Firebase Admin credentials are not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are incomplete. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must all be set."
    );
  }

  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is invalid. Use the private_key value from a Firebase service account JSON."
    );
  }
}

function getAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const credentials = getCredentialFields();
  assertValidCredentials(credentials);

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: credentials.projectId,
      clientEmail: credentials.clientEmail,
      privateKey: credentials.privateKey,
    }),
  });
}

export function getAdminAuth() {
  return getAdminApp().auth();
}

export function getAdminDb() {
  return getAdminApp().firestore();
}

export default admin;
