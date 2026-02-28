import React from "react";
import "./card.css";

export default function RecipeCard({ recipe, onEdit, onDelete }) {
  const title = recipe.title ?? recipe.name ?? "Untitled";
  const time = recipe.time ?? recipe.preparationTime ?? "";
  const stepsText = recipe.steps ?? recipe.preparationSteps ?? "";
  const diet = recipe.diet ?? recipe.dietaryPreferences ?? recipe.mealPreferences ?? [];
  const allergies = recipe.allergies ?? [];

  const ingredientsList = (recipe.ingredients || "")
    .split("\n")
    .filter((item) => item.trim())
    .slice(0, 3);

  const hasMoreIngredients =
    (recipe.ingredients || "").split("\n").filter((item) => item.trim()).length > 3;

  const stepsList = (stepsText || "")
    .split("\n")
    .filter((item) => item.trim())
    .slice(0, 2);

  return (
    <div className="recipe-card">
      <div className="recipe-header">
        <h3>{title}</h3>
        <div className="recipe-actions">
          <button className="btn-edit" onClick={() => onEdit(recipe.id)} title="Edit recipe" aria-label="Edit recipe">
            <span className="material-icons">edit</span>
          </button>
          <button className="btn-delete" onClick={() => onDelete(recipe.id)} title="Delete recipe" aria-label="Delete recipe">
            <span className="material-icons">delete</span>
          </button>
        </div>
      </div>

      <div className="recipe-meta">
        <div className="meta-item">
          <span className="material-icons meta-icon">person</span>
          <span className="meta-label">Author:</span>
          <span className="meta-value">{recipe.author || "—"}</span>
        </div>

        <div className="meta-item">
          <span className="material-icons meta-icon">star</span>
          <span className="meta-label">Difficulty:</span>
          <span className="meta-value">{recipe.difficulty || "—"}</span>
        </div>

        <div className="meta-item">
          <span className="material-icons meta-icon">schedule</span>
          <span className="meta-label">Time:</span>
          <span className="meta-value">{time !== "" ? `${time} min` : "—"}</span>
        </div>

        <div className="meta-item">
          <span className="material-icons meta-icon">attach_money</span>
          <span className="meta-label">Cost:</span>
          <span className="meta-value">
            ${Number(recipe.cost || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {(diet.length > 0 || allergies.length > 0) && (
        <div className="recipe-tags">
          {diet.map((d) => (
            <span key={`diet-${d}`} className="tag tag-diet">
              {d}
            </span>
          ))}
          {allergies.map((a) => (
            <span key={`allergy-${a}`} className="tag tag-allergy">
              {a}
            </span>
          ))}
        </div>
      )}

      <div className="recipe-section">
        <h4>Ingredients</h4>
        <ul className="ingredients-list">
          {ingredientsList.map((ingredient, index) => (
            <li key={index}>{ingredient.trim()}</li>
          ))}
          {hasMoreIngredients && <li className="more-items">+more...</li>}
        </ul>
      </div>

      <div className="recipe-section">
        <h4>Steps</h4>
        <div className="steps-preview">
          {stepsList.map((step, index) => (
            <div key={index} className="step-item">
              {index + 1}. {step.trim().substring(0, 80)}
              {step.trim().length > 80 ? "..." : ""}
            </div>
          ))}
        </div>
      </div>

      <button className="btn-view-details" onClick={() => onEdit(recipe.id)}>
        View Full Recipe
      </button>
    </div>
  );
}