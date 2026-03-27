import { Router } from "express";
import { getAdminDb } from "../firebaseAdmin.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

const ISO_WEEK_REGEX = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

const VALID_DAY_OF_WEEK = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

const VALID_MEAL_TYPES = new Set(["breakfast", "lunch", "dinner", "snack"]);

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function buildMealEntryPatch(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw createHttpError(400, "Request body must be a JSON object");
  }

  const allowedFields = ["dayOfWeek", "mealType"];
  const bodyKeys = Object.keys(body);
  const unknownFields = bodyKeys.filter(
    (field) => !allowedFields.includes(field)
  );

  if (unknownFields.length > 0) {
    throw createHttpError(400, `Unknown field(s): ${unknownFields.join(", ")}`);
  }

  if (bodyKeys.length === 0) {
    throw createHttpError(
      400,
      "At least one of dayOfWeek or mealType must be provided"
    );
  }

  const patch = {};

  if (Object.hasOwn(body, "dayOfWeek")) {
    if (
      typeof body.dayOfWeek !== "string" ||
      !VALID_DAY_OF_WEEK.has(body.dayOfWeek)
    ) {
      throw createHttpError(
        400,
        "dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, " +
          "Friday, Saturday, Sunday"
      );
    }
    patch.dayOfWeek = body.dayOfWeek;
  }

  if (Object.hasOwn(body, "mealType")) {
    if (
      typeof body.mealType !== "string" ||
      !VALID_MEAL_TYPES.has(body.mealType)
    ) {
      throw createHttpError(
        400,
        "mealType must be one of: breakfast, lunch, dinner, snack"
      );
    }
    patch.mealType = body.mealType;
  }

  return patch;
}

// ── GET /:week ───────────────────────────────────────────────────────────────
router.get("/:week", verifyToken, async (req, res, next) => {
  const { week } = req.params;

  try {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection("mealPlans").doc(week);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      throw createHttpError(404, "Meal plan not found");
    }

    const entriesSnapshot = await docRef.collection("entries").get();
    const entries = entriesSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    res.status(200).json({ id: snapshot.id, ...snapshot.data(), entries });
  } catch (error) {
    next(error);
  }
});

// ── POST /:week/assign ──────────────────────────────────────────────────────
router.post("/:week/assign", verifyToken, async (req, res, next) => {
  const { week } = req.params;
  const { dayOfWeek, mealType, recipeId } = req.body;

  try {
    const adminDb = getAdminDb();

    if (!dayOfWeek || !VALID_DAY_OF_WEEK.has(dayOfWeek)) {
      throw createHttpError(
        400,
        "dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, " +
          "Friday, Saturday, Sunday"
      );
    }

    if (!mealType || !VALID_MEAL_TYPES.has(mealType)) {
      throw createHttpError(
        400,
        "mealType must be one of: breakfast, lunch, dinner, snack"
      );
    }

    if (!recipeId || typeof recipeId !== "string") {
      throw createHttpError(400, "recipeId must be a non-empty string");
    }

    // Check if meal plan exists
    const mealPlanRef = adminDb.collection("mealPlans").doc(week);
    const mealPlanSnapshot = await mealPlanRef.get();

    if (!mealPlanSnapshot.exists) {
      throw createHttpError(404, "Meal plan not found");
    }

    // Check if recipe exists
    const recipeRef = adminDb.collection("recipes").doc(recipeId);
    const recipeSnapshot = await recipeRef.get();

    if (!recipeSnapshot.exists) {
      throw createHttpError(404, "Recipe not found");
    }

    // Check if entry already exists for this slot
    const entriesRef = mealPlanRef.collection("entries");
    const existingQuery = await entriesRef
      .where("dayOfWeek", "==", dayOfWeek)
      .where("mealType", "==", mealType)
      .get();

    if (!existingQuery.empty) {
      throw createHttpError(409, "Meal slot already occupied");
    }

    // Check if this recipe is already in the meal plan (prevent duplicates for the week)
    const duplicateQuery = await entriesRef
      .where("recipeId", "==", recipeId)
      .get();

    if (!duplicateQuery.empty) {
      throw createHttpError(
        409,
        "This recipe is already in this week's meal plan. Choose a different recipe."
      );
    }

    // Create new entry
    const newEntry = {
      dayOfWeek,
      mealType,
      recipeId,
      recipe: recipeSnapshot.data(),
      createdAt: new Date().toISOString(),
    };

    const entryRef = await entriesRef.add(newEntry);
    const createdEntry = await entryRef.get();

    res.status(201).json({ id: createdEntry.id, ...createdEntry.data() });
  } catch (error) {
    next(error);
  }
});

// ── POST / ───────────────────────────────────────────────────────────────────
router.post("/", verifyToken, async (req, res, next) => {
  const { isoWeek } = req.body;
  const userId = req.user.uid;

  try {
    const adminDb = getAdminDb();

    if (!isoWeek || !ISO_WEEK_REGEX.test(isoWeek)) {
      throw createHttpError(400, 'isoWeek must match format "YYYY-Www"');
    }

    const docId = `${userId}_${isoWeek}`;
    const docRef = adminDb.collection("mealPlans").doc(docId);
    const existing = await docRef.get();

    if (!existing.exists) {
      await docRef.set({
        userId,
        isoWeek,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const snapshot = await docRef.get();
    const entriesSnapshot = await docRef.collection("entries").get();
    const entries = entriesSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    res.status(200).json({ id: snapshot.id, ...snapshot.data(), entries });
  } catch (error) {
    next(error);
  }
});

// ── PATCH /:week/entries/:entryId ────────────────────────────────────────────
router.patch("/:week/entries/:entryId", verifyToken, async (req, res, next) => {
  const { week, entryId } = req.params;

  try {
    const adminDb = getAdminDb();
    const patch = buildMealEntryPatch(req.body);
    const entryRef = adminDb
      .collection("mealPlans")
      .doc(week)
      .collection("entries")
      .doc(entryId);

    const existingEntry = await entryRef.get();

    if (!existingEntry.exists) {
      throw createHttpError(404, "Meal plan entry not found");
    }

    await entryRef.update(patch);
    const updatedEntry = await entryRef.get();

    res.status(200).json({ id: updatedEntry.id, ...updatedEntry.data() });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /:week/entries/:entryId ────────────────────────────────────────────
router.delete(
  "/:week/entries/:entryId",
  verifyToken,
  async (req, res, next) => {
    const { week, entryId } = req.params;

    try {
      const adminDb = getAdminDb();
      const entryRef = adminDb
        .collection("mealPlans")
        .doc(week)
        .collection("entries")
        .doc(entryId);

      const existing = await entryRef.get();
      if (!existing.exists) {
        throw createHttpError(404, "Meal plan entry not found");
      }

      await entryRef.delete();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
