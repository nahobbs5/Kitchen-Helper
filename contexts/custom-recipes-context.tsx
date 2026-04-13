import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { obsidianRecipeMap, type RecipeSection } from '../data/obsidian-recipes';
import {
  allergenTagOptions,
  allergyFriendlyTagOptions,
  ensureAllergenTag,
  ensureFriendlyTag,
  inferRecipeTags,
} from '../utils/allergen-tags';
import {
  buildDirectionStepOverrides,
  replaceDirectionStepText,
  toDirectionSections,
} from '../utils/scaled-directions';

export type RecipeSource = {
  websiteName: string | null;
  author: string | null;
  url: string | null;
} | null;

export type UserRecipe = {
  slug: string;
  title: string;
  category: string;
  source: 'App Storage';
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  allergyFriendlyTags: string[];
  allergenTags: string[];
  ingredients: RecipeSection[];
  originalDirections: RecipeSection[];
  directions: RecipeSection[];
  directionStepOverrides: Record<string, string>;
  notes: string | null;
  cuisineRegion: string | null;
  sourceInfo: RecipeSource;
  createdAt: string;
};

type NewUserRecipeInput = {
  category: string;
  title: string;
  ingredientsText: string;
  directionsText: string;
  notes?: string;
  cuisineRegion?: string | null;
  sourceInfo?: RecipeSource;
  allergyFriendlyTags?: string[];
  allergenTags?: string[];
};

type BulkRecipeMetadataInput = {
  slugs: string[];
  category?: string | null;
  cuisineRegion?: string | null;
  applyCuisineRegion?: boolean;
  allergenTagsToAdd?: string[];
  allergyFriendlyTagsToAdd?: string[];
};

export type RecipeOverride = {
  slug: string;
  title: string;
  category: string;
  allergyFriendlyTags: string[];
  allergenTags: string[];
  ingredients: RecipeSection[];
  directions: RecipeSection[];
  directionStepOverrides: Record<string, string>;
  notes: string | null;
  cuisineRegion: string | null;
  sourceInfo: RecipeSource;
  updatedAt: string;
};

type CustomRecipesContextValue = {
  customRecipes: UserRecipe[];
  customRecipeMap: Record<string, UserRecipe>;
  recipeOverrides: RecipeOverride[];
  recipeOverrideMap: Record<string, RecipeOverride>;
  lastDeletedRecipes: UserRecipe[];
  addRecipe: (input: NewUserRecipeInput) => UserRecipe;
  updateRecipe: (slug: string, input: NewUserRecipeInput, source: 'custom' | 'obsidian') => UserRecipe | RecipeOverride | null;
  bulkUpdateRecipeMetadata: (input: BulkRecipeMetadataInput) => void;
  updateDirectionStep: (slug: string, stepId: string, text: string, source: 'custom' | 'obsidian') => void;
  resetDirectionStep: (slug: string, stepId: string, source: 'custom' | 'obsidian') => void;
  deleteRecipe: (slug: string) => void;
  deleteRecipes: (slugs: string[]) => void;
  restoreDeletedRecipes: () => void;
  clearDeletedRecipes: () => void;
  loaded: boolean;
};

const CUSTOM_RECIPES_KEY = 'kitchen-helper.custom-recipes';
const RECIPE_OVERRIDES_KEY = 'kitchen-helper.recipe-overrides';

const CustomRecipesContext = createContext<CustomRecipesContextValue | undefined>(undefined);

