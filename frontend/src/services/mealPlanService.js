import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/** Regex that validates ISO week strings like "2025-W20". */
const ISO_WEEK_REGEX = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

/**
 * Build the Firestore document ID for a meal plan.
 * @param {string} userId
 * @param {string} isoWeek
 * @returns {string} e.g. "uid123_2025-W20"
 */
function mealPlanDocId(userId, isoWeek) {
  return `${userId}_${isoWeek}`;
}

/**
 * Validate common inputs shared by all public functions.
 * @param {string} userId
 * @param {string} isoWeek
 * @throws {Error} on invalid input
 */
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

/**
 * Create a weekly meal plan in Firestore. If a plan for the given user and
 * week already exists the existing document is returned (no duplicates).
 *
 * @param {string} userId  — Firebase Auth UID
 * @param {string} isoWeek — ISO week string, e.g. "2025-W20"
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export async function createMealPlan(userId, isoWeek) {
  try {
    validateInputs(userId, isoWeek);

    const docId = mealPlanDocId(userId, isoWeek);
    const docRef = doc(db, 'mealPlans', docId);

    // Return existing plan if it already exists
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      return { data: { id: existing.id, ...existing.data() }, error: null };
    }

    // Create the new meal plan document
    const newPlan = {
      userId,
      isoWeek,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      entries: [],
    };

    await setDoc(docRef, newPlan);

    // Re-read to get server-resolved timestamps
    const created = await getDoc(docRef);
    return { data: { id: created.id, ...created.data() }, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[mealPlanService] createMealPlan failed:', err);
    }
    return { data: null, error: err.message };
  }
}

/**
 * Fetch an existing meal plan from Firestore by user and ISO week.
 *
 * @param {string} userId  — Firebase Auth UID
 * @param {string} isoWeek — ISO week string, e.g. "2025-W20"
 * @returns {Promise<{ data: object|null, error: string|null }>}
 *   data is null when the document does not exist.
 */
export async function getMealPlan(userId, isoWeek) {
  try {
    validateInputs(userId, isoWeek);

    const docId = mealPlanDocId(userId, isoWeek);
    const docRef = doc(db, 'mealPlans', docId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return { data: null, error: null };
    }

    return { data: { id: snapshot.id, ...snapshot.data() }, error: null };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[mealPlanService] getMealPlan failed:', err);
    }
    return { data: null, error: err.message };
  }
}
