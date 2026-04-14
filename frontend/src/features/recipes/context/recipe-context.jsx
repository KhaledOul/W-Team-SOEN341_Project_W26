import PropTypes from 'prop-types';
import React, { useContext, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/auth-context';
import * as recipeService from '../services/recipe-service';

const RecipeContext = React.createContext();

export function useRecipe() {
  return useContext(RecipeContext);
}

export function RecipeProvider({ children }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe = () => {};

    try {
      unsubscribe = recipeService.subscribeToRecipes(
        (docs) => {
          setRecipes(docs);
          setLoading(false);
        },
        (err) => {
          console.error('Error listening to recipes:', err);
          setError('Failed to load recipes. Please try again.');
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error setting up recipes listener:', err);
      setError('Failed to load recipes. Please try again.');
      setLoading(false);
    }

    return () => unsubscribe();
  }, [currentUser]);

  const createRecipe = async (newRecipe) => {
    if (!currentUser) return;
    try {
      const authorName = currentUser.displayName || currentUser.email || 'Anonymous';
      await recipeService.createRecipe(currentUser.uid, authorName, newRecipe);
    } catch (err) {
      console.error('Error creating recipe:', err);
      setError('Failed to create recipe.');
    }
  };

  const updateRecipe = async (id, updatedData) => {
    if (!currentUser) return;
    try {
      await recipeService.updateRecipe(id, updatedData);
    } catch (err) {
      console.error('Error updating recipe:', err);
      setError('Failed to update recipe.');
    }
  };

  const deleteRecipe = async (id) => {
    if (!currentUser) return;
    try {
      await recipeService.deleteRecipe(id);
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe.');
    }
  };

  const getRecipeById = (id) => {
    return recipes.find((recipe) => recipe.id === id);
  };

  const value = {
    recipes,
    loading,
    error,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeById,
  };

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

RecipeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
