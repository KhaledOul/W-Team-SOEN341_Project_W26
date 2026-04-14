import { useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/confirmation-modal';
import RecipeCard from '../components/recipe-card';
import RecipeForm from '../components/recipe-form';
import { useRecipe } from '../context/recipe-context';
import './recipes-page.css';

export default function RecipesPage() {
  const { recipes, loading, error, deleteRecipe } = useRecipe();

  const [showForm, setShowForm] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  const [showFilters, setShowFilters] = useState(false);

  const DIETARY_OPTIONS = ['Vegan', 'Halal', 'Kosher', 'Pescatarian', 'Keto', 'Vegetarian'];

  const ALLERGY_OPTIONS = ['Peanuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy', 'Nuts'];

  const [filters, setFilters] = useState({
    diet: [],
    allergies: [],
    sortByCost: 'none',
    timeMin: '',
    timeMax: '',
  });

  const toggleArray = (key, value) => {
    setFilters((prev) => {
      const arr = prev[key] || [];
      const exists = arr.includes(value);
      return { ...prev, [key]: exists ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const clearFilters = () => {
    setFilters({ diet: [], allergies: [], sortByCost: 'none', timeMin: '', timeMax: '' });
  };

  const handleCreateNew = () => {
    setEditingRecipeId(null);
    setShowForm(true);
  };

  const handleEdit = (recipeId) => {
    setEditingRecipeId(recipeId);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecipeId(null);
  };

  const handleDelete = (recipeId) => {
    setRecipeToDelete(recipeId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (recipeToDelete) await deleteRecipe(recipeToDelete);
    setShowDeleteConfirm(false);
    setRecipeToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRecipeToDelete(null);
  };

  const filteredRecipes = recipes
    .filter((r) => {
      const title = (r.title ?? r.name ?? '').toLowerCase();
      return title.includes(searchTerm.toLowerCase());
    })
    .filter((r) => {
      const time = Number(r.time ?? r.preparationTime);
      const min = filters.timeMin === '' ? null : Number(filters.timeMin);
      const max = filters.timeMax === '' ? null : Number(filters.timeMax);

      if (!Number.isNaN(time)) {
        if (min !== null && time < min) return false;
        if (max !== null && time > max) return false;
      }
      return true;
    })
    .filter((r) => {
      if (filters.diet.length === 0) return true;
      const diet = r.diet ?? r.dietaryPreferences ?? r.mealPreferences ?? [];
      return filters.diet.every((d) => diet.includes(d));
    })
    .filter((r) => {
      if (filters.allergies.length === 0) return true;
      const allergies = r.allergies ?? [];
      return filters.allergies.every((a) => allergies.includes(a));
    })
    .sort((a, b) => {
      if (filters.sortByCost === 'none') return 0;
      const aCost = Number(a.cost) || 0;
      const bCost = Number(b.cost) || 0;
      return filters.sortByCost === 'asc' ? aCost - bCost : bCost - aCost;
    });

  const activeFilterCount =
    filters.diet.length +
    filters.allergies.length +
    (filters.sortByCost === 'none' ? 0 : 1) +
    (filters.timeMin === '' ? 0 : 1) +
    (filters.timeMax === '' ? 0 : 1);

  if (loading) {
    return (
      <div className="recipes-page">
        <div className="recipes-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="recipes-page">
      {error && (
        <div className="recipes-error">
          <span
            className="material-icons"
            style={{ fontSize: '20px', marginRight: '8px', verticalAlign: 'middle' }}
          >
            error
          </span>
          {error}
        </div>
      )}
      <nav className="recipes-nav" aria-label="Page navigation">
        <Link to="/home" className="back-link">
          <span className="material-icons">arrow_back</span>
          Back to Home
        </Link>
      </nav>

      <div className="recipes-header-area">
        <div className="recipes-header-top">
          <h1>My Recipes</h1>
          <p className="recipes-count">{recipes.length} recipes saved</p>
        </div>
        <button className="btn-create-recipe" onClick={handleCreateNew}>
          <span className="material-icons">add</span>+ New Recipe
        </button>

        <div className="recipes-toolbar">
          <div className="recipes-search">
            <span className="material-icons search-icon">search</span>
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <button className="btn-filter" onClick={() => setShowFilters((s) => !s)}>
            <span className="material-icons">tune</span>
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-section">
            <div className="filters-title">Dietary Preferences</div>
            <div className="filters-grid">
              {DIETARY_OPTIONS.map((opt) => (
                <label key={opt} className="filter-check">
                  <input
                    type="checkbox"
                    checked={filters.diet.includes(opt)}
                    onChange={() => toggleArray('diet', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filters-section">
            <div className="filters-title">Allergies</div>
            <div className="filters-grid">
              {ALLERGY_OPTIONS.map((opt) => (
                <label key={opt} className="filter-check">
                  <input
                    type="checkbox"
                    checked={filters.allergies.includes(opt)}
                    onChange={() => toggleArray('allergies', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filters-section">
            <div className="filters-title">Sort by cost</div>
            <select
              className="filter-select"
              value={filters.sortByCost}
              onChange={(e) => setFilters((p) => ({ ...p, sortByCost: e.target.value }))}
            >
              <option value="none">No sorting</option>
              <option value="asc">Low to high</option>
              <option value="desc">High to low</option>
            </select>
          </div>

          <div className="filters-section">
            <div className="filters-title">Time range (minutes)</div>
            <div className="time-range">
              <input
                className="filter-input"
                type="number"
                min="0"
                placeholder="Min"
                value={filters.timeMin}
                onChange={(e) => setFilters((p) => ({ ...p, timeMin: e.target.value }))}
              />
              <span className="time-sep">&mdash;</span>
              <input
                className="filter-input"
                type="number"
                min="0"
                placeholder="Max"
                value={filters.timeMax}
                onChange={(e) => setFilters((p) => ({ ...p, timeMax: e.target.value }))}
              />
            </div>
          </div>

          <div className="filters-actions">
            <button className="btn-secondary" onClick={clearFilters}>
              Clear
            </button>
            <button className="btn-primary" onClick={() => setShowFilters(false)}>
              Apply
            </button>
          </div>
        </div>
      )}

      {filteredRecipes.length === 0 ? (
        <div className="recipes-grid recipes-grid-empty">
          <div className="empty-state">
            <div className="empty-icon">
              <span className="material-icons">search_off</span>
            </div>
            <h2>{recipes.length === 0 ? 'No recipes yet' : 'No recipes match your filters'}</h2>
            <p>
              {recipes.length === 0
                ? 'Get started by adding your first recipe'
                : 'Try adjusting your filters'}
            </p>
            {recipes.length === 0 && (
              <button className="btn-add-first" onClick={handleCreateNew}>
                <span className="material-icons">add</span>+ Add your first recipe
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="recipes-grid">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && <RecipeForm recipeId={editingRecipeId} onClose={handleCloseForm} />}

      {showDeleteConfirm && (
        <ConfirmationModal
          title="Delete Recipe"
          message="Are you sure you want to delete this recipe? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
