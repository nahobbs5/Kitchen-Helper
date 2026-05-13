import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { RecipeShareCard, recipeShareCardWidth } from '../../components/recipe-share-card';
import { RecipeDirectionsList, ScaledDirectionsList } from '../../components/scaled-directions-list';
import { ShareIcon } from '../../components/share-icon';
import { useCustomRecipes } from '../../contexts/custom-recipes-context';
import { useFavorites } from '../../contexts/favorites-context';
import { useAppSettings } from '../../contexts/settings-context';
import { obsidianRecipeMap } from '../../data/obsidian-recipes';
import { shareRecipe, type ExportRecipe } from '../../utils/export-recipes';
import { extractBaseServings, scaleIngredientLine } from '../../utils/ingredient-scaling';
import { formatCookTimeTag } from '../../utils/recipe-metadata';

const fractionalPresets = [0.25, 0.5] as const;
const servingTargets = [2, 4, 8] as const;
const customServingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export default function ObsidianRecipeScreen() {
  const { origin, slug } = useLocalSearchParams<{ origin?: string; slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { confirmDeleteEnabled, palette } = useAppSettings();
  const { deleteRecipe, recipeOverrideMap } = useCustomRecipes();
  const baseRecipe = slug ? obsidianRecipeMap[slug] : undefined;
  const override = slug ? recipeOverrideMap[slug] : undefined;
  const recipe = baseRecipe && !override?.deleted
    ? {
        ...baseRecipe,
        title: override?.title ?? baseRecipe.title,
        category: override?.category ?? baseRecipe.category,
        allergyFriendlyTags: override?.allergyFriendlyTags ?? baseRecipe.allergyFriendlyTags,
        allergenTags: override?.allergenTags ?? baseRecipe.allergenTags,
        prepTime: override?.prepTime ?? baseRecipe.prepTime,
        cookTime: override?.cookTime ?? baseRecipe.cookTime,
        servings: override?.servings ?? baseRecipe.servings,
        ingredients: override?.ingredients ?? baseRecipe.ingredients,
        directions: override?.directions ?? baseRecipe.directions,
        notes: override ? override.notes : baseRecipe.notes,
        cuisineRegion: override?.cuisineRegion ?? null,
        sourceInfo: override?.sourceInfo ?? null,
      }
    : undefined;
  const [multiplier, setMultiplier] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const shareCardRef = useRef<View>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const parentLabel = origin === 'my-recipes' ? 'My Recipes' : 'Sample Recipes';
  const headerTitle = isWide ? `${parentLabel} / ${recipe?.title ?? 'Recipe'}` : recipe?.title ?? 'Recipe';

  async function handleDelete() {
    if (!recipe) {
      return;
    }

    await deleteRecipe(recipe.slug, 'obsidian');
    router.replace('/my-recipes');
  }

  function handleDeletePress() {
    if (!recipe) {
      return;
    }

    if (!confirmDeleteEnabled) {
      void handleDelete();
      return;
    }

    setShowDeleteConfirm((current) => !current);
  }

  function handleShare() {
    if (!exportRecipe) return;
    void shareRecipe(exportRecipe, shareCardRef);
  }

  const exportRecipe: ExportRecipe | null = recipe
    ? {
      slug: recipe.slug,
      title: recipe.title,
      category: recipe.category,
      sourceLabel: recipe.source,
      cuisineRegion: recipe.cuisineRegion,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      servings: recipe.servings,
      allergyFriendlyTags: recipe.allergyFriendlyTags,
      allergenTags: recipe.allergenTags,
      ingredients: recipe.ingredients,
      directions: recipe.directions,
      notes: recipe.notes,
      sourceInfo: recipe.sourceInfo,
    }
    : null;

  const baseServings = useMemo(() => extractBaseServings(recipe?.servings ?? null), [recipe?.servings]);

  const servingButtons = useMemo(() => {
    const buttons = [
      { key: 'original', label: 'Original', multiplier: 1 },
      ...fractionalPresets.map((value) => ({
        key: `fraction-${value}`,
        label: value === 0.5 ? '1/2x' : '1/4x',
        multiplier: value,
      })),
    ];

    if (baseServings) {
      buttons.push(
        ...servingTargets.map((value) => ({
          key: `servings-${value}`,
          label: `${value}`,
          multiplier: value / baseServings,
        }))
      );
    } else {
      buttons.push(
        ...servingTargets.map((value) => ({
          key: `multiplier-${value}`,
          label: `${value}x`,
          multiplier: value,
        }))
      );
    }

    return buttons;
  }, [baseServings]);

  const scaledIngredients = useMemo(() => {
    if (!recipe) {
      return [];
    }

    return recipe.ingredients.map((section) => ({
      ...section,
      items: section.items.map((item) => scaleIngredientLine(item, multiplier)),
    }));
  }, [multiplier, recipe]);

  const customLabel = baseServings ? 'Custom servings' : 'Custom multiplier';
  const isOriginalScale = Math.abs(multiplier - 1) < 0.001;

  if (!recipe) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: 'Recipe not found' }} />
        <ScrollView contentContainerStyle={styles.page}>
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Missing recipe</Text>
            <Text style={[styles.panelTitle, { color: palette.text }]}>We could not find that recipe</Text>
            <Text style={[styles.panelText, { color: palette.textMuted }]}>
              The route did not match a generated Obsidian recipe. Running `corepack pnpm
              sync:recipes` will refresh the app data after recipe files change.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ title: headerTitle }} />
      {exportRecipe ? (
        <View
          pointerEvents="none"
          style={{
            left: -10000,
            position: 'absolute',
            top: 0,
            width: recipeShareCardWidth,
          }}
        >
          <View ref={shareCardRef} collapsable={false}>
            <RecipeShareCard recipe={exportRecipe} />
          </View>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.page}>
        <View
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>{recipe.category}</Text>
            <Text style={[styles.title, { color: palette.text }]}>{recipe.title}</Text>
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleShare}
                style={[styles.starButton, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}
              >
                <ShareIcon color={palette.accentText} />
              </Pressable>
              <Pressable
                onPress={() => toggleFavorite(recipe.slug)}
                style={[
                  styles.starButton,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  isFavorite(recipe.slug) && styles.starButtonActive,
                ]}
              >
                <Text style={[styles.starButtonText, { color: palette.accentText }]}>
                  {isFavorite(recipe.slug) ? '★' : '☆'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/edit-recipe/[slug]',
                    params: { slug: recipe.slug, source: 'obsidian' },
                  })
                }
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>✏️ Edit Recipe</Text>
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
                <Text style={[styles.dangerCardTitle, { color: palette.text }]}>Delete {recipe.title}?</Text>
                <Text style={[styles.dangerCardBody, { color: palette.textMuted }]}>
                  This hides the imported recipe from the app library. The original Obsidian note is not deleted.
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
            {recipe.cuisineRegion ? (
              <View style={styles.tagRow}>
                <View style={styles.cuisineTag}>
                  <Text style={styles.cuisineTagText}>{recipe.cuisineRegion}</Text>
                </View>
              </View>
            ) : null}
            {recipe.allergyFriendlyTags.length > 0 ? (
              <View style={styles.tagRow}>
                {recipe.allergyFriendlyTags.map((tag) => (
                  <View key={tag} style={styles.allergyFriendlyTag}>
                    <Text style={styles.allergyFriendlyTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {recipe.allergenTags.length > 0 ? (
              <View style={styles.tagRow}>
                {recipe.allergenTags.map((tag) => (
                  <View key={tag} style={styles.allergenTag}>
                    <Text style={styles.allergenTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {recipe.prepTime || recipe.cookTime || recipe.totalTime || recipe.servings ? (
              <View style={styles.tagRow}>
                {recipe.prepTime ? (
                  <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                    <Text style={[styles.tagText, { color: palette.tagText }]}>Prep: {recipe.prepTime}</Text>
                  </View>
                ) : null}
                {recipe.cookTime ? (
                  <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                    <Text style={[styles.tagText, { color: palette.tagText }]}>
                      {formatCookTimeTag(recipe.category, recipe.cookTime)}
                    </Text>
                  </View>
                ) : null}
                {recipe.totalTime ? (
                  <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                    <Text style={[styles.tagText, { color: palette.tagText }]}>Total: {recipe.totalTime}</Text>
                  </View>
                ) : null}
                {recipe.servings ? (
                  <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                    <Text style={[styles.tagText, { color: palette.tagText }]}>Serves: {recipe.servings}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.heroCard,
              isWide && styles.recipeServingControlsCardWide,
              { backgroundColor: palette.elevatedDark },
            ]}
          >
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Serving controls</Text>
            <View style={styles.servingsRow}>
              {servingButtons.map((button) => {
                const isActive = Math.abs(multiplier - button.multiplier) < 0.001;

                return (
                  <Pressable
                    key={button.key}
                    onPress={() => setMultiplier(button.multiplier)}
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
                      {button.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>{customLabel}</Text>
            <View style={styles.numberGrid}>
              {customServingOptions.map((value) => {
                const optionMultiplier = baseServings ? value / baseServings : value;
                const isActive = Math.abs(multiplier - optionMultiplier) < 0.001;

                return (
                  <Pressable
                    key={`custom-${value}`}
                    onPress={() => setMultiplier(optionMultiplier)}
                    style={[
                      styles.numberButton,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                      isActive && styles.numberButtonActive,
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text style={[styles.numberButtonText, { color: palette.text }]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.primaryColumn}>
            <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Ingredients</Text>
              <View style={styles.listStack}>
                {scaledIngredients.length > 0 ? (
                  scaledIngredients.map((section, index) => (
                    <View
                      key={`${section.title ?? 'ingredients'}-${index}`}
                      style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                    >
                      {section.title ? <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{section.title}</Text> : null}
                      {section.items.map((item) => (
                        <Text key={item} style={[styles.detailCardBody, { color: palette.textMuted }]}>
                          - {item}
                        </Text>
                      ))}
                    </View>
                  ))
                ) : (
                  <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                      No ingredients were detected in this note.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.secondaryColumn}>
            <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Directions</Text>
              {isOriginalScale ? (
                <RecipeDirectionsList
                  directions={recipe.directions}
                  palette={palette}
                  emptyMessage="No directions were detected in this note."
                />
              ) : (
                <ScaledDirectionsList
                  slug={recipe.slug}
                  source="obsidian"
                  baseDirections={baseRecipe?.directions ?? recipe.directions}
                  displayDirections={recipe.directions}
                  stepOverrides={override?.directionStepOverrides ?? {}}
                  scale={multiplier}
                  palette={palette}
                  emptyMessage="No directions were detected in this note."
                />
              )}
            </View>

            {recipe.notes ? (
              <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
                <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Notes</Text>
                <View style={styles.listStack}>
                  <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{recipe.notes}</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
