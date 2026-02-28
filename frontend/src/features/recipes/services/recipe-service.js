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

const RECIPES_COL = collection(db, "recipes");

const RECIPE_DOC = (recipeId) => doc(db, "recipes", recipeId);

export function subscribeToRecipes(onData, onError) {
    const q = query(RECIPES_COL);

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
        (err) => {
            console.error("Firestore read failed:", err.code, err.message);
            onError(err);
        }
    );
}

export async function createRecipe(userId, authorName, recipeData) {
    if (!userId) {
        throw new Error("Cannot save recipe — user is not authenticated");
    }

    try {
        const docRef = await addDoc(RECIPES_COL, {
            ...recipeData,
            authorId: userId,
            authorName: authorName || "Anonymous",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log("Recipe saved to Firestore with ID:", docRef.id);
        return docRef;
    } catch (err) {
        console.error("Firestore write failed:", err.code, err.message);
        throw err;
    }
}

export async function updateRecipe(recipeId, updatedData) {
    try {
        await updateDoc(RECIPE_DOC(recipeId), {
            ...updatedData,
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.error("Firestore update failed:", err.code, err.message);
        throw err;
    }
}

export async function deleteRecipe(recipeId) {
    try {
        await deleteDoc(RECIPE_DOC(recipeId));
    } catch (err) {
        console.error("Firestore delete failed:", err.code, err.message);
        throw err;
    }
}
