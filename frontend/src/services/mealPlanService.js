import { api } from '../api/client';
import { auth } from './firebase';

const ISO_WEEK_REGEX = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

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

function mealPlanDocId(userId, isoWeek) {
  return `${userId}_${isoWeek}`;
}

function extractIsoWeekFromDocId(docId) {
  // docId format: ${userId}_${isoWeek}
  // isoWeek format: YYYY-Www
  // Extract by finding the pattern YYYY-W
  const match = docId.match(/(\d{4}-W\d{2})/);
  if (match) {
    return match[1];
  }
  // Fallback: assume last part after underscore
  const parts = docId.split('_');
  return parts[parts.length - 1];
}

function validateInputs(userId, isoWeek) {
  if (typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('userId must be a non-empty string');
  }

  if (typeof isoWeek !== 'string' || !ISO_WEEK_REGEX.test(isoWeek)) {
    throw new Error(
      `isoWeek must match the format "YYYY-Www" (e.g. "2025-W20"). Received: "${isoWeek}"`
    );
  }
}

function validateMealEntryIdentifiers(week, entryId) {
  if (typeof week !== 'string' || week.trim() === '') {
    throw new Error('week must be a non-empty string');
  }

  if (typeof entryId !== 'string' || entryId.trim() === '') {
    throw new Error('entryId must be a non-empty string');
  }
}

function validateMealEntryPatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new Error('Patch body must be a JSON object');
  }

  const allowedFields = ['dayOfWeek', 'mealType'];
  const patchKeys = Object.keys(patch);
  const unknownFields = patchKeys.filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    throw new Error(`Unknown field(s): ${unknownFields.join(', ')}`);
  }

  if (patchKeys.length === 0) {
    throw new Error('At least one of dayOfWeek or mealType must be provided');
  }

  if (
    Object.hasOwn(patch, 'dayOfWeek') &&
    (typeof patch.dayOfWeek !== 'string' || !VALID_DAY_OF_WEEK.has(patch.dayOfWeek))
  ) {
    throw new Error(
      'dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
    );
  }

  if (
    Object.hasOwn(patch, 'mealType') &&
    (typeof patch.mealType !== 'string' || !VALID_MEAL_TYPES.has(patch.mealType))
  ) {
    throw new Error('mealType must be one of: breakfast, lunch, dinner, snack');
  }
}

export async function createMealPlan(userId, isoWeek) {
  try {
    validateInputs(userId, isoWeek);

    const user = auth.currentUser;
    if (!user) throw new Error('User is not authenticated');

    const token = await user.getIdToken();

    // ✅ Backend au lieu de Firestore directement
    const data = await api.post('/meal-plans', { isoWeek }, token);
    return { data, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[mealPlanService] createMealPlan failed:', err);
    }
    return { data: null, error: err.message };
  }
}

export async function getMealPlan(userId, isoWeek) {
  try {
    validateInputs(userId, isoWeek);

    const user = auth.currentUser;
    if (!user) throw new Error('User is not authenticated');

    const token = await user.getIdToken();

    // Backend stores meal plan doc as userId_isoWeek
    const docId = mealPlanDocId(userId, isoWeek);
    const data = await api.get(`/meal-plans/${encodeURIComponent(docId)}`, token);
    return { data, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[mealPlanService] getMealPlan failed:', err);
    }
    return { data: null, error: err.message };
  }
}

export async function updateMealEntry(week, entryId, patch) {
  try {
    validateMealEntryIdentifiers(week, entryId);
    validateMealEntryPatch(patch);

    const user = auth.currentUser;

    if (!user) {
      throw new Error('User is not authenticated');
    }

    const token = await user.getIdToken();
    const docId = week;
    const updatedEntry = await api.patch(
      `/meal-plans/${encodeURIComponent(docId)}/entries/${encodeURIComponent(entryId)}`,
      patch,
      token
    );

    return { data: updatedEntry, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[mealPlanService] updateMealEntry failed:', err);
    }

    return { data: null, error: err.message };
  }
}

export async function deleteMealEntry(week, entryId) {
  try {
    validateMealEntryIdentifiers(week, entryId);

    const user = auth.currentUser;

    if (!user) {
      throw new Error('User is not authenticated');
    }

    const token = await user.getIdToken();
    const docId = week;
    await api.delete(
      `/meal-plans/${encodeURIComponent(docId)}/entries/${encodeURIComponent(entryId)}`,
      token
    );

    return { data: null, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[mealPlanService] deleteMealEntry failed:', err);
    }

    return { data: null, error: err.message };
  }
}

export async function assignMealEntry(week, dayOfWeek, mealType, recipeId) {
  try {
    validateMealEntryIdentifiers(week, 'dummy'); // week validation
    if (!VALID_DAY_OF_WEEK.has(dayOfWeek)) {
      throw new Error('Invalid dayOfWeek');
    }
    if (!VALID_MEAL_TYPES.has(mealType)) {
      throw new Error('Invalid mealType');
    }
    if (!recipeId || typeof recipeId !== 'string') {
      throw new Error('Invalid recipeId');
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const token = await user.getIdToken();
    const docId = week;
    const newEntry = await api.post(
      `/meal-plans/${encodeURIComponent(docId)}/assign`,
      { dayOfWeek, mealType, recipeId },
      token
    );

    return { data: newEntry, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[mealPlanService] assignMealEntry failed:', err);
    }
    return { data: null, error: err.message };
  }
}
