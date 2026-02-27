import React, { useState } from "react";
import { useRecipe } from "../../context/recipeContext";
import RecipeCard from "../../features/recipes/card";
import RecipeForm from "../../features/recipes/form";
import ConfirmationModal from "../../features/recipes/confirmationModal";
import "./recipes.css";

// Main Recipes page
export default function Recipes() {

    // Get recipes + delete function
  const { recipes, deleteRecipe } = useRecipe();

    // Show/hide form and track which recipe is being edited
  const [showForm, setShowForm] = useState(false);

    // Which recipe is being edited
  const [editingRecipeId, setEditingRecipeId] = useState(null);

    // Search input value
  const [searchTerm, setSearchTerm] = useState("");

    // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

    // Open form for creating new recipe
  const handleCreateNew = () => {
    setEditingRecipeId(null);
    setShowForm(true);
  };

    // Open form for editing recipe
  const handleEdit = (recipeId) => {
    setEditingRecipeId(recipeId);
    setShowForm(true);
  };

    // Close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecipeId(null);
  };

    // Open delete confirmation modal
  const handleDelete = (recipeId) => {
    setRecipeToDelete(recipeId);
    setShowDeleteConfirm(true);
  };

    // Confirm delete
  const handleConfirmDelete = () => {
    if (recipeToDelete) {
      deleteRecipe(recipeToDelete);
    }
    setShowDeleteConfirm(false);
    setRecipeToDelete(null);
  };

    // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRecipeToDelete(null);
  };

    // Filter recipes based on search text
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="recipes-page">
      <div className="recipes-header">
        <div className="header-content">
          <h1>My Recipes</h1>
          <p>{recipes.length} recipes saved</p>
        </div>
        <button className="btn-create-recipe" onClick={handleCreateNew}>
          + New Recipe
        </button>
      </div>

      <div className="recipes-search">
   <div className="search-wrapper">
    <span className="search-icon">🔍</span>

    <input
      type="text"
      placeholder="Search recipes..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          console.log("Search triggered:", searchTerm);
        }
      }}
      className="search-input"
    />
  </div>
</div>

      {filteredRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍳</div>
          <h2>
            {recipes.length === 0
              ? "No recipes yet"
              : "No recipes match your search"}
          </h2>
          <p>
            {recipes.length === 0
              ? "Start creating your first recipe!"
              : "Try a different search term"}
          </p>
          {recipes.length === 0 && (
            <button className="btn-create-recipe" onClick={handleCreateNew}>
              Create First Recipe
            </button>
          )}
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

      {showForm && (
        <RecipeForm recipeId={editingRecipeId} onClose={handleCloseForm} />
      )}

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
