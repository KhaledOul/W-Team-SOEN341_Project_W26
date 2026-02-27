function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeString(s, caseSensitive) {
  if (s == null) return '';
  return caseSensitive ? String(s) : String(s).toLowerCase();
}

 // Build a predicate function for one recipe using filters and options

function buildPredicate(filters = {}, options = {}) {
  const {
    attrMap = {
      time: 'time',
      difficulty: 'difficulty',
      cost: 'cost',
      dietaryTags: 'dietaryTags'
    },
    matchAllDietaryTags = true,
    caseSensitive = false
  } = options;

  const timeFilter = filters.time;
  const difficultyFilter = toArray(filters.difficulty || filters.difficulties || []).map(s => normalizeString(s, caseSensitive));
  const costFilter = toArray(filters.cost || filters.price || []).map(s => normalizeString(s, caseSensitive));
  const dietaryFilter = toArray(filters.dietaryTags || filters.tags || []).map(s => normalizeString(s, caseSensitive));

  return function predicate(recipe) {
    if (!recipe || typeof recipe !== 'object') return false;

    // TIME
    if (timeFilter != null) {
      const recipeTime = Number(recipe[attrMap.time]);
      if (!Number.isNaN(recipeTime)) {
        if (typeof timeFilter === 'number') {
          if (recipeTime > timeFilter) return false;
        } else if (typeof timeFilter === 'object') {
          if (timeFilter.min != null && recipeTime < Number(timeFilter.min)) return false;
          if (timeFilter.max != null && recipeTime > Number(timeFilter.max)) return false;
        }
      }
    }

        // DIFFICULTY
    if (difficultyFilter.length) {
      const r = normalizeString(recipe[attrMap.difficulty], caseSensitive);
      if (!difficultyFilter.includes(r)) return false;
    }

        // COST
    if (costFilter.length) {
      const r = normalizeString(recipe[attrMap.cost], caseSensitive);
      if (!costFilter.includes(r)) return false;
    }

        // DIETARY TAGS
    if (dietaryFilter.length) {
      const rTags = toArray(recipe[attrMap.dietaryTags]).map(t => normalizeString(t, caseSensitive));
      if (matchAllDietaryTags) {  
        const allPresent = dietaryFilter.every(tag => rTags.includes(tag));
        if (!allPresent) return false;
      } else {
        const anyPresent = dietaryFilter.some(tag => rTags.includes(tag));
        if (!anyPresent) return false;
      }
    }

    return true;
  };
}

export function filterRecipes(recipes = [], filters = {}, options = {}) {
  if (!Array.isArray(recipes)) return [];
  const predicate = buildPredicate(filters, options);
  return recipes.filter(predicate);
}

export default filterRecipes;