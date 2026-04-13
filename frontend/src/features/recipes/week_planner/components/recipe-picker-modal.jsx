import { useEffect, useState } from 'react';
import { subscribeToRecipes } from '../../services/recipe-service';
import './recipe-picker-modal.css';

export default function RecipePickerModal({ isOpen, onClose, onSelectRecipe, currentUserId }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    // Subscribe only while the modal is visible so recipe data stays fresh without
    // keeping an unnecessary listener active in the background.
    const unsubscribe = subscribeToRecipes(
      (data) => {
        // The planner lets users assign any available recipe, not just their own.
        if (import.meta.env.DEV) {
          console.warn(
            '[RecipePickerModal] Loaded recipes:',
            data.length,
            'CurrentUserId:',
            currentUserId
          );
        }
        setRecipes(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [isOpen, currentUserId]);

  const filteredRecipes = recipes.filter((recipe) =>
    // Support inconsistent recipe shapes while keeping search case-insensitive.
    (recipe.title || recipe.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (recipe) => {
    onSelectRecipe(recipe);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="recipe-picker-modal-overlay" onClick={onClose}>
      <div className="recipe-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="recipe-picker-modal-header">
          <h2>Select a Recipe</h2>
          <button className="recipe-picker-modal-close" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="recipe-picker-modal-search">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="recipe-picker-search-input"
          />
        </div>

        <div className="recipe-picker-modal-content">
          {loading && <div className="recipe-picker-loading">Loading recipes...</div>}

          {error && <div className="recipe-picker-error">{error}</div>}

          {!loading && !error && filteredRecipes.length === 0 && (
            <div className="recipe-picker-empty">
              {searchTerm
                ? 'No recipes found matching your search.'
                : 'No recipes available. Create some recipes first!'}
            </div>
          )}

          {!loading && !error && filteredRecipes.length > 0 && (
            <div className="recipe-picker-grid">
              {filteredRecipes.map((recipe) => (
                <RecipePickerCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={() => handleSelect(recipe)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipePickerCard({ recipe, onSelect }) {
  // Normalize legacy/new recipe fields so the picker can render mixed data safely.
  const title = recipe.title || recipe.name || 'Untitled';
  const thumbnail = recipe.thumbnail || recipe.image || null;
  const time = recipe.time || recipe.preparationTime || '';

  return (
    <div className="recipe-picker-card" onClick={onSelect}>
      {thumbnail && (
        <div className="recipe-picker-card-image">
          <img src={thumbnail} alt={title} />
        </div>
      )}
      <div className="recipe-picker-card-content">
        <h4 className="recipe-picker-card-title">{title}</h4>
        {time && <p className="recipe-picker-card-time">{time} min</p>}
      </div>
    </div>
  );
}
