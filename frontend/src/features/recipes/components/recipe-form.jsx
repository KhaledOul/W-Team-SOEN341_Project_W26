import React, { useEffect, useState } from 'react';
import { useRecipe } from '../context/recipe-context';
import './recipe-form.css';

export default function RecipeForm({ recipeId = null, onClose }) {
  const { createRecipe, updateRecipe, getRecipeById } = useRecipe();

  const DIETARY_OPTIONS = ['Vegan', 'Halal', 'Kosher', 'Pescatarian', 'Keto', 'Vegetarian'];

  const ALLERGY_OPTIONS = ['Peanuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy', 'Nuts'];

  const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    ingredients: '',
    steps: '',
    time: '',
    cost: '',
    difficulty: 'Easy',
    diet: [],
    allergies: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!recipeId) return;
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;

    setFormData({
      title: recipe.title ?? recipe.name ?? '',
      author: recipe.author ?? '',
      ingredients: recipe.ingredients ?? '',
      steps: recipe.steps ?? recipe.preparationSteps ?? '',
      time: recipe.time ?? recipe.preparationTime ?? '',
      cost: recipe.cost ?? '',
      difficulty: recipe.difficulty ?? 'Easy',
      diet: recipe.diet ?? recipe.dietaryPreferences ?? recipe.mealPreferences ?? [],
      allergies: recipe.allergies ?? [],
    });
  }, [recipeId, getRecipeById]);

  const toggleArrayValue = (key, value) => {
    setFormData((prev) => {
      const arr = prev[key] || [];
      const exists = arr.includes(value);
      return {
        ...prev,
        [key]: exists ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author.trim()) newErrors.author = 'Author is required';
    if (!formData.ingredients.trim()) newErrors.ingredients = 'Ingredients are required';
    if (!formData.steps.trim()) newErrors.steps = 'Steps are required';

    if (!String(formData.time).trim() || isNaN(formData.time) || Number(formData.time) <= 0) {
      newErrors.time = 'Time must be a valid number of minutes';
    }

    if (formData.cost === '' || isNaN(formData.cost) || Number(formData.cost) < 0) {
      newErrors.cost = 'Cost must be a valid positive number';
    }

    if (!formData.difficulty) newErrors.difficulty = 'Difficulty is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const recipeData = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      ingredients: formData.ingredients.trim(),
      steps: formData.steps.trim(),
      time: Number(formData.time),
      cost: Number(formData.cost),
      difficulty: formData.difficulty,
      diet: formData.diet,
      allergies: formData.allergies,
    };

    if (recipeId) await updateRecipe(recipeId, recipeData);
    else await createRecipe(recipeData);

    onClose();
  };

  return (
    <div className="recipe-form-overlay">
      <div className="recipe-form-container">
        <div className="form-header">
          <h2>{recipeId ? 'Edit Recipe' : 'Create New Recipe'}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter recipe title"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          {/* Author */}
          <div className="form-group">
            <label htmlFor="author">Author *</label>
            <input
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="Your name"
              className={errors.author ? 'error' : ''}
            />
            {errors.author && <span className="error-message">{errors.author}</span>}
          </div>

          {/* Difficulty */}
          <div className="form-group">
            <label htmlFor="difficulty">Difficulty *</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className={errors.difficulty ? 'error' : ''}
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.difficulty && <span className="error-message">{errors.difficulty}</span>}
          </div>

          {/* Ingredients */}
          <div className="form-group">
            <label htmlFor="ingredients">Ingredients *</label>
            <textarea
              id="ingredients"
              name="ingredients"
              value={formData.ingredients}
              onChange={handleChange}
              placeholder="Enter ingredients (one per line)"
              rows="5"
              className={errors.ingredients ? 'error' : ''}
            />
            {errors.ingredients && <span className="error-message">{errors.ingredients}</span>}
          </div>

          {/* Steps */}
          <div className="form-group">
            <label htmlFor="steps">Steps *</label>
            <textarea
              id="steps"
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              placeholder="Enter preparation steps"
              rows="6"
              className={errors.steps ? 'error' : ''}
            />
            {errors.steps && <span className="error-message">{errors.steps}</span>}
          </div>

          {/* Time + Cost */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="time">Time (minutes) *</label>
              <input
                type="number"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                placeholder="e.g., 30"
                min="1"
                className={errors.time ? 'error' : ''}
              />
              {errors.time && <span className="error-message">{errors.time}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="cost">Cost ($) *</label>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={errors.cost ? 'error' : ''}
              />
              {errors.cost && <span className="error-message">{errors.cost}</span>}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="form-group">
            <label>Dietary Preferences</label>
            <div className="prefs-grid">
              {DIETARY_OPTIONS.map((opt) => (
                <label key={opt} className="pref-check">
                  <input
                    type="checkbox"
                    checked={formData.diet.includes(opt)}
                    onChange={() => toggleArrayValue('diet', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="form-group">
            <label>Allergies</label>
            <div className="prefs-grid">
              {ALLERGY_OPTIONS.map((opt) => (
                <label key={opt} className="pref-check">
                  <input
                    type="checkbox"
                    checked={formData.allergies.includes(opt)}
                    onChange={() => toggleArrayValue('allergies', opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {recipeId ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
