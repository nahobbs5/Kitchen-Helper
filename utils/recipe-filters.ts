export type RatingThreshold = 3 | 4 | 5;

export const RATING_THRESHOLDS: RatingThreshold[] = [3, 4, 5];

export type RecipeFilterScope = 'my-recipes' | 'sample-recipes';

export type RecipeFilterState = {
  // Category names, plus the special value 'Favorites'.
  categories: string[];
  cuisines: string[];
  dietaryTags: string[];
  ratingActive: boolean;
  ratingThreshold: RatingThreshold;
};

export type RecipeFilterKind = 'category' | 'cuisine' | 'dietary' | 'rating';

export type FilterOption = { name: string; count: number };

export type FilterableRecipe = {
  slug: string;
  title: string;
  category: string;
  allergyFriendlyTags: string[];
  allergenTags: string[];
};

export const FAVORITES_FILTER = 'Favorites';

export const emptyRecipeFilters: RecipeFilterState = {
  categories: [],
  cuisines: [],
  dietaryTags: [],
  ratingActive: false,
  ratingThreshold: 3,
};

export function getCuisineRegion(recipe: FilterableRecipe) {
  return (recipe as { cuisineRegion?: string | null }).cuisineRegion ?? null;
}

export function isContainsTag(tag: string) {
  return !tag.toLowerCase().includes('free');
}

export function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function countActiveFilters(state: RecipeFilterState) {
  return (
    state.categories.length + state.cuisines.length + state.dietaryTags.length + (state.ratingActive ? 1 : 0)
  );
}

export function formatRatingLabel(threshold: RatingThreshold) {
  return threshold === 5 ? '5 stars' : `${threshold}+ stars`;
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((groups, value) => {
    groups[value] = (groups[value] ?? 0) + 1;
    return groups;
  }, {});
}

export function buildFilterOptions(recipes: FilterableRecipe[]) {
  const categories: FilterOption[] = Object.entries(countBy(recipes.map((recipe) => recipe.category))).map(
    ([name, count]) => ({ name, count })
  );

  const cuisines: FilterOption[] = Object.entries(
    countBy(recipes.map(getCuisineRegion).filter((cuisine): cuisine is string => Boolean(cuisine)))
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, count]) => ({ name, count }));

  const tags = Object.entries(
    countBy(recipes.flatMap((recipe) => [...recipe.allergyFriendlyTags, ...recipe.allergenTags]))
  )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, count]) => ({ name, count }));

  return {
    categories,
    cuisines,
    dietaryFree: tags.filter((tag) => !isContainsTag(tag.name)),
    dietaryContains: tags.filter((tag) => isContainsTag(tag.name)),
  };
}

export function applyRecipeFilters<T extends FilterableRecipe>(
  recipes: T[],
  state: RecipeFilterState,
  options: { favoriteSlugs: string[]; getRating: (slug: string) => number; searchText: string }
) {
  const normalizedSearch = options.searchText.trim().toLowerCase();
  const wantsFavorites = state.categories.includes(FAVORITES_FILTER);
  const selectedCategories = state.categories.filter((value) => value !== FAVORITES_FILTER);

  return recipes.filter((recipe) => {
    if (wantsFavorites && !options.favoriteSlugs.includes(recipe.slug)) {
      return false;
    }

    if (state.ratingActive && options.getRating(recipe.slug) < state.ratingThreshold) {
      return false;
    }

    if (selectedCategories.length > 0 && !selectedCategories.includes(recipe.category)) {
      return false;
    }

    const cuisine = getCuisineRegion(recipe) ?? '';

    if (state.cuisines.length > 0 && !state.cuisines.includes(cuisine)) {
      return false;
    }

    const tags = [...recipe.allergenTags, ...recipe.allergyFriendlyTags];

    if (!state.dietaryTags.every((tag) => tags.includes(tag))) {
      return false;
    }

    if (normalizedSearch) {
      const haystack = `${recipe.title} ${recipe.category} ${cuisine} ${tags.join(' ')}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    }

    return true;
  });
}
