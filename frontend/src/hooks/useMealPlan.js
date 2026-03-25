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

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (cancelled) return;

      if (!user) {
        setError('User is not authenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setMealPlan(null);

      // First try to get existing meal plan
      const { data: existingData } = await getMealPlan(user.uid, isoWeek);

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
        setError(createError);
      } else {
        setMealPlan(newData);
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

    const previousMealPlan = mealPlan;

    setError(null);
    setMealPlan((currentMealPlan) => applyEntryRemoval(currentMealPlan, entryId));

    const { error: serviceError } = await deleteMealEntryRequest(mealPlan.id, entryId);

    if (serviceError) {
      setMealPlan(previousMealPlan);
      setError(serviceError);
      return { data: null, error: serviceError };
    }

    return { data: null, error: null };
  }

  async function assignEntry(dayOfWeek, mealType, recipeId) {
    if (!mealPlan?.id) {
      const nextError = 'Meal plan is not loaded';
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

    const previousMealPlan = mealPlan;

    setError(null);
    // Optimistically add the entry (we'll need recipe data from somewhere)
    // For now, create a placeholder - you'll need to fetch recipe data
    const optimisticEntry = {
      id: `temp-${Date.now()}`,
      dayOfWeek,
      mealType,
      recipeId,
      recipe: { title: 'Loading...', thumbnail: null }, // Placeholder
    };

    setMealPlan((currentMealPlan) => ({
      ...currentMealPlan,
      entries: [...(currentMealPlan.entries || []), optimisticEntry],
    }));

    const { data, error: serviceError } = await assignMealEntryRequest(
      mealPlan.id,
      dayOfWeek,
      mealType,
      recipeId
    );

    if (serviceError) {
      setMealPlan(previousMealPlan);
      setError(serviceError);
      return { data: null, error: serviceError };
    }

    // Replace optimistic entry with real data
    setMealPlan((currentMealPlan) => ({
      ...currentMealPlan,
      entries: currentMealPlan.entries.map((entry) =>
        entry.id === optimisticEntry.id ? data : entry
      ),
    }));

    return { data, error: null };
  }

  return { mealPlan, loading, error, updateEntry, removeEntry, assignEntry };
}
