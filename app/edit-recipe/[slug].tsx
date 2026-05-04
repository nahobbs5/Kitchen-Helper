import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { useCustomRecipes } from '../../contexts/custom-recipes-context';
import { useAppSettings } from '../../contexts/settings-context';
import type { ObsidianRecipe } from '../../data/obsidian-recipes';
import { obsidianRecipeMap } from '../../data/obsidian-recipes';
import {
  allergenTagOptions,
  allergyFriendlyTagOptions,
  inferRecipeTags,
  toggleAllergenSelection,
  toggleFriendlySelection,
} from '../../utils/allergen-tags';

const categoryOptions = [
  { label: 'Appetizer', value: 'Appetizers' },
  { label: 'Breakfast', value: 'Breakfast' },
  { label: 'Side', value: 'Side' },
  { label: 'Entree', value: 'Entree' },
  { label: 'Dessert', value: 'Dessert' },
] as const;

function sectionText(items: { items: string[] }[]) {
  return items.flatMap((section) => section.items).join('\n');
}

type EditableRecipe = (ObsidianRecipe & {
  notes: string | null;
  cuisineRegion: string | null;
  sourceInfo: import('../../contexts/custom-recipes-context').RecipeSource;
}) | import('../../contexts/custom-recipes-context').UserRecipe;

