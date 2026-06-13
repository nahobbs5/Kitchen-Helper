import type { RecipeOverride } from '../contexts/custom-recipes-context';
import { obsidianRecipes, type ObsidianRecipe } from '../data/obsidian-recipes';

export const sampleRecipeCategories = ['Entree', 'Appetizers', 'Breakfast', 'Dessert'] as const;

export type SampleRecipe = ObsidianRecipe & {
  cuisineRegion: string | null;
  sourceInfo: RecipeOverride['sourceInfo'] | null;
};

/**
 * Build the Sample Recipes list: the curated obsidian categories, with any user
 * overrides applied and deleted entries removed, sorted alphabetically by title.
 * This is the default ordering; callers layer a manual order on top via
 * `sortByManualOrder`.
 */
export function buildSampleRecipes(recipeOverrideMap: Record<string, RecipeOverride>): SampleRecipe[] {
  return obsidianRecipes
    .filter((recipe) =>
      sampleRecipeCategories.includes(recipe.category as (typeof sampleRecipeCategories)[number])
    )
    .filter((recipe) => !recipeOverrideMap[recipe.slug]?.deleted)
    .map((recipe) => {
      const override = recipeOverrideMap[recipe.slug];

      return override
        ? {
            ...recipe,
            title: override.title,
            category: override.category,
            allergyFriendlyTags: override.allergyFriendlyTags,
            allergenTags: override.allergenTags,
            ingredients: override.ingredients,
            directions: override.directions,
            cuisineRegion: override.cuisineRegion,
            notes: override.notes,
            sourceInfo: override.sourceInfo,
          }
        : {
            ...recipe,
            cuisineRegion: null,
            notes: recipe.notes,
            sourceInfo: null,
          };
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}
