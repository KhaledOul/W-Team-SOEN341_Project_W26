import React, { useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase/firebase";
import { useAuth } from "../authContext";

// Create global Recipe context
const RecipeContext = React.createContext();

// Custom hook to access the Recipe context
export function useRecipe() {
  return useContext(RecipeContext);
}

export function RecipeProvider({ children }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Real-time Firestore listener — replaces localStorage reads
  useEffect(() => {
    if (!currentUser) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe = () => { };

    try {
      const q = query(
        collection(db, "users", currentUser.uid, "recipes")
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          // Sort client-side: newest first
          docs.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
          });
          setRecipes(docs);
          setLoading(false);
        },
        (err) => {
          console.error("Error listening to recipes:", err);
          setError("Failed to load recipes. Please try again.");
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("Error setting up recipes listener:", err);
      setError("Failed to load recipes. Please try again.");
      setLoading(false);
    }

    return () => unsubscribe();
  }, [currentUser]);

  // Create new recipe in Firestore
  const createRecipe = async (newRecipe) => {
    if (!currentUser) return;
    try {
      await addDoc(
        collection(db, "users", currentUser.uid, "recipes"),
        {
          ...newRecipe,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
    } catch (err) {
      console.error("Error creating recipe:", err);
      setError("Failed to create recipe.");
    }
  };

  // Update existing recipe in Firestore
  const updateRecipe = async (id, updatedData) => {
    if (!currentUser) return;
    try {
      await updateDoc(
        doc(db, "users", currentUser.uid, "recipes", id),
        {
          ...updatedData,
          updatedAt: serverTimestamp(),
        }
      );
    } catch (err) {
      console.error("Error updating recipe:", err);
      setError("Failed to update recipe.");
    }
  };

  // Delete recipe from Firestore
  const deleteRecipe = async (id) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "recipes", id));
    } catch (err) {
      console.error("Error deleting recipe:", err);
      setError("Failed to delete recipe.");
    }
  };

  // Get recipe by ID from the current in-memory list
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

  // Provide recipes to all child components
  return (
    <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>
  );
}
