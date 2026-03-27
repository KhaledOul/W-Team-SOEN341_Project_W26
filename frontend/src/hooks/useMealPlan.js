import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import {
  assignMealEntry as assignMealEntryRequest,
  createMealPlan,
  deleteMealEntry as deleteMealEntryRequest,
  getMealPlan,
  updateMealEntry as updateMealEntryRequest,
} from '../services/mealPlanService';

function applyEntryUpdate(currentMealPlan, entryId, patch) {
  if (!currentMealPlan || !Array.isArray(currentMealPlan.entries)) {
    return currentMealPlan;
  }

  return {
    ...currentMealPlan,
    entries: currentMealPlan.entries.map((entry) =>
      entry.id === entryId ? { ...entry, ...patch } : entry
    ),
  };
}

function applyUpdatedEntry(currentMealPlan, updatedEntry) {
  if (!currentMealPlan || !Array.isArray(currentMealPlan.entries)) {
    return currentMealPlan;
  }

  const existingIndex = currentMealPlan.entries.findIndex((entry) => entry.id === updatedEntry.id);

  if (existingIndex === -1) {
    return {
      ...currentMealPlan,
      entries: [...currentMealPlan.entries, updatedEntry],
    };
  }

  return {
    ...currentMealPlan,
    entries: currentMealPlan.entries.map((entry) =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    ),
  };
}

function applyEntryRemoval(currentMealPlan, entryId) {
  if (!currentMealPlan || !Array.isArray(currentMealPlan.entries)) {
    return currentMealPlan;
  }

  return {
    ...currentMealPlan,
    entries: currentMealPlan.entries.filter((entry) => entry.id !== entryId),
  };
}

export function useMealPlan(isoWeek) {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (cancelled) return;

      if (!user) {
        setError('User is not authenticated');
        setLoading(false);
        return;
      }

      setUserId(user.uid);
      setLoading(true);
      setError(null);
      setMealPlan(null);

      // First try to get existing meal plan
      const { data: existingData, error: getError } = await getMealPlan(user.uid, isoWeek);

      if (cancelled) return;

      if (existingData) {
        setMealPlan(existingData);
        setLoading(false);
        return;
      }

      // If not found, create new meal plan
      const { data: newData, error: createError } = await createMealPlan(user.uid, isoWeek);

      if (cancelled) return;

      if (createError) {
        console.error('[useMealPlan] Failed to create meal plan:', createError);
        setError(createError);
      } else if (newData) {
        console.log('[useMealPlan] Meal plan created successfully:', newData);
        setMealPlan(newData);
      } else {
        console.error('[useMealPlan] Meal plan creation returned no data');
        setError('Failed to create meal plan');
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isoWeek]);

  async function updateEntry(entryId, patch) {
    if (!mealPlan?.id) {
      const nextError = 'Meal plan is not loaded';
      setError(nextError);
      return { data: null, error: nextError };
    }

    const previousMealPlan = mealPlan;

    setError(null);
    setMealPlan((currentMealPlan) => applyEntryUpdate(currentMealPlan, entryId, patch));

    const { data, error: serviceError } = await updateMealEntryRequest(mealPlan.id, entryId, patch);

    if (serviceError) {
      setMealPlan(previousMealPlan);
      setError(serviceError);
      return { data: null, error: serviceError };
    }

    setMealPlan((currentMealPlan) => applyUpdatedEntry(currentMealPlan, data));

    return { data, error: null };
  }

  async function removeEntry(entryId) {
    if (!mealPlan?.id) {
      const nextError = 'Meal plan is not loaded';
      setError(nextError);
      return { data: null, error: nextError };
    }

    console.log('[useMealPlan] Attempting to delete entry:', { mealPlanId: mealPlan.id, entryId });

    const previousMealPlan = mealPlan;

    setError(null);
    setMealPlan((currentMealPlan) => applyEntryRemoval(currentMealPlan, entryId));

    const { error: serviceError } = await deleteMealEntryRequest(mealPlan.id, entryId);

    if (serviceError) {
      console.error('[useMealPlan] Failed to delete entry:', serviceError);
      setMealPlan(previousMealPlan);
      setError(serviceError);
      return { data: null, error: serviceError };
    }

    console.log('[useMealPlan] Entry deleted successfully');
    return { data: null, error: null };
  }

  async function assignEntry(dayOfWeek, mealType, recipeId) {
    if (!mealPlan?.id) {
      const nextError = 'Meal plan is not loaded';
      console.error('[useMealPlan] assignEntry failed:', nextError);
      setError(nextError);
      return { data: null, error: nextError };
    }

    // Check if slot is already occupied
    const existingEntry = mealPlan.entries?.find(
      (entry) => entry.dayOfWeek === dayOfWeek && entry.mealType === mealType
    );

    if (existingEntry) {
      const nextError = 'Meal slot already occupied';
      setError(nextError);
      return { data: null, error: nextError };
    }

    // NEW: Check if this recipe is already in the meal plan (prevent duplicates in the week)
    const isDuplicateRecipe = mealPlan.entries?.some(
      (entry) => entry.recipeId === recipeId
    );

    if (isDuplicateRecipe) {
      const nextError = 'This recipe is already in this week\'s meal plan. Choose a different recipe.';
      setError(nextError);
      return { data: null, error: nextError };
    }

    const previousMealPlan = mealPlan;

    setError(null);
    // Optimistically add the entry
    const optimisticEntry = {
      id: `temp-${Date.now()}`,
      dayOfWeek,
      mealType,
      recipeId,
      recipe: { title: 'Loading...', thumbnail: null },
    };

    console.log('[useMealPlan] Assigning meal with optimistic entry:', optimisticEntry);

    setMealPlan((currentMealPlan) => ({
      ...currentMealPlan,
      entries: [...(currentMealPlan.entries || []), optimisticEntry],
    }));

    // Make API call to assign the meal
    const { data, error: serviceError } = await assignMealEntryRequest(
      mealPlan.id,
      dayOfWeek,
      mealType,
      recipeId
    );

    if (serviceError) {
      console.error('[useMealPlan] assignMealEntryRequest failed:', serviceError);
      // Revert on error
      setMealPlan(previousMealPlan);
      setError(serviceError);
      return { data: null, error: serviceError };
    }

    console.log('[useMealPlan] Entry created on server:', data);

    // API call succeeded, now refetch the entire meal plan to ensure sync
    if (userId) {
      console.log('[useMealPlan] Refetching meal plan after assignment...');
      const { data: freshData, error: fetchError } = await getMealPlan(userId, isoWeek);
      if (fetchError) {
        console.error('[useMealPlan] Failed to refetch meal plan:', fetchError);
        // If refetch fails, at least use the returned data from assignment
        if (data && data.id) {
          console.log('[useMealPlan] Using assignment response data directly');
          setMealPlan((currentMealPlan) => ({
            ...currentMealPlan,
            entries: currentMealPlan.entries.map((entry) =>
              entry.id === optimisticEntry.id ? { ...data } : entry
            ),
          }));
        }
      } else if (freshData) {
        // Successfully fetched fresh data from server
        console.log('[useMealPlan] Meal plan refreshed from server:', freshData);
        setMealPlan(freshData);
      }
    }

    return { data, error: null };
  }

  return { mealPlan, loading, error, updateEntry, removeEntry, assignEntry };
}
