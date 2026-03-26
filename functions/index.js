const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { generateRecipeFromImage } = require("./services/geminiService");
const { validateRecipe } = require("./utils/recipeValidator");

admin.initializeApp();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

exports.generateRecipeFromPhoto = functions
  .runWith({ timeoutSeconds: 60, memory: "256MB" })
  .https.onCall(async (data, context) => {
    // 1. Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in."
      );
    }

    // 2. Input validation
    const { base64Image, mimeType } = data;

    if (!base64Image || typeof base64Image !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "base64Image is required and must be a non-empty string."
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid image type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    const sizeInBytes = (base64Image.length * 3) / 4;
    if (sizeInBytes > MAX_IMAGE_SIZE) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Image size exceeds the 10 MB limit."
      );
    }

    try {
      // 3. Call Gemini service
      const recipe = await generateRecipeFromImage(base64Image, mimeType);

      // 4. Validate recipe schema
      const validatedRecipe = validateRecipe(recipe);

      // 5. Save to Firestore
      const db = admin.firestore();
      const docRef = await db.collection("recipes").add({
        ...validatedRecipe,
        userId: context.auth.uid,
        source: "ai-generated",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 6. Return result
      return {
        success: true,
        recipeId: docRef.id,
        recipe: validatedRecipe,
      };
    } catch (error) {
      // If it's already an HttpsError, rethrow it
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Map known error codes
      if (error.message === "PARSE_FAILURE") {
        throw new functions.https.HttpsError(
          "internal",
          "Could not parse recipe from image."
        );
      }

      if (error.message === "INVALID_SCHEMA") {
        throw new functions.https.HttpsError(
          "internal",
          "AI returned an incomplete recipe."
        );
      }

      // Unknown errors
      functions.logger.error("generateRecipeFromPhoto error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "AI service error. Please try again."
      );
    }
  });
