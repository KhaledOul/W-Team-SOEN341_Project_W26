import { getAdminAuth } from "../firebaseAdmin.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded; // uid, email, etc. now available in route handlers
    next();
  } catch (err) {
    if (
      err.message?.includes("Firebase Admin credentials") ||
      err.message?.includes("FIREBASE_PRIVATE_KEY")
    ) {
      console.error("Firebase Admin setup error:", err.message);
      return res.status(503).json({ error: "Firebase Admin is not configured" });
    }

    console.error("Token verification failed:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
