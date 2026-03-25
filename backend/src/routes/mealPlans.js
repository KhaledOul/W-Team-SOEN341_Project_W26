import { Router } from 'express';
import { adminDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

const ISO_WEEK_REGEX = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

const VALID_DAY_OF_WEEK = new Set([
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]);

const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack']);

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function buildMealAssignment(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }

  const { recipeId, dayOfWeek, mealType } = body;

  if (typeof recipeId !== 'string' || recipeId.trim() === '') {
    throw createHttpError(400, 'recipeId is required and must be a non-empty string');
  }

  if (typeof dayOfWeek !== 'string' || !VALID_DAY_OF_WEEK.has(dayOfWeek)) {
    throw createHttpError(
      400,
      'dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
    );
  }

  if (typeof mealType !== 'string' || !VALID_MEAL_TYPES.has(mealType)) {
    throw createHttpError(
      400,
      'mealType must be one of: breakfast, lunch, dinner, snack'
    );
  }

  return {
    recipeId: recipeId.trim(),
    dayOfWeek,
    mealType,
  };
}

function buildMealEntryId({ recipeId, dayOfWeek, mealType }) {
  return `${dayOfWeek}__${mealType}__${recipeId}`;
}

function buildMealEntryPatch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }

  const allowedFields = ['dayOfWeek', 'mealType'];
  const bodyKeys = Object.keys(body);
  const unknownFields = bodyKeys.filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    throw createHttpError(400, `Unknown field(s): ${unknownFields.join(', ')}`);
  }

  if (bodyKeys.length === 0) {
    throw createHttpError(400, 'At least one of dayOfWeek or mealType must be provided');
  }

  const patch = {};

  if (Object.hasOwn(body, 'dayOfWeek')) {
    if (typeof body.dayOfWeek !== 'string' || !VALID_DAY_OF_WEEK.has(body.dayOfWeek)) {
      throw createHttpError(
        400,
        'dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
      );
    }
    patch.dayOfWeek = body.dayOfWeek;
  }

  if (Object.hasOwn(body, 'mealType')) {
    if (typeof body.mealType !== 'string' || !VALID_MEAL_TYPES.has(body.mealType)) {
      throw createHttpError(400, 'mealType must be one of: breakfast, lunch, dinner, snack');
    }
    patch.mealType = body.mealType;
  }

  return patch;
}

// GET /:week
router.get('/:week', verifyToken, async (req, res, next) => {
  const { week } = req.params;

  try {
    const docRef = adminDb.collection('mealPlans').doc(week);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      throw createHttpError(404, 'Meal plan not found');
    }

    const entriesSnapshot = await docRef.collection('entries').get();
    const entries = entriesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.status(200).json({ id: snapshot.id, ...snapshot.data(), entries });
  } catch (error) {
    next(error);
  }
});

router.post('/:week/assign', verifyToken, async (req, res, next) => {
  const { week } = req.params;

  try {
    const assignment = buildMealAssignment(req.body);
    const { recipeId, dayOfWeek, mealType } = assignment;

    const entryId = buildMealEntryId({ recipeId, dayOfWeek, mealType });

    const entryRef = adminDb
      .collection('mealPlans')
      .doc(week)
      .collection('entries')
      .doc(entryId);

    await adminDb.runTransaction(async (transaction) => {
      const existingEntry = await transaction.get(entryRef);

      if (existingEntry.exists) {
        throw createHttpError(
          409,
          `Duplicate assignment detected: recipe ${recipeId} is already assigned to ${dayOfWeek} ${mealType} in week ${week}`
        );
      }

      const timestamp = new Date().toISOString();

      transaction.set(entryRef, {
        recipeId,
        dayOfWeek,
        mealType,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId: req.user?.uid || null,
      });
    });

    const savedEntry = await entryRef.get();

    res.status(201).json({
      id: savedEntry.id,
      ...savedEntry.data(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;