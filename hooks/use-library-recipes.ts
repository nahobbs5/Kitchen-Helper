import { useMemo } from 'react';

import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { obsidianRecipes } from '../data/obsidian-recipes';

export type LibraryRecipe =
  | (typeof obsidianRecipes)[number]
  | ReturnType<typeof useCustomRecipes>['customRecipes'][number];

// The My Recipes library: the user's own recipes plus bundled recipes with any saved edits applied.
export function useLibraryRecipes(): LibraryRecipe[] {
  const { customRecipes, recipeOverrideMap } = useCustomRecipes();

  return useMemo(
    () => [
      ...customRecipes,
      ...obsidianRecipes.filter((recipe) => !recipeOverrideMap[recipe.slug]?.deleted).map((recipe) => {
        const override = recipeOverrideMap[recipe.slug];

        return override
          ? {
              ...recipe,
              title: override.title,
              category: override.category,
              allergyFriendlyTags: override.allergyFriendlyTags,
              allergenTags: override.allergenTags,
              prepTime: override.prepTime ?? recipe.prepTime,
              cookTime: override.cookTime ?? recipe.cookTime,
              servings: override.servings ?? recipe.servings,
              ingredients: override.ingredients,
              directions: override.directions,
              notes: override.notes,
              cuisineRegion: override.cuisineRegion,
            }
          : recipe;
      }),
    ],
    [customRecipes, recipeOverrideMap]
  );
}
