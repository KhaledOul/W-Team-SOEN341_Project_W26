import React, { useContext, useState, useEffect } from "react";
import { useAuth } from "../authContext";

// Create global Recipe context
const RecipeContext = React.createContext();

// Custom hook to access the Recipe 
export function useRecipe() {
  return useContext(RecipeContext);
}

export function RecipeProvider({ children }) {
    // Store recipes
  const [recipes, setRecipes] = useState([]);
    // Loading state 
  const [loading, setLoading] = useState(false);
    // Current logged-in user
  const { currentUser } = useAuth();

  // Load recipes from localStorage when user changes
  useEffect(() => {
    if (currentUser) {
      loadRecipes();
    } else {
      setRecipes([]);
    }
  }, [currentUser]);

  // Get recipes from localStorage
  const loadRecipes = () => {
    setLoading(true);
    try {
      const storedRecipes = localStorage.getItem(`recipes_${currentUser.uid}`);
      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      }
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save recipes to localStorage
  const saveRecipes = (updatedRecipes) => {
    try {
      localStorage.setItem(
        `recipes_${currentUser.uid}`,
        JSON.stringify(updatedRecipes)
      );
    } catch (error) {
      console.error("Error saving recipes:", error);
    }
  };

  // Create new recipe
  const createRecipe = (newRecipe) => {
    const recipe = {
      id: Date.now().toString(),
      ...newRecipe,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedRecipes = [...recipes, recipe];
    setRecipes(updatedRecipes);
    saveRecipes(updatedRecipes);
    return recipe;
  };

  // Update existing recipe
  const updateRecipe = (id, updatedData) => {
    const updatedRecipes = recipes.map((recipe) =>
      recipe.id === id
        ? {
            ...recipe,
            ...updatedData,
            updatedAt: new Date().toISOString(),
          }
        : recipe
    );
    setRecipes(updatedRecipes);
    saveRecipes(updatedRecipes);
  };

  // Delete recipe
  const deleteRecipe = (id) => {
    const updatedRecipes = recipes.filter((recipe) => recipe.id !== id);
    setRecipes(updatedRecipes);
    saveRecipes(updatedRecipes);
  };

  // Get recipe by ID
  const getRecipeById = (id) => {
    return recipes.find((recipe) => recipe.id === id);
  };

  const value = {
    recipes,
    loading,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeById,
  };

  // Provide recipes to all child components
  return (
    <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>
  );
}