export default function EditRecipeScreen() {
  const { slug, source } = useLocalSearchParams<{ slug: string; source?: 'custom' | 'obsidian' }>();
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;
  const normalizedSource = Array.isArray(source) ? source[0] : source;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { confirmDeleteEnabled, palette } = useAppSettings();
  const { customRecipeMap, deleteRecipe, recipeOverrideMap, loaded, updateRecipe } = useCustomRecipes();
  const customRecipe = normalizedSlug ? customRecipeMap[normalizedSlug] : undefined;
  const obsidianRecipe = normalizedSlug ? obsidianRecipeMap[normalizedSlug] : undefined;
  const override = normalizedSlug ? recipeOverrideMap[normalizedSlug] : undefined;
  const effectiveSource: 'custom' | 'obsidian' = normalizedSource === 'obsidian' ? 'obsidian' : 'custom';
  const recipe: EditableRecipe | undefined = useMemo(() => {
    if (effectiveSource === 'custom') {
      return customRecipe;
    }

    if (!obsidianRecipe || override?.deleted) {
      return undefined;
    }

    return {
      ...obsidianRecipe,
      title: override?.title ?? obsidianRecipe.title,
      category: override?.category ?? obsidianRecipe.category,
      ingredients: override?.ingredients ?? obsidianRecipe.ingredients,
      directions: override?.directions ?? obsidianRecipe.directions,
      notes: override?.notes ?? null,
      cuisineRegion: override?.cuisineRegion ?? null,
      sourceInfo: override?.sourceInfo ?? null,
    };
  }, [customRecipe, effectiveSource, obsidianRecipe, override]);

  const [category, setCategory] = useState<string>(recipe?.category ?? 'Entree');
  const [recipeName, setRecipeName] = useState(recipe?.title ?? '');
  const [ingredients, setIngredients] = useState(recipe ? sectionText(recipe.ingredients) : '');
  const [directions, setDirections] = useState(recipe ? sectionText(recipe.directions) : '');
  const [notes, setNotes] = useState(recipe?.notes ?? '');
  const [cuisineRegion, setCuisineRegion] = useState(recipe?.cuisineRegion ?? '');
  const [allergenTags, setAllergenTags] = useState<string[]>(recipe?.allergenTags ?? []);
  const [allergyFriendlyTags, setAllergyFriendlyTags] = useState<string[]>(recipe?.allergyFriendlyTags ?? []);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const detectedTags = useMemo(
    () =>
      inferRecipeTags({
        title: recipeName,
        ingredientsText: ingredients,
        directionsText: directions,
        notes,
      }),
    [directions, ingredients, notes, recipeName]
  );

  useEffect(() => {
    if (!recipe) {
      return;
    }

    setCategory(recipe.category ?? 'Entree');
    setRecipeName(recipe.title);
    setIngredients(sectionText(recipe.ingredients));
    setDirections(sectionText(recipe.directions));
    setNotes(recipe.notes ?? '');
    setCuisineRegion(recipe.cuisineRegion ?? '');
    setAllergenTags(recipe.allergenTags ?? []);
    setAllergyFriendlyTags(recipe.allergyFriendlyTags ?? []);
  }, [recipe]);

  const missingRequiredFields = useMemo(
    () =>
      [
        !recipeName.trim() ? 'recipe name' : null,
        !ingredients.trim() ? 'ingredients' : null,
        !directions.trim() ? 'directions' : null,
      ].filter(Boolean) as string[],
    [directions, ingredients, recipeName]
  );

  const canSave = missingRequiredFields.length === 0;

  async function handleSave() {
    setSaveAttempted(true);

    if (!canSave || !normalizedSlug) {
      return;
    }

    const saved = await updateRecipe(normalizedSlug, {
      category,
      title: recipeName,
      ingredientsText: ingredients,
      directionsText: directions,
      notes,
      cuisineRegion,
      sourceInfo: recipe?.sourceInfo ?? null,
      allergenTags,
      allergyFriendlyTags,
    }, effectiveSource);

    if (saved) {
      router.replace({
        pathname: effectiveSource === 'custom' ? '/user-recipes/[slug]' : '/recipes/[slug]',
        params: { slug: normalizedSlug },
      });
    }
  }

  async function handleDelete() {
    if (!normalizedSlug) {
      return;
    }

    await deleteRecipe(normalizedSlug, effectiveSource);
    router.replace('/my-recipes');
  }

  function handleDeletePress() {
    if (!confirmDeleteEnabled) {
      void handleDelete();
      return;
    }

    setShowDeleteConfirm((current) => !current);
  }

  function handleAllergenToggle(tag: (typeof allergenTagOptions)[number]) {
    const next = toggleAllergenSelection(allergenTags, allergyFriendlyTags, tag);
    setAllergenTags(next.allergenTags);
    setAllergyFriendlyTags(next.allergyFriendlyTags);
  }

  function handleFriendlyToggle(tag: (typeof allergyFriendlyTagOptions)[number]) {
    const next = toggleFriendlySelection(allergenTags, allergyFriendlyTags, tag);
    setAllergenTags(next.allergenTags);
    setAllergyFriendlyTags(next.allergyFriendlyTags);
  }

  function handleAutoDetectTags() {
    setAllergenTags(detectedTags.allergenTags);
    setAllergyFriendlyTags(detectedTags.allergyFriendlyTags);
  }

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: 'Loading recipe' }} />
        <ScrollView contentContainerStyle={styles.page}>
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Loading</Text>
            <Text style={[styles.panelTitle, { color: palette.text }]}>Opening recipe editor</Text>
            <Text style={[styles.panelText, { color: palette.textMuted }]}>
              Local app recipes are still loading from storage.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!recipe || !normalizedSlug) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: 'Recipe not found' }} />
        <ScrollView contentContainerStyle={styles.page}>
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Missing recipe</Text>
            <Text style={[styles.panelTitle, { color: palette.text }]}>We could not open that editor</Text>
            <Text style={[styles.panelText, { color: palette.textMuted }]}>
              The saved recipe could not be found in local app storage.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ title: `Edit ${recipe.title}` }} />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>Recipe form</Text>
            <Text style={[styles.title, { color: palette.text }]}>Edit saved recipe</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This editor updates the version of the recipe stored in local app storage. Required
              fields stay marked with `*`.
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() =>
                  router.replace({
                    pathname: effectiveSource === 'custom' ? '/user-recipes/[slug]' : '/recipes/[slug]',
                    params: { slug: normalizedSlug },
                  })
                }
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                  Back to Recipe
                </Text>
              </Pressable>
            </View>

          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Editing mode</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>Update your saved version</Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              {effectiveSource === 'custom'
                ? 'Changes here update the recipe already stored inside the app.'
                : 'Changes here are saved as local app overrides, so your Obsidian note stays unchanged.'}
            </Text>
          </View>
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.primaryColumn}>
            <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Manual entry</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Recipe form</Text>

              <View style={styles.formStack}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Category *</Text>
                  <View style={styles.servingsRow}>
                    {categoryOptions.map((option) => {
                      const isActive = category === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setCategory(option.value)}
                          style={[
                            styles.servingsButton,
                            { borderColor: palette.borderAlt },
                            !isActive && { backgroundColor: palette.surface },
                            isActive && styles.servingsButtonActive,
                            isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                          ]}
                        >
                          <Text
                            style={[
                              styles.servingsButtonText,
                              { color: isActive ? palette.inverseText : palette.text },
                              isActive && styles.servingsButtonTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Recipe name *</Text>
                  <TextInput
                    value={recipeName}
                    onChangeText={setRecipeName}
                    placeholder="Example: Lemon Herb Roast Chicken"
                    placeholderTextColor={palette.searchPlaceholder}
                    style={[
                      styles.formInput,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                    ]}
                  />
                  {saveAttempted && !recipeName.trim() ? (
                    <Text style={[styles.formHint, { color: palette.accent }]}>Recipe name is required.</Text>
                  ) : null}
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Cuisine region</Text>
                  <TextInput
                    value={cuisineRegion}
                    onChangeText={setCuisineRegion}
                    placeholder="Optional cuisine region"
                    placeholderTextColor={palette.searchPlaceholder}
                    style={[
                      styles.formInput,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                    ]}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Ingredients *</Text>
                  <TextInput
                    value={ingredients}
                    onChangeText={setIngredients}
                    placeholderTextColor={palette.searchPlaceholder}
                    multiline
                    style={[
                      styles.formInput,
                      styles.formTextArea,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                    ]}
                  />
                  {saveAttempted && !ingredients.trim() ? (
                    <Text style={[styles.formHint, { color: palette.accent }]}>Ingredients are required.</Text>
                  ) : null}
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Directions *</Text>
                  <TextInput
                    value={directions}
                    onChangeText={setDirections}
                    placeholderTextColor={palette.searchPlaceholder}
                    multiline
                    style={[
                      styles.formInput,
                      styles.formTextArea,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                    ]}
                  />
                  {saveAttempted && !directions.trim() ? (
                    <Text style={[styles.formHint, { color: palette.accent }]}>Directions are required.</Text>
                  ) : null}
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Notes</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Optional notes, substitutions, or reminders"
                    placeholderTextColor={palette.searchPlaceholder}
                    multiline
                    style={[
                      styles.formInput,
                      styles.formTextArea,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                    ]}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Allergy-friendly tags</Text>
                  <Text style={[styles.formHint, { color: palette.textSoft }]}>
                    These can be auto-detected from the recipe text and then edited manually.
                  </Text>
                  <View style={styles.tagRow}>
                    {allergyFriendlyTagOptions.map((tag) => {
                      const isActive = allergyFriendlyTags.includes(tag);

                      return (
                        <Pressable
                          key={tag}
                          onPress={() => handleFriendlyToggle(tag)}
                          style={[
                            styles.servingsButton,
                            { borderColor: palette.borderAlt, backgroundColor: palette.surface },
                            isActive && styles.selectableAllergyFriendlyTag,
                            isActive && { borderColor: '#97bf72' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.servingsButtonText,
                              { color: palette.text },
                              isActive && styles.selectableAllergyFriendlyTagText,
                            ]}
                          >
                            {tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={handleAutoDetectTags}
                      style={[
                        styles.secondaryButton,
                        { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                      ]}
                    >
                      <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Auto-detect tags</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Allergen tags</Text>
                  <View style={styles.tagRow}>
                    {allergenTagOptions.map((tag) => {
                      const isActive = allergenTags.includes(tag);

                      return (
                        <Pressable
                          key={tag}
                          onPress={() => handleAllergenToggle(tag)}
                          style={[
                            styles.servingsButton,
                            { borderColor: palette.borderAlt, backgroundColor: palette.surface },
                            isActive && styles.selectableAllergenTag,
                            isActive && { borderColor: '#e98d34' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.servingsButtonText,
                              { color: palette.text },
                              isActive && styles.selectableAllergenTagText,
                            ]}
                          >
                            {tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => router.back()}
                    style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSave}
                    style={[
                      styles.primaryButton,
                      { backgroundColor: canSave ? palette.accent : palette.borderAlt },
                    ]}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>Save Changes</Text>
                  </Pressable>
                  <Pressable onPress={handleDeletePress} style={styles.dangerButton}>
                    <Text style={styles.dangerButtonText}>🗑 Delete Recipe</Text>
                  </Pressable>
                </View>
                {showDeleteConfirm ? (
                  <View
                    style={[
                      styles.dangerCard,
                      { backgroundColor: palette.elevatedAlt, borderColor: '#d47a5b' },
                    ]}
                  >
                    <Text style={[styles.dangerCardTitle, { color: palette.text }]}>
                      Delete {recipe.title}?
                    </Text>
                    <Text style={[styles.dangerCardBody, { color: palette.textMuted }]}>
                      {effectiveSource === 'custom'
                        ? 'This removes the recipe from local app storage and returns you to `My Recipes`.'
                        : 'This hides the imported recipe from the app library and returns you to `My Recipes`. The original Obsidian note is not deleted.'}
                    </Text>
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => setShowDeleteConfirm(false)}
                        style={[
                          styles.secondaryButton,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                        ]}
                      >
                        <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={handleDelete} style={styles.dangerButton}>
                        <Text style={styles.dangerButtonText}>Delete {recipe.title}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {isWide ? (
            <View style={styles.secondaryColumn}>
              <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
                <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Recipe preview</Text>
                <Text style={[styles.panelTitle, { color: palette.text }]}>Current draft</Text>

                <View style={[styles.helperCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                  <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{category}</Text>
                  <Text style={[styles.helperCardTitle, { color: palette.text }]}>
                    {recipeName.trim() || 'Recipe name will appear here'}
                  </Text>
                  <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                    {ingredients.trim()
                      ? `${ingredients.trim().split('\n').filter(Boolean).length} ingredient line(s) added`
                      : 'No ingredients entered yet'}
                  </Text>
                  <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                    {directions.trim()
                      ? `${directions.trim().split('\n').filter(Boolean).length} direction line(s) added`
                      : 'No directions entered yet'}
                  </Text>
                  {cuisineRegion.trim() ? (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      Cuisine region: {cuisineRegion.trim()}
                    </Text>
                  ) : (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>No cuisine region added</Text>
                  )}
                  {recipe.sourceInfo?.websiteName ? (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      Website: {recipe.sourceInfo.websiteName}
                    </Text>
                  ) : null}
                  {recipe.sourceInfo?.author ? (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      Author: {recipe.sourceInfo.author}
                    </Text>
                  ) : null}
                  {recipe.sourceInfo?.url ? (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      Source: {recipe.sourceInfo.url}
                    </Text>
                  ) : null}
                  {allergenTags.length > 0 ? (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      Allergens: {allergenTags.join(', ')}
                    </Text>
                  ) : null}
                  {allergyFriendlyTags.length > 0 ? (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      Allergy-friendly: {allergyFriendlyTags.join(', ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
