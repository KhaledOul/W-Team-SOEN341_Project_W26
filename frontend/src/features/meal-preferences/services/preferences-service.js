import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

export async function loadPreferences(userId) {
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
}

export async function savePreferences(userId, { diet, allergies }) {
  const userDocRef = doc(db, 'users', userId);
  // Merge avoids overwriting unrelated profile fields stored on the same user document.
  return setDoc(userDocRef, { diet, allergies }, { merge: true });
}
