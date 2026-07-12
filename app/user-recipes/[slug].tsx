import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { CopiedToast, useCopiedToast } from '../../components/copied-toast';
import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { DeleteIcon } from '../../components/delete-icon';
import { EditIcon } from '../../components/edit-icon';
import { RecipeShareCard, recipeShareCardWidth } from '../../components/recipe-share-card';
import { RecipeDirectionsList, ScaledDirectionsList } from '../../components/scaled-directions-list';
import { ShareIcon } from '../../components/share-icon';
import { useCustomRecipes } from '../../contexts/custom-recipes-context';
import { useFavorites } from '../../contexts/favorites-context';
import { useRatings } from '../../contexts/ratings-context';
import { StarRating } from '../../components/star-rating';
import { useAppSettings } from '../../contexts/settings-context';
import { formatIngredientsText, shareRecipe, type ExportRecipe } from '../../utils/export-recipes';
import { extractBaseServings, formatScaleLabel, scaleIngredientLine } from '../../utils/ingredient-scaling';
import { formatCookTimeTag } from '../../utils/recipe-metadata';

const fractionalPresets = [0.25, 0.5] as const;
const servingTargets = [2, 4, 8] as const;
const customServingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export default function UserRecipeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { confirmDeleteEnabled, palette, showRatingsInCardExports } = useAppSettings();
  const { customRecipeMap, deleteRecipe, loaded } = useCustomRecipes();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getRating, setRating } = useRatings();
  const shareCardRef = useRef<View>(null);

  function handleShare() {
    if (!exportRecipe) return;
    void shareRecipe(exportRecipe, shareCardRef);
  }
  const [multiplier, setMultiplier] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;
  const recipe = normalizedSlug ? customRecipeMap[normalizedSlug] : undefined;
  const headerTitle = isWide ? `My Recipes / ${recipe?.title ?? 'Recipe'}` : recipe?.title ?? 'Recipe';

  const servingButtons = useMemo(
    () => [
      { key: 'original', label: 'Original', multiplier: 1 },
      ...fractionalPresets.map((value) => ({
        key: `fraction-${value}`,
        label: value === 0.5 ? '1/2x' : '1/4x',
        multiplier: value,
      })),
      ...servingTargets.map((value) => ({
        key: `multiplier-${value}`,
        label: `${value}x`,
        multiplier: value,
      })),
    ],
    []
  );
  const visibleServingButtons = isWide
    ? servingButtons
    : servingButtons.filter((button) => button.multiplier < 1 || button.multiplier === 1);
  const visibleCustomServingOptions = isWide
    ? customServingOptions
    : customServingOptions.filter((value) => value !== 1);

  const scaledIngredients = useMemo(() => {
    if (!recipe) {
      return [];
    }

    return recipe.ingredients.map((section) => ({
      ...section,
      items: section.items.map((item) => scaleIngredientLine(item, multiplier)),
    }));
  }, [multiplier, recipe]);

  const copiedToast = useCopiedToast();
  const copyIngredients = () => {
    const text = formatIngredientsText(scaledIngredients);
    if (!text) return;
    Clipboard.setStringAsync(text);
    copiedToast.show();
  };

  const scaledServingsLabel = useMemo(() => {
    if (!recipe?.servings) return null;
    if (multiplier === 1) return recipe.servings;
    const base = extractBaseServings(recipe.servings);
    if (base === null) return recipe.servings;
    return String(Math.round(base * multiplier));
  }, [recipe?.servings, multiplier]);

  const isOriginalScale = Math.abs(multiplier - 1) < 0.001;

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
      servings: scaledServingsLabel,
      allergyFriendlyTags: recipe.allergyFriendlyTags,
      allergenTags: recipe.allergenTags,
      ingredients: scaledIngredients,
      directions: recipe.directions,
      notes: recipe.notes,
      sourceInfo: recipe.sourceInfo,
      rating: showRatingsInCardExports ? getRating(recipe.slug) : null,
      scaleNote: isOriginalScale
        ? null
        : `Scaled to ${formatScaleLabel(multiplier)} — ingredient amounts adjusted from the original.`,
    }
    : null;

  async function handleDelete() {
    if (!recipe) {
      return;
    }

    await deleteRecipe(recipe.slug);
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

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: 'Loading recipe' }} />
        <ScrollView contentContainerStyle={styles.page}>
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Loading</Text>
            <Text style={[styles.panelTitle, { color: palette.text }]}>Opening saved recipe</Text>
            <Text style={[styles.panelText, { color: palette.textMuted }]}>
              Local app recipes are still loading from storage.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: 'Recipe not found' }} />
        <ScrollView contentContainerStyle={styles.page}>
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Missing recipe</Text>
            <Text style={[styles.panelTitle, { color: palette.text }]}>We could not find that saved recipe</Text>
            <Text style={[styles.panelText, { color: palette.textMuted }]}>
              That recipe may have been removed from local app storage.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const syncStatusLabel =
    recipe.syncStatus === 'synced' ? 'Synced across devices' : 'Saved locally';

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
                accessibilityLabel="Share recipe"
                onPress={handleShare}
                style={[styles.starButton, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}
              >
                <ShareIcon color={palette.accentText} />
              </Pressable>
              <Pressable
                accessibilityLabel={isFavorite(recipe.slug) ? 'Remove from favorites' : 'Add to favorites'}
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
              <Pressable
                accessibilityLabel="Edit recipe"
                onPress={() => router.push({ pathname: '/edit-recipe/[slug]', params: { slug: recipe.slug } })}
                style={[styles.starButton, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}
              >
                <EditIcon color={palette.accentText} />
              </Pressable>
              <Pressable
                accessibilityLabel="Delete recipe"
                onPress={handleDeletePress}
                style={[styles.starButton, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}
              >
                <DeleteIcon color="#a33821" />
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
                  This removes the recipe from local app storage. You can cancel if you want to keep it.
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
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                <Text style={[styles.tagText, { color: palette.tagText }]}>{syncStatusLabel}</Text>
              </View>
              {recipe.cuisineRegion ? (
                <View style={styles.cuisineTag}>
                  <Text style={styles.cuisineTagText}>{recipe.cuisineRegion}</Text>
                </View>
              ) : null}
              {recipe.prepTime ? (
                <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                  <Text style={[styles.tagText, { color: palette.tagText }]}>Prep: {recipe.prepTime}</Text>
                </View>
              ) : null}
              {recipe.cookTime ? (
                <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                  <Text style={[styles.tagText, { color: palette.tagText }]}>
                    {formatCookTimeTag(recipe, recipe.cookTime)}
                  </Text>
                </View>
              ) : null}
              {scaledServingsLabel ? (
                <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                  <Text style={[styles.tagText, { color: palette.tagText }]}>Serves: {scaledServingsLabel}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.recipeRatingRow}>
              <StarRating
                value={getRating(recipe.slug)}
                onRate={(next) => setRating(recipe.slug, next)}
              />
            </View>
          </View>

          <View
            style={[
              styles.heroCard,
              !isWide && styles.recipeServingControlsCardMobile,
              isWide && styles.recipeServingControlsCardWide,
              { backgroundColor: palette.elevatedDark },
            ]}
          >
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Serving controls</Text>
            <View style={[styles.numberGrid, !isWide && styles.servingControlsNumberGridMobile]}>
              {visibleServingButtons.map((button) => {
                const isActive = Math.abs(multiplier - button.multiplier) < 0.001;

                return (
                  <Pressable
                    key={button.key}
                    onPress={() => setMultiplier(button.multiplier)}
                    style={[
                      styles.numberButton,
                      { borderColor: palette.borderAlt },
                      !isActive && { backgroundColor: palette.surface },
                      isActive && styles.numberButtonActive,
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.numberButtonText,
                        { color: palette.text },
                      ]}
                    >
                      {button.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isWide ? (
              <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Custom multiplier</Text>
            ) : null}
            <View style={[styles.numberGrid, !isWide && styles.servingControlsNumberGridMobile]}>
              {visibleCustomServingOptions.map((value) => {
                const isActive = Math.abs(multiplier - value) < 0.001;

                return (
                  <Pressable
                    key={`custom-${value}`}
                    onPress={() => setMultiplier(value)}
                    style={[
                      styles.numberButton,
                      !isWide && styles.customMultiplierButtonMobile,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                      isActive && styles.numberButtonActive,
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text style={[styles.numberButtonText, { color: palette.text }]}>{value}x</Text>
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
                      style={styles.recipeFlatGroup}
                    >
                      {section.title ? <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{section.title}</Text> : null}
                      {section.items.map((item) => (
                        <Pressable
                          key={item}
                          onLongPress={copyIngredients}
                          delayLongPress={400}
                        >
                          <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                            - {item}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ))
                ) : (
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>No ingredients were saved.</Text>
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
                  emptyMessage="No directions were saved."
                  recipeName={recipe.title}
                />
              ) : (
                <ScaledDirectionsList
                  baseDirections={recipe.originalDirections}
                  displayDirections={recipe.directions}
                  stepOverrides={recipe.directionStepOverrides}
                  scale={multiplier}
                  palette={palette}
                  emptyMessage="No directions were saved."
                  recipeName={recipe.title}
                />
              )}
            </View>

            {(recipe.notes || recipe.cuisineRegion) ? (
              <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
                <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Notes</Text>
                <View style={styles.listStack}>
                  <View style={styles.recipeFlatGroup}>
                    {recipe.cuisineRegion ? (
                      <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                        Cuisine region: {recipe.cuisineRegion}
                      </Text>
                    ) : null}
                    {recipe.notes ? (
                      <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{recipe.notes}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            ) : null}

            {recipe.sourceInfo?.url ? (
              <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
                <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                  Source:{' '}
                  <Text
                    onPress={() => Linking.openURL(recipe.sourceInfo!.url!)}
                    style={{ color: palette.accentText, textDecorationLine: 'underline' }}
                  >
                    {recipe.sourceInfo.url}
                  </Text>
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
      <CopiedToast visible={copiedToast.visible} opacity={copiedToast.opacity} />
    </SafeAreaView>
  );
}
