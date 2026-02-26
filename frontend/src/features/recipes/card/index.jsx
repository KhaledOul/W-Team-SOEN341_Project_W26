import React from "react";
import "./card.css";

// Displays one recipe card
export default function RecipeCard({ recipe, onEdit, onDelete }) {

    // Get first 3 ingredients for preview
  const ingredientsList = recipe.ingredients
    .split("\n")
    .filter((item) => item.trim())
    .slice(0, 3);

    // Check if there are more ingredients
  const hasMoreIngredients =
    recipe.ingredients.split("\n").filter((item) => item.trim()).length > 3;

    // Get first 2 steps for preview
  const stepsList = recipe.preparationSteps
    .split("\n")
    .filter((item) => item.trim())
    .slice(0, 2);

  return (
    <div className="recipe-card">

        {/* Header: name + action buttons */}
      <div className="recipe-header">
        <h3>{recipe.name}</h3>
        <div className="recipe-actions">
          <button
            className="btn-edit"
            onClick={() => onEdit(recipe.id)}
            title="Edit recipe"
          >
            ✏️
          </button>
          <button
            className="btn-delete"
            onClick={() => onDelete(recipe.id)}
            title="Delete recipe"
          >
            🗑️
          </button>
        </div>
      </div>

        {/* Recipe Info */}
      <div className="recipe-meta">

        {/* Preparation Time */}
        <div className="meta-item">
          <span className="meta-label">⏱️ Time:</span>
          <span className="meta-value">{recipe.preparationTime} min</span>
        </div>

        {/* Cost */}
        <div className="meta-item">
          <span className="meta-label">💰 Cost:</span>
          <span className="meta-value">${parseFloat(recipe.cost).toFixed(2)}</span>
        </div>
      </div>

        {/* Ingredients preview */}
      <div className="recipe-section">
        <h4>Ingredients</h4>
        <ul className="ingredients-list">
          {ingredientsList.map((ingredient, index) => (
            <li key={index}>{ingredient.trim()}</li>
          ))}
          {hasMoreIngredients && <li className="more-items">+more...</li>}
        </ul>
      </div>

        {/* Steps preview */}
      <div className="recipe-section">
        <h4>Preparation Steps</h4>
        <p className="steps-preview">
          {stepsList.map((step, index) => (
            <div key={index} className="step-item">
              {index + 1}. {step.trim().substring(0, 80)}
              {step.trim().length > 80 ? "..." : ""}
            </div>
          ))}
        </p>
      </div>

        {/* View full recipe */}
      <button
        className="btn-view-details"
        onClick={() => onEdit(recipe.id)}
      >
        View Full Recipe
      </button>
    </div>
  );
}
