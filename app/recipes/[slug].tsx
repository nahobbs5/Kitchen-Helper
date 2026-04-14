import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { ShareIcon } from '../../components/share-icon';
import { useCustomRecipes } from '../../contexts/custom-recipes-context';
import { useFavorites } from '../../contexts/favorites-context';
import { useAppSettings } from '../../contexts/settings-context';
import { obsidianRecipeMap } from '../../data/obsidian-recipes';
import { extractBaseServings, scaleIngredientLine } from '../../utils/ingredient-scaling';

const fractionalPresets = [0.25, 0.5] as const;
const servingTargets = [2, 4, 8] as const;
const customServingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export default function ObsidianRecipeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
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
        ingredients: override?.ingredients ?? baseRecipe.ingredients,
        directions: override?.directions ?? baseRecipe.directions,
        notes: override?.notes ?? null,
        cuisineRegion: override?.cuisineRegion ?? null,
      }
    : undefined;
  const [multiplier, setMultiplier] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  function handleDelete() {
    if (!recipe) {
      return;
    }

    deleteRecipe(recipe.slug, 'obsidian');
    router.replace('/my-recipes');
  }

  function handleDeletePress() {
    if (!recipe) {
      return;
    }

    if (!confirmDeleteEnabled) {
      handleDelete();
      return;
    }

    setShowDeleteConfirm((current) => !current);
  }

  function handleShare() {
    if (!recipe) return;
    const lines: string[] = [`🍽️ ${recipe.title}`];
    if (recipe.servings) lines.push(`Serves: ${recipe.servings}`);
    if (recipe.prepTime) lines.push(`Prep: ${recipe.prepTime}`);
    if (recipe.cookTime) lines.push(`Cook: ${recipe.cookTime}`);
    if (recipe.ingredients?.length) {
      lines.push('', 'Ingredients:', ...recipe.ingredients.map((i) => `• ${i}`));
    }
    if (recipe.directions?.length) {
      lines.push('', 'Directions:', ...recipe.directions.map((d, idx) => `${idx + 1}. ${d}`));
    }
    if (recipe.notes) lines.push('', `Notes: ${recipe.notes}`);
    Share.share({ title: recipe.title, message: lines.join('\n') });
  }

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
      <Stack.Screen options={{ title: recipe.title }} />
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
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This page is generated from your Obsidian Markdown note. The app is now reading the
              note structure, showing the ingredients and directions, and letting you scale the
              ingredient list.
            </Text>
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
            {recipe.servings ? (
              <View style={styles.badgeRow}>
                <Text style={[styles.badge, { backgroundColor: palette.tag, color: palette.tagText }]}>
                  {recipe.servings}
                </Text>
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
            {recipe.prepTime || recipe.cookTime || recipe.totalTime ? (
              <View style={styles.tagRow}>
                {recipe.prepTime ? (
                  <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                    <Text style={[styles.tagText, { color: palette.tagText }]}>Prep: {recipe.prepTime}</Text>
                  </View>
                ) : null}
                {recipe.cookTime ? (
                  <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                    <Text style={[styles.tagText, { color: palette.tagText }]}>Cook: {recipe.cookTime}</Text>
                  </View>
                ) : null}
                {recipe.totalTime ? (
                  <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                    <Text style={[styles.tagText, { color: palette.tagText }]}>Total: {recipe.totalTime}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Serving controls</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>
              {baseServings ? `Based on ${baseServings} servings` : 'Based on original recipe amount'}
            </Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Use 1/4x, 1/2x, or quick serving presets. When a note includes servings, the `2`,
              `4`, and `8` buttons target those serving counts. Otherwise they act as multipliers.
            </Text>

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
              <Text style={[styles.panelTitle, { color: palette.text }]}>Scaled from Markdown</Text>
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
              <Text style={[styles.panelTitle, { color: palette.text }]}>Recipe steps</Text>
              <View style={styles.listStack}>
                {recipe.directions.length > 0 ? (
                  recipe.directions.map((section, sectionIndex) => (
                    <View
                      key={`${section.title ?? 'directions'}-${sectionIndex}`}
                      style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                    >
                      {section.title ? <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{section.title}</Text> : null}
                      {section.items.map((item, itemIndex) => (
                        <Text key={`${itemIndex}-${item}`} style={[styles.detailCardBody, { color: palette.textMuted }]}>
                          {itemIndex + 1}. {item}
                        </Text>
                      ))}
                    </View>
                  ))
                ) : (
                  <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                      No directions were detected in this note.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.panelDark, { backgroundColor: palette.elevatedDark }]}>
              <Text style={[styles.panelDarkEyebrow, { color: palette.accentSoft }]}>Recipe notes</Text>
              <Text style={[styles.panelDarkTitle, { color: palette.inverseText }]}>Markdown-backed recipe</Text>
              <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>
                If you update the Markdown file, rerun `corepack pnpm sync:recipes` to regenerate
                the app data from the vault. Edits made here are stored locally in the app as
                overrides, so the original Markdown note stays untouched.
              </Text>
              {recipe.notes ? (
                <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>{recipe.notes}</Text>
              ) : null}
              {recipe.prepTime || recipe.cookTime || recipe.totalTime ? (
                <View style={styles.listStack}>
                  {recipe.prepTime ? (
                    <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>Prep time: {recipe.prepTime}</Text>
                  ) : null}
                  {recipe.cookTime ? (
                    <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>Cook time: {recipe.cookTime}</Text>
                  ) : null}
                  {recipe.totalTime ? (
                    <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>Total time: {recipe.totalTime}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
