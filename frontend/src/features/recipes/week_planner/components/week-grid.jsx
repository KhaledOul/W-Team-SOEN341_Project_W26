import './week-grid.css';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function WeekGrid({ entries, onRemoveRecipe, onAssignRecipe, loading }) {
  // Create a map of entries for quick lookup: key = "dayOfWeek-mealType"
  const entryMap = new Map();
  if (entries) {
    entries.forEach((entry) => {
      const key = `${entry.dayOfWeek}-${entry.mealType}`;
      entryMap.set(key, entry);
    });
  }

  const handleRemove = (entryId) => {
    if (onRemoveRecipe) {
      onRemoveRecipe(entryId);
    }
  };

  if (loading) {
    return <div className="week-grid__loading">Loading meal plan...</div>;
  }

  return (
    <div className="week-grid-container">
      <table className="week-grid">
        <thead>
          <tr>
            <th className="week-grid__meal-type-header">Meal Type</th>
            {DAYS_OF_WEEK.map((day) => (
              <th key={day} className="week-grid__day-header">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MEAL_TYPES.map((mealType) => (
            <tr key={mealType} className="week-grid__row">
              <td className="week-grid__meal-type-label">{mealType}</td>
              {DAYS_OF_WEEK.map((day) => {
                const key = `${day}-${mealType}`;
                const entry = entryMap.get(key);

                return (
                  <td key={key} className="week-grid__cell">
                    {entry ? (
                      <GridCell entry={entry} onRemove={handleRemove} />
                    ) : (
                      <EmptyCell dayOfWeek={day} mealType={mealType} onAssign={onAssignRecipe} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyCell({ dayOfWeek, mealType, onAssign }) {
  const handleClick = () => {
    if (onAssign) {
      onAssign(dayOfWeek, mealType);
    }
  };

  return (
    <div className="week-grid__empty" onClick={handleClick}>
      <span className="week-grid__empty-text">Click to add recipe</span>
      <span className="material-icons week-grid__empty-icon">add</span>
    </div>
  );
}

function GridCell({ entry, onRemove }) {
  const recipe = entry.recipe || {};
  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(entry.id);
    }
  };

  return (
    <div className="week-grid__filled">
      {recipe.thumbnail && (
        <img src={recipe.thumbnail} alt={recipe.title} className="week-grid__recipe-thumbnail" />
      )}
      <div className="week-grid__recipe-info">
        <h4 className="week-grid__recipe-title">{recipe.title || 'Unnamed Recipe'}</h4>
      </div>
      <button className="week-grid__remove-btn" onClick={handleRemove} title="Remove recipe">
        <span className="material-icons">delete</span>
      </button>
    </div>
  );
}
