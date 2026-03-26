import cors from "cors";
import "dotenv/config";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import mealPlanRoutes from "./routes/mealPlans.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// ─── Root endpoint ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/meal-plans", mealPlanRoutes);

// ─── Routes ──────────────────────────────────────────────────────────────────
// Import and mount route files here as they are created.
// Only add routes for logic that genuinely requires server-side secrets
// or Firebase Admin SDK — Firestore CRUD stays in the frontend.
//
// Example:
// import recipeAIRoutes from './routes/recipeAI.js';
// app.use('/api/recipes/generate', recipeAIRoutes);

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.warn(`Backend running on http://localhost:${PORT}`);
});
