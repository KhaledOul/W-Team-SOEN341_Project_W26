function validateRecipe(recipe) {
  if (!recipe || typeof recipe !== "object") {
    throw new Error("INVALID_SCHEMA");
  }

  // title: non-empty string
  if (typeof recipe.title !== "string" || recipe.title.trim().length === 0) {
    throw new Error("INVALID_SCHEMA");
  }

  // prepTime: non-empty string
  if (typeof recipe.prepTime !== "string" || recipe.prepTime.trim().length === 0) {
    throw new Error("INVALID_SCHEMA");
  }

  // cookTime: non-empty string
  if (typeof recipe.cookTime !== "string" || recipe.cookTime.trim().length === 0) {
    throw new Error("INVALID_SCHEMA");
  }

  // servings: number > 0
  if (typeof recipe.servings !== "number" || recipe.servings <= 0) {
    throw new Error("INVALID_SCHEMA");
  }

  // ingredients: array with at least 1 item, each having { quantity, name }
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    throw new Error("INVALID_SCHEMA");
  }
  for (const ingredient of recipe.ingredients) {
    if (
      typeof ingredient.quantity !== "string" ||
      typeof ingredient.name !== "string"
    ) {
      throw new Error("INVALID_SCHEMA");
    }
  }

  // steps: array with at least 1 item, each having { step, instruction }
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    throw new Error("INVALID_SCHEMA");
  }
  for (const step of recipe.steps) {
    if (
      typeof step.step !== "number" ||
      typeof step.instruction !== "string"
    ) {
      throw new Error("INVALID_SCHEMA");
    }
  }

  // tags: array (can be empty)
  if (!Array.isArray(recipe.tags)) {
    throw new Error("INVALID_SCHEMA");
  }

  return recipe;
}

module.exports = { validateRecipe };
