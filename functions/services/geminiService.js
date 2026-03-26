const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const RECIPE_PROMPT = `You are a professional chef and recipe writer.
Analyze the food in this image and generate a complete recipe.

Respond ONLY with a valid JSON object in this exact format, no markdown, no extra text:
{
  "title": "Recipe Name",
  "prepTime": "15 minutes",
  "cookTime": "30 minutes",
  "servings": 4,
  "ingredients": [
    { "quantity": "2 cups", "name": "all-purpose flour" }
  ],
  "steps": [
    { "step": 1, "instruction": "Preheat oven to 180°C." }
  ],
  "tags": ["vegetarian", "baked"]
}`;

const RETRY_PROMPT =
  "Return only raw JSON, no explanation. Use the schema from before.";

function stripMarkdownFences(text) {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ``` wrappers
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  return cleaned.trim();
}

async function generateRecipeFromImage(base64Image, mimeType) {
  const apiKey = functions.config().gemini.api_key;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };

  // First attempt
  const response = await model.generateContent([imagePart, RECIPE_PROMPT]);
  const responseText = response.response.text();
  const cleaned = stripMarkdownFences(responseText);

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // Retry once with a stricter prompt
    functions.logger.warn(
      "First JSON parse failed, retrying with strict prompt..."
    );

    const retryResponse = await model.generateContent([
      imagePart,
      RETRY_PROMPT,
    ]);
    const retryText = retryResponse.response.text();
    const retryCleaned = stripMarkdownFences(retryText);

    try {
      return JSON.parse(retryCleaned);
    } catch (secondError) {
      throw new Error("PARSE_FAILURE");
    }
  }
}

module.exports = { generateRecipeFromImage };
