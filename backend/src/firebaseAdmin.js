import "dotenv/config";
import admin from "firebase-admin";

function buildCredentialOptions() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

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