function normalizeSource(source: unknown, legacy?: { sourceWebsite?: unknown; sourceAuthor?: unknown; sourceUrl?: unknown }): RecipeSource {
  if (source && typeof source === 'object') {
    const record = source as Record<string, unknown>;
    const websiteName = typeof record.websiteName === 'string' && record.websiteName.trim() ? record.websiteName.trim() : null;
    const author = typeof record.author === 'string' && record.author.trim() ? record.author.trim() : null;
    const url = typeof record.url === 'string' && record.url.trim() ? record.url.trim() : null;

    return websiteName || author || url ? { websiteName, author, url } : null;
  }

  const websiteName = typeof legacy?.sourceWebsite === 'string' && legacy.sourceWebsite.trim() ? legacy.sourceWebsite.trim() : null;
  const author = typeof legacy?.sourceAuthor === 'string' && legacy.sourceAuthor.trim() ? legacy.sourceAuthor.trim() : null;
  const url = typeof legacy?.sourceUrl === 'string' && legacy.sourceUrl.trim() ? legacy.sourceUrl.trim() : null;

  return websiteName || author || url ? { websiteName, author, url } : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function toSection(text: string): RecipeSection[] {
  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return items.length > 0 ? [{ title: null, items }] : [];
}

export function CustomRecipesProvider({ children }: PropsWithChildren) {
  const [customRecipes, setCustomRecipes] = useState<UserRecipe[]>([]);
  const [recipeOverrides, setRecipeOverrides] = useState<RecipeOverride[]>([]);
  const [lastDeletedRecipes, setLastDeletedRecipes] = useState<UserRecipe[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([AsyncStorage.getItem(CUSTOM_RECIPES_KEY), AsyncStorage.getItem(RECIPE_OVERRIDES_KEY)])
      .then(([customValue, overridesValue]) => {
        if (!active) {
          return;
        }

        if (customValue) {
          const parsedCustom = JSON.parse(customValue);
          setCustomRecipes(
            Array.isArray(parsedCustom)
              ? parsedCustom.map((recipe) => ({
                  ...recipe,
                  originalDirections: Array.isArray((recipe as Record<string, unknown>).originalDirections)
                    ? ((recipe as Record<string, unknown>).originalDirections as RecipeSection[])
                    : (recipe as Record<string, unknown>).directions as RecipeSection[],
                  directionStepOverrides:
                    (recipe as Record<string, unknown>).directionStepOverrides &&
                    typeof (recipe as Record<string, unknown>).directionStepOverrides === 'object'
                      ? ((recipe as Record<string, unknown>).directionStepOverrides as Record<string, string>)
                      : {},
                  sourceInfo: normalizeSource((recipe as Record<string, unknown>).sourceInfo, recipe),
                }))
              : []
          );
        }

        if (overridesValue) {
          const parsedOverrides = JSON.parse(overridesValue);
          setRecipeOverrides(
            Array.isArray(parsedOverrides)
              ? parsedOverrides.map((recipe) => ({
                  ...recipe,
                  directionStepOverrides:
                    (recipe as Record<string, unknown>).directionStepOverrides &&
                    typeof (recipe as Record<string, unknown>).directionStepOverrides === 'object'
                      ? ((recipe as Record<string, unknown>).directionStepOverrides as Record<string, string>)
                      : {},
                  sourceInfo: normalizeSource((recipe as Record<string, unknown>).sourceInfo, recipe),
                }))
              : []
          );
        }

        if (active) {
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<CustomRecipesContextValue>(
    () => ({
      customRecipes,
      customRecipeMap: Object.fromEntries(customRecipes.map((recipe) => [recipe.slug, recipe])),
      recipeOverrides,
      recipeOverrideMap: Object.fromEntries(recipeOverrides.map((recipe) => [recipe.slug, recipe])),
      lastDeletedRecipes,
      loaded,
      addRecipe: (input: NewUserRecipeInput) => {
        const title = input.title.trim();
        const baseSlug = slugify(title || 'recipe');

        let createdRecipe!: UserRecipe;

        setCustomRecipes((current) => {
          let slug = baseSlug;
          let counter = 2;

          while (current.some((recipe) => recipe.slug === slug)) {
            slug = `${baseSlug}-${counter}`;
            counter += 1;
          }

          const inferredTags = inferRecipeTags({
            title,
            ingredientsText: input.ingredientsText,
            directionsText: input.directionsText,
            notes: input.notes,
          });

          createdRecipe = {
            slug,
            title,
            category: input.category,
            source: 'App Storage',
            prepTime: null,
            cookTime: null,
            totalTime: null,
            servings: null,
            allergyFriendlyTags: input.allergyFriendlyTags ?? inferredTags.allergyFriendlyTags,
            allergenTags: input.allergenTags ?? inferredTags.allergenTags,
            ingredients: toSection(input.ingredientsText),
            originalDirections: toDirectionSections(input.directionsText),
            directions: toDirectionSections(input.directionsText),
            directionStepOverrides: {},
            notes: input.notes?.trim() ? input.notes.trim() : null,
            cuisineRegion: input.cuisineRegion?.trim() ? input.cuisineRegion.trim() : null,
            sourceInfo: normalizeSource(input.sourceInfo),
            createdAt: new Date().toISOString(),
          };

          const next = [createdRecipe, ...current];
          AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });

        return createdRecipe;
      },
      deleteRecipe: (slug: string) => {
        setCustomRecipes((current) => {
          const removedRecipes = current.filter((recipe) => recipe.slug === slug);
          const next = current.filter((recipe) => recipe.slug !== slug);
          setLastDeletedRecipes(removedRecipes);
          AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
      deleteRecipes: (slugs: string[]) => {
        if (slugs.length === 0) {
          return;
        }

        setCustomRecipes((current) => {
          const removedRecipes = current.filter((recipe) => slugs.includes(recipe.slug));
          const next = current.filter((recipe) => !slugs.includes(recipe.slug));

          setLastDeletedRecipes(removedRecipes);
          AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
      restoreDeletedRecipes: () => {
        if (lastDeletedRecipes.length === 0) {
          return;
        }

        setCustomRecipes((current) => {
          const recipesToRestore = lastDeletedRecipes.filter(
            (deletedRecipe) => !current.some((recipe) => recipe.slug === deletedRecipe.slug)
          );

          if (recipesToRestore.length === 0) {
            return current;
          }

          const next = [...recipesToRestore, ...current];
          AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
        setLastDeletedRecipes([]);
      },
      clearDeletedRecipes: () => {
        setLastDeletedRecipes([]);
      },
      updateRecipe: (slug: string, input: NewUserRecipeInput, source: 'custom' | 'obsidian') => {
        const title = input.title.trim();
        const inferredTags = inferRecipeTags({
          title,
          ingredientsText: input.ingredientsText,
          directionsText: input.directionsText,
          notes: input.notes,
        });
        const ingredientsSection = toSection(input.ingredientsText);
        const directionsSection = toDirectionSections(input.directionsText);
        const notes = input.notes?.trim() ? input.notes.trim() : null;
        const cuisineRegion = input.cuisineRegion?.trim() ? input.cuisineRegion.trim() : null;
        const sourceInfo = normalizeSource(input.sourceInfo);
        const allergyFriendlyTags = input.allergyFriendlyTags ?? inferredTags.allergyFriendlyTags;
        const allergenTags = input.allergenTags ?? inferredTags.allergenTags;

        if (source === 'custom') {
          let updatedRecipe: UserRecipe | null = null;

          setCustomRecipes((current) => {
            const next = current.map((recipe) => {
              if (recipe.slug !== slug) {
                return recipe;
              }

              updatedRecipe = {
                ...recipe,
                title,
                category: input.category,
                allergyFriendlyTags,
                allergenTags,
                ingredients: ingredientsSection,
                directionStepOverrides: buildDirectionStepOverrides(recipe.originalDirections, directionsSection),
                directions: directionsSection,
                notes,
                cuisineRegion,
                sourceInfo,
              };

              return updatedRecipe;
            });

            AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });

          return updatedRecipe;
        }

        let updatedOverride: RecipeOverride | null = null;

        setRecipeOverrides((current) => {
          const baseRecipe = obsidianRecipeMap[slug];
          const override: RecipeOverride = {
            slug,
            title,
            category: input.category,
            allergyFriendlyTags,
            allergenTags,
            ingredients: ingredientsSection,
            directions: directionsSection,
            directionStepOverrides: baseRecipe
              ? buildDirectionStepOverrides(baseRecipe.directions, directionsSection)
              : {},
            notes,
            cuisineRegion,
            sourceInfo,
            updatedAt: new Date().toISOString(),
          };

          updatedOverride = override;
          const withoutCurrent = current.filter((recipe) => recipe.slug !== slug);
          const next = [override, ...withoutCurrent];
          AsyncStorage.setItem(RECIPE_OVERRIDES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });

        return updatedOverride;
      },
      bulkUpdateRecipeMetadata: (input: BulkRecipeMetadataInput) => {
        if (input.slugs.length === 0) {
          return;
        }

        const allergenTagsToAdd = (input.allergenTagsToAdd ?? []).filter((tag): tag is (typeof allergenTagOptions)[number] =>
          allergenTagOptions.includes(tag as (typeof allergenTagOptions)[number])
        );
        const allergyFriendlyTagsToAdd = (input.allergyFriendlyTagsToAdd ?? []).filter(
          (tag): tag is (typeof allergyFriendlyTagOptions)[number] =>
            allergyFriendlyTagOptions.includes(tag as (typeof allergyFriendlyTagOptions)[number])
        );

        setCustomRecipes((current) => {
          const next = current.map((recipe) => {
            if (!input.slugs.includes(recipe.slug)) {
              return recipe;
            }

            let nextAllergenTags = [...recipe.allergenTags];
            let nextFriendlyTags = [...recipe.allergyFriendlyTags];

            allergyFriendlyTagsToAdd.forEach((tag) => {
              const nextTags = ensureFriendlyTag(nextAllergenTags, nextFriendlyTags, tag);
              nextAllergenTags = nextTags.allergenTags;
              nextFriendlyTags = nextTags.allergyFriendlyTags;
            });

            allergenTagsToAdd.forEach((tag) => {
              const nextTags = ensureAllergenTag(nextAllergenTags, nextFriendlyTags, tag);
              nextAllergenTags = nextTags.allergenTags;
              nextFriendlyTags = nextTags.allergyFriendlyTags;
            });

            return {
              ...recipe,
              category: input.category ?? recipe.category,
              cuisineRegion: input.applyCuisineRegion ? (input.cuisineRegion?.trim() ? input.cuisineRegion.trim() : null) : recipe.cuisineRegion,
              allergenTags: nextAllergenTags,
              allergyFriendlyTags: nextFriendlyTags,
            };
          });

          AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });

        setRecipeOverrides((current) => {
          const nextOverrides = [...current];

          input.slugs.forEach((slug) => {
            const baseRecipe = obsidianRecipeMap[slug];

            if (!baseRecipe) {
              return;
            }

            const existingOverride = nextOverrides.find((recipe) => recipe.slug === slug);
            let nextAllergenTags = [...(existingOverride?.allergenTags ?? baseRecipe.allergenTags)];
            let nextFriendlyTags = [...(existingOverride?.allergyFriendlyTags ?? baseRecipe.allergyFriendlyTags)];

            allergyFriendlyTagsToAdd.forEach((tag) => {
              const nextTags = ensureFriendlyTag(nextAllergenTags, nextFriendlyTags, tag);
              nextAllergenTags = nextTags.allergenTags;
              nextFriendlyTags = nextTags.allergyFriendlyTags;
            });

            allergenTagsToAdd.forEach((tag) => {
              const nextTags = ensureAllergenTag(nextAllergenTags, nextFriendlyTags, tag);
              nextAllergenTags = nextTags.allergenTags;
              nextFriendlyTags = nextTags.allergyFriendlyTags;
            });

            const nextOverride: RecipeOverride = {
              slug,
              title: existingOverride?.title ?? baseRecipe.title,
              category: input.category ?? existingOverride?.category ?? baseRecipe.category,
              allergyFriendlyTags: nextFriendlyTags,
              allergenTags: nextAllergenTags,
              ingredients: existingOverride?.ingredients ?? baseRecipe.ingredients,
              directions: existingOverride?.directions ?? baseRecipe.directions,
              directionStepOverrides: existingOverride?.directionStepOverrides ?? {},
              notes: existingOverride?.notes ?? null,
              cuisineRegion: input.applyCuisineRegion
                ? (input.cuisineRegion?.trim() ? input.cuisineRegion.trim() : null)
                : (existingOverride?.cuisineRegion ?? null),
              sourceInfo: existingOverride?.sourceInfo ?? null,
              updatedAt: new Date().toISOString(),
            };

            const existingIndex = nextOverrides.findIndex((recipe) => recipe.slug === slug);

            if (existingIndex >= 0) {
              nextOverrides[existingIndex] = nextOverride;
            } else {
              nextOverrides.unshift(nextOverride);
            }
          });

          AsyncStorage.setItem(RECIPE_OVERRIDES_KEY, JSON.stringify(nextOverrides)).catch(() => {});
          return nextOverrides;
        });
      },
      updateDirectionStep: (slug: string, stepId: string, text: string, source: 'custom' | 'obsidian') => {
        const nextText = text.trim();

        if (!nextText) {
          return;
        }

        if (source === 'custom') {
          setCustomRecipes((current) => {
            const next = current.map((recipe) => {
              if (recipe.slug !== slug) {
                return recipe;
              }

              const nextDirections = replaceDirectionStepText(recipe.directions, stepId, nextText);

              return {
                ...recipe,
                directions: nextDirections,
                directionStepOverrides: buildDirectionStepOverrides(recipe.originalDirections, nextDirections),
              };
            });

            AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });

          return;
        }

        setRecipeOverrides((current) => {
          const baseRecipe = obsidianRecipeMap[slug];

          if (!baseRecipe) {
            return current;
          }

          const existingOverride = current.find((recipe) => recipe.slug === slug);
          const nextDirections = replaceDirectionStepText(
            existingOverride?.directions ?? baseRecipe.directions,
            stepId,
            nextText
          );

          const nextOverride: RecipeOverride = {
            slug,
            title: existingOverride?.title ?? baseRecipe.title,
            category: existingOverride?.category ?? baseRecipe.category,
            allergyFriendlyTags: existingOverride?.allergyFriendlyTags ?? baseRecipe.allergyFriendlyTags,
            allergenTags: existingOverride?.allergenTags ?? baseRecipe.allergenTags,
            ingredients: existingOverride?.ingredients ?? baseRecipe.ingredients,
            directions: nextDirections,
            directionStepOverrides: buildDirectionStepOverrides(baseRecipe.directions, nextDirections),
            notes: existingOverride?.notes ?? null,
            cuisineRegion: existingOverride?.cuisineRegion ?? null,
            sourceInfo: existingOverride?.sourceInfo ?? null,
            updatedAt: new Date().toISOString(),
          };

          const next = [nextOverride, ...current.filter((recipe) => recipe.slug !== slug)];
          AsyncStorage.setItem(RECIPE_OVERRIDES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
      resetDirectionStep: (slug: string, stepId: string, source: 'custom' | 'obsidian') => {
        if (source === 'custom') {
          setCustomRecipes((current) => {
            const next = current.map((recipe) => {
              if (recipe.slug !== slug) {
                return recipe;
              }

              const stepNumber = Number(stepId.replace('step-', ''));
              const originalText = recipe.originalDirections.flatMap((section) => section.items)[stepNumber - 1];

              if (!originalText) {
                return recipe;
              }

              const nextDirections = replaceDirectionStepText(recipe.directions, stepId, originalText);

              return {
                ...recipe,
                directions: nextDirections,
                directionStepOverrides: buildDirectionStepOverrides(recipe.originalDirections, nextDirections),
              };
            });

            AsyncStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });

          return;
        }

        setRecipeOverrides((current) => {
          const baseRecipe = obsidianRecipeMap[slug];

          if (!baseRecipe) {
            return current;
          }

          const existingOverride = current.find((recipe) => recipe.slug === slug);
          const stepNumber = Number(stepId.replace('step-', ''));
          const originalText = baseRecipe.directions.flatMap((section) => section.items)[stepNumber - 1];

          if (!existingOverride || !originalText) {
            return current;
          }

          const nextDirections = replaceDirectionStepText(existingOverride.directions, stepId, originalText);
          const nextOverride: RecipeOverride = {
            ...existingOverride,
            directions: nextDirections,
            directionStepOverrides: buildDirectionStepOverrides(baseRecipe.directions, nextDirections),
            updatedAt: new Date().toISOString(),
          };

          const next = [nextOverride, ...current.filter((recipe) => recipe.slug !== slug)];
          AsyncStorage.setItem(RECIPE_OVERRIDES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
    }),
    [customRecipes, lastDeletedRecipes, loaded, recipeOverrides]
  );

  return <CustomRecipesContext.Provider value={value}>{children}</CustomRecipesContext.Provider>;
}

export function useCustomRecipes() {
  const context = useContext(CustomRecipesContext);

  if (!context) {
    throw new Error('useCustomRecipes must be used inside CustomRecipesProvider');
  }

  return context;
}
