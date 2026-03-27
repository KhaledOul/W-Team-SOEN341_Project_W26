import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { adminDb } from '../firebaseAdmin.js';

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

router.delete('/:week/entries/:entryId', verifyToken, async (req, res, next) => {
  const { week, entryId } = req.params;

  try {
    const entryRef = adminDb
      .collection('mealPlans')
      .doc(week)
      .collection('entries')
      .doc(entryId);

    const existingEntry = await entryRef.get();

    if (!existingEntry.exists) {
      throw createHttpError(404, 'Meal plan entry not found');
    }

    await entryRef.delete();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
