import { getFunctions, httpsCallable } from 'firebase/functions';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    reader.readAsDataURL(file);
  });
}

export async function generateRecipeFromPhoto(imageFile) {
  // Client-side validation
  if (!ALLOWED_TYPES.includes(imageFile.type)) {
    throw new Error('INVALID_FILE_TYPE');
  }

  if (imageFile.size > MAX_FILE_SIZE) {
    throw new Error('FILE_TOO_LARGE');
  }

  // Convert to base64
  const base64Image = await fileToBase64(imageFile);

  // Call the Cloud Function
  const functions = getFunctions();
  const fn = httpsCallable(functions, 'generateRecipeFromPhoto');

  try {
    const result = await fn({
      base64Image,
      mimeType: imageFile.type,
    });
    return result.data;
  } catch (error) {
    // Remap Firebase HttpsError codes to user-friendly messages
    const code = error.code;

    if (code === 'functions/unauthenticated') {
      throw new Error('You must be logged in to generate a recipe.');
    }

    if (code === 'functions/invalid-argument') {
      throw new Error(error.message);
    }

    if (code === 'functions/internal') {
      throw new Error(error.message);
    }

    throw new Error('Something went wrong. Please try again.');
  }
}
