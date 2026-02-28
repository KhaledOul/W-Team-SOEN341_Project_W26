import React from "react";
import "./recipe-card.css";

function getDifficultyClass(difficulty) {
    const d = (difficulty || "").toLowerCase();
    if (d === "easy") return "easy";
    if (d === "medium") return "medium";
    if (d === "hard") return "hard";
    return "";
}

export default function RecipeCard({ recipe, onEdit, onDelete }) {
    const title = recipe.title ?? recipe.name ?? "Untitled";
    const time = recipe.time ?? recipe.preparationTime ?? "";
    const stepsText = recipe.steps ?? recipe.preparationSteps ?? "";
    const diet = recipe.diet ?? recipe.dietaryPreferences ?? recipe.mealPreferences ?? [];
    const allergies = recipe.allergies ?? [];

    const allIngredients = (recipe.ingredients || "")
        .split("\n")
        .filter((item) => item.trim());
    const ingredientsList = allIngredients.slice(0, 3);
    const moreCount = allIngredients.length - 3;

    const firstStep = (stepsText || "")
        .split("\n")
        .filter((item) => item.trim())[0] || "";

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
                    <span className="meta-value">{recipe.author || "-"}</span>
                </div>

                <div className="meta-item">
                    <span className="material-icons meta-icon">star</span>
                    {recipe.difficulty ? (
                        <span className={`difficulty-badge ${getDifficultyClass(recipe.difficulty)}`}>
                            {recipe.difficulty}
                        </span>
                    ) : (
                        <span className="meta-value">-</span>
                    )}
                </div>

                <div className="meta-item">
                    <span className="material-icons meta-icon">schedule</span>
                    <span className="meta-value">{time !== "" ? `${time} min` : "-"}</span>
                </div>

                <div className="meta-item">
                    <span className="material-icons meta-icon">attach_money</span>
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

            <hr className="card-divider" />

            <div className="recipe-section">
                <h4>Ingredients</h4>
                <ul className="ingredients-list">
                    {ingredientsList.map((ingredient, index) => (
                        <li key={index}>{ingredient.trim()}</li>
                    ))}
                    {moreCount > 0 && <li className="more-items">+{moreCount} more</li>}
                </ul>
            </div>

            <hr className="card-divider" />

            <div className="recipe-section">
                <h4>Steps</h4>
                {firstStep ? (
                    <div className="step-truncated">
                        1. {firstStep.trim()}
                    </div>
                ) : (
                    <div className="step-truncated step-empty">
                        No steps added
                    </div>
                )}
            </div>

            <hr className="card-divider" />

            <button className="btn-view-details" onClick={() => onEdit(recipe.id)}>
                View Full Recipe
            </button>
        </div>
    );
}

