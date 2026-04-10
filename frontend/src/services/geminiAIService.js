import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function analyzeImageAndGenerateRecipe(imageFile) {
  if (!ALLOWED_TYPES.includes(imageFile.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }

  if (imageFile.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 10MB.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = `Analyze this image of food/meal and generate a recipe for it.
Return the response in the following JSON format ONLY (no markdown, no code blocks, just pure JSON):
{
  "title": "Recipe name",
  "ingredients": "List each ingredient on a new line with quantities",
  "steps": "List each step on a new line, numbered",
  "time": estimated cooking time in minutes (number only),
  "cost": estimated cost in USD (number only),
  "difficulty": "Easy" or "Medium" or "Hard",
  "diet": ["Array of applicable dietary categories from: Vegan, Halal, Kosher, Pescatarian, Keto, Vegetarian"],
  "allergies": ["Array of common allergens present from: Peanuts, Dairy, Gluten, Shellfish, Soy, Nuts"]
}

Be accurate with the ingredients visible in the image. If you cannot identify the dish, make your best guess based on what you see.`;

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();

  // Parse the JSON response
  let cleanedText = text.trim();
  // Remove markdown code blocks if present
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.slice(7);
  }
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.slice(3);
  }
  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(0, -3);
  }
  cleanedText = cleanedText.trim();

  const recipeData = JSON.parse(cleanedText);

  // Validate and sanitize the response
  return {
    title: recipeData.title || 'Untitled Recipe',
    ingredients: recipeData.ingredients || '',
    steps: recipeData.steps || '',
    time: Number(recipeData.time) || 30,
    cost: Number(recipeData.cost) || 10,
    difficulty: ['Easy', 'Medium', 'Hard'].includes(recipeData.difficulty)
      ? recipeData.difficulty
      : 'Medium',
    diet: Array.isArray(recipeData.diet) ? recipeData.diet : [],
    allergies: Array.isArray(recipeData.allergies) ? recipeData.allergies : [],
  };
}
