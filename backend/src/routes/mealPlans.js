import { Router } from 'express';
import { adminDb } from '../firebaseAdmin.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

const VALID_DAY_OF_WEEK = new Set([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]);

const VALID_MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack']);

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
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
    throw createHttpError(
      400,
      'At least one of dayOfWeek or mealType must be provided'
    );
  }

  const patch = {};

  if (Object.hasOwn(body, 'dayOfWeek')) {
    if (
      typeof body.dayOfWeek !== 'string' ||
      !VALID_DAY_OF_WEEK.has(body.dayOfWeek)
    ) {
      throw createHttpError(
        400,
        'dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
      );
    }

    patch.dayOfWeek = body.dayOfWeek;
  }

  if (Object.hasOwn(body, 'mealType')) {
    if (
      typeof body.mealType !== 'string' ||
      !VALID_MEAL_TYPES.has(body.mealType)
    ) {
      throw createHttpError(
        400,
        'mealType must be one of: breakfast, lunch, dinner, snack'
      );
    }

    patch.mealType = body.mealType;
  }

  return patch;
}

router.patch('/:week/entries/:entryId', verifyToken, async (req, res, next) => {
  const { week, entryId } = req.params;

  try {
    const patch = buildMealEntryPatch(req.body);
    const entryRef = adminDb
      .collection('mealPlans')
      .doc(week)
      .collection('entries')
      .doc(entryId);

    const existingEntry = await entryRef.get();

    if (!existingEntry.exists) {
      throw createHttpError(404, 'Meal plan entry not found');
    }

    await entryRef.update(patch);

    const updatedEntry = await entryRef.get();

    res.status(200).json({
      id: updatedEntry.id,
      ...updatedEntry.data(),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:week/assign', verifyToken, async (req, res, next) => {
  const { week } = req.params;
  const { recipeId, dayOfWeek, mealType } = req.body;

  try {
    if (!recipeId || typeof recipeId !== 'string') {
      throw createHttpError(400, 'recipeId is required and must be a string');
    }

    if (
      typeof dayOfWeek !== 'string' ||
      !VALID_DAY_OF_WEEK.has(dayOfWeek)
    ) {
      throw createHttpError(
        400,
        'dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
      );
    }

    if (
      typeof mealType !== 'string' ||
      !VALID_MEAL_TYPES.has(mealType)
    ) {
      throw createHttpError(
        400,
        'mealType must be one of: breakfast, lunch, dinner, snack'
      );
    }

    const recipeRef = adminDb.collection('recipes').doc(recipeId);
    const recipeSnap = await recipeRef.get();

    if (!recipeSnap.exists) {
      throw createHttpError(404, 'Recipe not found');
    }

    const entryRef = adminDb
      .collection('mealPlans')
      .doc(week)
      .collection('entries')
      .doc(); 

    const newEntry = {
      recipeId,
      dayOfWeek,
      mealType,
      createdAt: new Date().toISOString(),
      userId: req.user?.uid || null, 
    };

    await entryRef.set(newEntry);
    res.status(201).json({
      id: entryRef.id,
      ...newEntry,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
