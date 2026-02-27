import React, { useState, useEffect } from "react";
import { useRecipe } from "../../../context/recipeContext";
import "./form.css";

// Form component (create or edit recipe)
export default function RecipeForm({ recipeId = null, onClose }) {
  const { createRecipe, updateRecipe, getRecipeById } = useRecipe();
  const [formData, setFormData] = useState({
    name: "",
    ingredients: "",
    preparationTime: "",
    preparationSteps: "",
    cost: "",
  });
  const [errors, setErrors] = useState({});

  // Load recipe data into form when editing
  useEffect(() => {
    if (recipeId) {
      const recipe = getRecipeById(recipeId);
      if (recipe) {
        setFormData({
          name: recipe.name || "",
          ingredients: recipe.ingredients || "",
          preparationTime: recipe.preparationTime || "",
          preparationSteps: recipe.preparationSteps || "",
          cost: recipe.cost || "",
        });
      }
    }
  }, [recipeId, getRecipeById]);

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Recipe name is required";
    }

    if (!formData.ingredients.trim()) {
      newErrors.ingredients = "Ingredients are required";
    }

    if (!formData.preparationTime.trim()) {
      newErrors.preparationTime = "Preparation time is required";
    }

    if (!formData.preparationSteps.trim()) {
      newErrors.preparationSteps = "Preparation steps are required";
    }

    if (!formData.cost || isNaN(formData.cost) || parseFloat(formData.cost) < 0) {
      newErrors.cost = "Cost must be a valid positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update from when user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error while typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clean data before saving
    const recipeData = {
      name: formData.name.trim(),
      ingredients: formData.ingredients.trim(),
      preparationTime: formData.preparationTime.trim(),
      preparationSteps: formData.preparationSteps.trim(),
      cost: parseFloat(formData.cost),
    };

    // Edit or Create
    if (recipeId) {
      updateRecipe(recipeId, recipeData);
    } else {
      createRecipe(recipeData);
    }

    onClose();
  };

  // UI
  return (
    <div className="recipe-form-overlay">
      <div className="recipe-form-container">
        <div className="form-header">
          <h2>{recipeId ? "Edit Recipe" : "Create New Recipe"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

            {/* Recipe Name */}
          <div className="form-group">
            <label htmlFor="name">Recipe Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter recipe name"
              className={errors.name ? "error" : ""}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
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
              className={errors.ingredients ? "error" : ""}
            />
            {errors.ingredients && (
              <span className="error-message">{errors.ingredients}</span>
            )}
          </div>

            {/* Time + Cost */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preparationTime">Preparation Time (minutes) *</label>
              <input
                type="number"
                id="preparationTime"
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleChange}
                placeholder="e.g., 30"
                min="1"
                className={errors.preparationTime ? "error" : ""}
              />
              {errors.preparationTime && (
                <span className="error-message">{errors.preparationTime}</span>
              )}
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
                className={errors.cost ? "error" : ""}
              />
              {errors.cost && (
                <span className="error-message">{errors.cost}</span>
              )}
            </div>
          </div>

            {/* Steps */}
          <div className="form-group">
            <label htmlFor="preparationSteps">Preparation Steps *</label>
            <textarea
              id="preparationSteps"
              name="preparationSteps"
              value={formData.preparationSteps}
              onChange={handleChange}
              placeholder="Enter preparation steps"
              rows="6"
              className={errors.preparationSteps ? "error" : ""}
            />
            {errors.preparationSteps && (
              <span className="error-message">{errors.preparationSteps}</span>
            )}
          </div>

            {/* Buttons */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {recipeId ? "Update Recipe" : "Create Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
