import "dotenv/config";
import admin from "firebase-admin";

function readEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

function buildCredentialOptions() {
  const projectId = readEnv("FIREBASE_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID");
  const clientEmail = readEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = readEnv("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return undefined;
  }

  return {
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  };
}

if (!admin.apps.length) {
  const credentialOptions = buildCredentialOptions();
  admin.initializeApp(credentialOptions);
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
