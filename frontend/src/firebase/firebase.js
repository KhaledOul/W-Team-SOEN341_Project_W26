import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Analytics is optional (safe to remove). If you want it, keep it:
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDpZdNn4jm0k8sIggJQ8QcGc5n_e6qFRok",
  authDomain: "soen341-w-team.firebaseapp.com",
  projectId: "soen341-w-team",
  storageBucket: "soen341-w-team.firebasestorage.app",
  messagingSenderId: "709349279415",
  appId: "1:709349279415:web:407f0885d6569c061a6f32",
  measurementId: "G-S13EEG34ZR",
};

const app = initializeApp(firebaseConfig);

// ✅ Auth
export const auth = getAuth(app);

// ✅ Optional analytics (works only in browser + correct setup)
export const analytics = getAnalytics(app);

export default app;