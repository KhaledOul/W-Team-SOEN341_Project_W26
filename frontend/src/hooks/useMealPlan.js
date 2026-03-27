import { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import {
  createMealPlan,
  deleteMealEntry as deleteMealEntryRequest,
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

    async function loadOrCreate() {
      setLoading(true);
      setError(null);
      setMealPlan(null);

      const user = auth.currentUser;

      if (!user) {
        setError('User is not authenticated');
        setLoading(false);
        return;
      }

      const { data, error: serviceError } = await createMealPlan(user.uid, isoWeek);

      if (cancelled) {
        return;
      }

      if (serviceError) {
        setError(serviceError);
      } else {
        setMealPlan(data);
      }

      setLoading(false);
    }

    loadOrCreate();

    return () => {
      cancelled = true;
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

  async function deleteEntry(entryId) {
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

  return { mealPlan, loading, error, updateEntry, deleteEntry };
}
