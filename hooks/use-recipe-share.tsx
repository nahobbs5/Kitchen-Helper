import { useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { RecipeShareCard, recipeShareCardWidth } from '../components/recipe-share-card';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useRatings } from '../contexts/ratings-context';
import { useAppSettings } from '../contexts/settings-context';
import { shareRecipe, shareRecipes, type ExportRecipe } from '../utils/export-recipes';
import type { SampleRecipe } from '../utils/sample-recipes';
import type { LibraryRecipe } from './use-library-recipes';

export type ShareableRecipe = LibraryRecipe | SampleRecipe;

function toExportRecipe(
  recipe: ShareableRecipe,
  recipeOverrideMap: ReturnType<typeof useCustomRecipes>['recipeOverrideMap'],
  rating: number | null = null
): ExportRecipe {
  const override = recipeOverrideMap[recipe.slug];
  const sourceInfo = 'sourceInfo' in recipe ? recipe.sourceInfo ?? null : override?.sourceInfo ?? null;

  return {
    slug: recipe.slug,
    title: recipe.title,
    category: recipe.category,
    sourceLabel: recipe.source,
    cuisineRegion: (recipe as { cuisineRegion?: string | null }).cuisineRegion ?? null,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime,
    servings: recipe.servings,
    allergyFriendlyTags: recipe.allergyFriendlyTags,
    allergenTags: recipe.allergenTags,
    ingredients: recipe.ingredients,
    directions: recipe.directions,
    notes: 'notes' in recipe && typeof recipe.notes === 'string' ? recipe.notes : null,
    sourceInfo,
    rating,
  };
}

async function waitForHiddenShareCard() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * Share recipe cards as images. Renders the share cards off-screen, captures them, then clears them.
 * Render `hiddenShareCards` once near the top of the screen.
 */
export function useRecipeShare() {
  const { showRatingsInCardExports } = useAppSettings();
  const { recipeOverrideMap } = useCustomRecipes();
  const { getRating } = useRatings();
  const [pending, setPending] = useState<ExportRecipe[]>([]);
  const [sharingMany, setSharingMany] = useState(false);
  const cardRefs = useRef<Record<string, View | null>>({});

  const toExport = (recipe: ShareableRecipe) =>
    toExportRecipe(recipe, recipeOverrideMap, showRatingsInCardExports ? getRating(recipe.slug) : null);

  async function shareOne(recipe: ShareableRecipe) {
    const exportRecipe = toExport(recipe);
    setPending([exportRecipe]);
    try {
      await waitForHiddenShareCard();
      await shareRecipe(exportRecipe, { current: cardRefs.current[exportRecipe.slug] });
    } finally {
      setPending([]);
    }
  }

  async function shareMany(recipes: ShareableRecipe[]) {
    if (recipes.length === 0 || sharingMany) return;
    const exportRecipes = recipes.map(toExport);
    setSharingMany(true);
    setPending(exportRecipes);
    try {
      await waitForHiddenShareCard();
      await shareRecipes(
        exportRecipes,
        exportRecipes.map((recipe) => ({ current: cardRefs.current[recipe.slug] }))
      );
    } finally {
      setPending([]);
      setSharingMany(false);
    }
  }

  const hiddenShareCards: ReactNode =
    pending.length > 0 ? (
      <View pointerEvents="none" style={{ left: -10000, position: 'absolute', top: 0, width: recipeShareCardWidth }}>
        {pending.map((recipe) => (
          <View
            key={recipe.slug}
            ref={(view) => {
              cardRefs.current[recipe.slug] = view;
            }}
            collapsable={false}
          >
            <RecipeShareCard recipe={recipe} />
          </View>
        ))}
      </View>
    ) : null;

  return { shareOne, shareMany, sharingMany, hiddenShareCards };
}
