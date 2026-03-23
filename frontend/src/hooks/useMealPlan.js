import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { createMealPlan } from '../services/mealPlanService';

/**
 * Custom React hook that ensures a meal plan exists for the given ISO week
 * and provides it to the consuming component.
 *
 * On mount (or when `isoWeek` changes) the hook calls `createMealPlan`,
 * which is idempotent — it returns the existing document if one already exists.
 *
 * @param {string} isoWeek — ISO week string, e.g. "2025-W20"
 * @returns {{ mealPlan: object|null, loading: boolean, error: string|null }}
 */
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

      if (cancelled) return;

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

  return { mealPlan, loading, error };
}
