import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { api } from '../api/client';
import { auth, db } from './firebase';

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

async function getMealPlanEntries(week) {
  const entriesSnapshot = await getDocs(collection(db, 'mealPlans', week, 'entries'));

  return entriesSnapshot.docs.map((entrySnapshot) => ({
    id: entrySnapshot.id,
    ...entrySnapshot.data(),
  }));
}

async function hydrateMealPlan(snapshot) {
  const entries = await getMealPlanEntries(snapshot.id);

  return {
    id: snapshot.id,
    ...snapshot.data(),
    entries,
  };
}

export async function createMealPlan(userId, isoWeek) {
  try {
    validateInputs(userId, isoWeek);

    const docId = mealPlanDocId(userId, isoWeek);
    const docRef = doc(db, 'mealPlans', docId);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      return { data: await hydrateMealPlan(existing), error: null };
    }

    const newPlan = {
      userId,
      isoWeek,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, newPlan);

    const created = await getDoc(docRef);

    return { data: await hydrateMealPlan(created), error: null };
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

    const docId = mealPlanDocId(userId, isoWeek);
    const docRef = doc(db, 'mealPlans', docId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return { data: null, error: null };
    }

    return { data: await hydrateMealPlan(snapshot), error: null };
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
    const updatedEntry = await api.patch(
      `/meal-plans/${encodeURIComponent(week)}/entries/${encodeURIComponent(entryId)}`,
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
    await api.delete(
      `/meal-plans/${encodeURIComponent(week)}/entries/${encodeURIComponent(entryId)}`,
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
