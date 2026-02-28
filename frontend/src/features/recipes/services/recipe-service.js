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
import { db } from "../../../services/firebase";

const RECIPES_PATH = (userId) =>
    collection(db, "users", userId, "recipes");

const RECIPE_DOC = (userId, recipeId) =>
    doc(db, "users", userId, "recipes", recipeId);

export function subscribeToRecipes(userId, onData, onError) {
    const q = query(RECIPES_PATH(userId));

    return onSnapshot(
        q,
        (snapshot) => {
            const docs = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));
            docs.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() ?? 0;
                const bTime = b.createdAt?.toMillis?.() ?? 0;
                return bTime - aTime;
            });
            onData(docs);
        },
        onError
    );
}

export async function createRecipe(userId, recipeData) {
    return addDoc(RECIPES_PATH(userId), {
        ...recipeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function updateRecipe(userId, recipeId, updatedData) {
    return updateDoc(RECIPE_DOC(userId, recipeId), {
        ...updatedData,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteRecipe(userId, recipeId) {
    return deleteDoc(RECIPE_DOC(userId, recipeId));
}
