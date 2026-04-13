import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMealPlan } from '../../../../hooks/useMealPlan';
import { auth } from '../../../../services/firebase';
import { addWeeks, getCurrentISOWeek, getWeekLabel } from '../../../../utils/weekUtils';
import RecipePickerModal from '../components/recipe-picker-modal';
import WeekGrid from '../components/week-grid';
import './week-planner.css';

export default function WeekPlannerPage() {
  const navigate = useNavigate();
  const { week } = useParams();
  // Keep local state in sync with the route so week navigation updates both the UI and URL.
  const [currentWeek, setCurrentWeek] = useState(week || getCurrentISOWeek());
  const { mealPlan, loading, error, removeEntry, assignEntry } = useMealPlan(currentWeek);
  const [removalError, setRemovalError] = useState(null);
  const [assignmentError, setAssignmentError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handlePreviousWeek = () => {
    const prevWeek = addWeeks(currentWeek, -1);
    setCurrentWeek(prevWeek);
    navigate(`/week-planner/${prevWeek}`);
  };

  const handleNextWeek = () => {
    const nextWeek = addWeeks(currentWeek, 1);
    setCurrentWeek(nextWeek);
    navigate(`/week-planner/${nextWeek}`);
  };
  const handleWeekChange = (e) => {
    const selectedWeek = e.target.value;
    setCurrentWeek(selectedWeek);
    navigate(`/week-planner/${selectedWeek}`);
  };

  const handleRemoveRecipe = async (entryId) => {
    try {
      setRemovalError(null);
      const result = await removeEntry(entryId);

      if (result.error) {
        setRemovalError(result.error);
      }
    } catch (err) {
      setRemovalError(err.message || 'Failed to remove recipe');
    }
  };

  const handleAssignRecipe = (dayOfWeek, mealType) => {
    // Store the chosen slot before opening the modal so the eventual selection knows where to land.
    setSelectedSlot({ dayOfWeek, mealType });
    setIsModalOpen(true);
  };

  const handleRecipeSelected = async (recipe) => {
    if (!selectedSlot) return;

    try {
      setAssignmentError(null);
      // Assign by recipe id; the hook handles translating this into a persisted meal-plan entry.
      const result = await assignEntry(selectedSlot.dayOfWeek, selectedSlot.mealType, recipe.id);

      if (result.error) {
        setAssignmentError(result.error);
      }
    } catch (err) {
      setAssignmentError(err.message || 'Failed to assign recipe');
    }

    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  if (loading) {
    return <div className="week-planner__loading">Loading weekly meal plan...</div>;
  }

  return (
    <div className="week-planner">
      <div className="week-planner__header">
        <h1 className="week-planner__title">Weekly Meal Plan</h1>

        <div className="week-planner__nav">
          <button
            className="week-planner__nav-btn week-planner__nav-btn--prev"
            onClick={handlePreviousWeek}
            title="Previous week"
          >
            <span className="material-icons">chevron_left</span>
          </button>

          <div className="week-planner__week-picker">
            <select
              value={currentWeek}
              onChange={handleWeekChange}
            className="week-planner__week-select"
            title="Jump to a specific week"
          >
            {/* Offer a moving 25-week window centered on the current ISO week. */}
            {Array.from({ length: 25 }).map((_, i) => {
              const weekOffset = i - 12;
              const weekOption = addWeeks(getCurrentISOWeek(), weekOffset);
                return (
                  <option key={weekOption} value={weekOption}>
                    {getWeekLabel(weekOption)}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            className="week-planner__nav-btn week-planner__nav-btn--next"
            onClick={handleNextWeek}
            title="Next week"
          >
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </div>

      {error && <div className="week-planner__error">{error}</div>}
      {removalError && <div className="week-planner__error">{removalError}</div>}
      {assignmentError && <div className="week-planner__error">{assignmentError}</div>}

      {mealPlan ? (
        <WeekGrid
          entries={mealPlan.entries || []}
          onRemoveRecipe={handleRemoveRecipe}
          onAssignRecipe={handleAssignRecipe}
          loading={loading}
        />
      ) : (
        <div className="week-planner__empty">Failed to load meal plan</div>
      )}

      <RecipePickerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSelectRecipe={handleRecipeSelected}
        currentUserId={auth.currentUser?.uid}
      />
    </div>
  );
}
