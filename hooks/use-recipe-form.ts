import { useEffect, useMemo, useState } from 'react';

import type { RecipeSource } from '../contexts/custom-recipes-context';
import type { RecipeSection } from '../data/obsidian-recipes';
import {
  allergenTagOptions,
  allergyFriendlyTagOptions,
  inferRecipeTags,
  toggleAllergenSelection,
  toggleFriendlySelection,
} from '../utils/allergen-tags';
import { cleanTimeValue } from '../utils/recipe-form-options';
import { extractRecipeMetadata } from '../utils/recipe-metadata';
import { formatRecipeSections, recipeSectionsHaveItems } from '../utils/recipe-sections';

export type RecipeFormValues = {
  category: string;
  recipeName: string;
  cuisineRegion: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  notes: string;
  ingredientsSections: RecipeSection[];
  directionsSections: RecipeSection[];
  allergenTags: string[];
  allergyFriendlyTags: string[];
  sourceInfo: RecipeSource;
};

export const EMPTY_RECIPE_FORM: RecipeFormValues = {
  category: 'Entree',
  recipeName: '',
  cuisineRegion: '',
  servings: '',
  prepTime: '',
  cookTime: '',
  notes: '',
  ingredientsSections: [],
  directionsSections: [],
  allergenTags: [],
  allergyFriendlyTags: [],
  sourceInfo: null,
};

export type WizardStep = 'details' | 'ingredients' | 'directions' | 'finish';
export const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'ingredients', label: 'Ingredients' },
  { key: 'directions', label: 'Directions' },
  { key: 'finish', label: 'Finish' },
];

type Options = {
  /** Keep tags in sync with detected ingredients until the user changes them (Add recipe). */
  autoDetectTags?: boolean;
};

/** Shared state and logic for the Add and Edit recipe wizards. */
export function useRecipeForm(initial: RecipeFormValues = EMPTY_RECIPE_FORM, { autoDetectTags = false }: Options = {}) {
  const [values, setValues] = useState<RecipeFormValues>(initial);
  const [tagsTouched, setTagsTouched] = useState(!autoDetectTags);

  const ingredientsText = useMemo(() => formatRecipeSections(values.ingredientsSections), [values.ingredientsSections]);
  const directionsText = useMemo(
    () => formatRecipeSections(values.directionsSections, { ordered: true }),
    [values.directionsSections]
  );

  const detectedTags = useMemo(
    () => inferRecipeTags({ title: values.recipeName, ingredientsText, directionsText, notes: values.notes }),
    [directionsText, ingredientsText, values.notes, values.recipeName]
  );

  useEffect(() => {
    if (tagsTouched) return;
    setValues((current) => ({
      ...current,
      allergenTags: detectedTags.allergenTags,
      allergyFriendlyTags: detectedTags.allergyFriendlyTags,
    }));
  }, [detectedTags, tagsTouched]);

  function set<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  /** Fill empty prep/cook/servings from "Prep: 10 min"-style lines, as the old form did. */
  function fillMetadataFrom(nextIngredients: string, nextDirections: string, nextNotes: string) {
    const extracted = extractRecipeMetadata({
      ingredientsText: nextIngredients,
      directionsText: nextDirections,
      notesText: nextNotes,
    });
    setValues((current) => ({
      ...current,
      prepTime: current.prepTime.trim() || !extracted.prepTime ? current.prepTime : extracted.prepTime,
      cookTime: current.cookTime.trim() || !extracted.cookTime ? current.cookTime : extracted.cookTime,
      servings: current.servings.trim() || !extracted.servings ? current.servings : extracted.servings,
    }));
    return extracted;
  }

  const stepErrors: Record<WizardStep, string[]> = {
    details: values.recipeName.trim() ? [] : ['Recipe name is required.'],
    ingredients: recipeSectionsHaveItems(values.ingredientsSections) ? [] : ['Add at least one ingredient.'],
    directions: recipeSectionsHaveItems(values.directionsSections) ? [] : ['Add at least one direction.'],
    finish: [],
  };
  const firstInvalidStep = WIZARD_STEPS.find((step) => stepErrors[step.key].length > 0)?.key ?? null;

  return {
    values,
    set,
    /** Replace several values at once (imports, loading a recipe to edit). */
    patch: (next: Partial<RecipeFormValues>) => setValues((current) => ({ ...current, ...next })),
    reset: (next: RecipeFormValues) => setValues(next),
    ingredientsText,
    directionsText,
    detectedTags,
    stepErrors,
    firstInvalidStep,
    canSave: firstInvalidStep === null,
    setIngredientsSections(next: RecipeSection[]) {
      fillMetadataFrom(formatRecipeSections(next), directionsText, values.notes);
      set('ingredientsSections', next);
    },
    setDirectionsSections(next: RecipeSection[]) {
      fillMetadataFrom(ingredientsText, formatRecipeSections(next, { ordered: true }), values.notes);
      set('directionsSections', next);
    },
    setNotes(next: string) {
      const extracted = fillMetadataFrom(ingredientsText, directionsText, next);
      set('notes', extracted.notesText);
    },
    toggleAllergen(tag: (typeof allergenTagOptions)[number]) {
      setTagsTouched(true);
      const next = toggleAllergenSelection(values.allergenTags, values.allergyFriendlyTags, tag);
      setValues((current) => ({ ...current, ...next }));
    },
    toggleFriendly(tag: (typeof allergyFriendlyTagOptions)[number]) {
      setTagsTouched(true);
      const next = toggleFriendlySelection(values.allergenTags, values.allergyFriendlyTags, tag);
      setValues((current) => ({ ...current, ...next }));
    },
    applyDetectedTags() {
      setTagsTouched(true);
      setValues((current) => ({
        ...current,
        allergenTags: detectedTags.allergenTags,
        allergyFriendlyTags: detectedTags.allergyFriendlyTags,
      }));
    },
    /** Imports set tags explicitly; stop auto-detect from overwriting them. */
    markTagsTouched: () => setTagsTouched(true),
    /** The input `addRecipe` / `updateRecipe` expect. */
    buildSaveInput(sourceInfo: RecipeSource = values.sourceInfo) {
      return {
        category: values.category,
        title: values.recipeName,
        ingredientsText,
        directionsText,
        ingredientsSections: values.ingredientsSections,
        directionsSections: values.directionsSections,
        prepTime: cleanTimeValue(values.prepTime),
        cookTime: cleanTimeValue(values.cookTime),
        servings: values.servings,
        notes: values.notes,
        cuisineRegion: values.cuisineRegion,
        sourceInfo,
        allergenTags: values.allergenTags,
        allergyFriendlyTags: values.allergyFriendlyTags,
      };
    },
  };
}

export type RecipeForm = ReturnType<typeof useRecipeForm>;
