import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { ReferenceNav } from '../../components/reference-nav';
import { useCustomRecipes } from '../../contexts/custom-recipes-context';
import { useFavorites } from '../../contexts/favorites-context';
import { useAppSettings } from '../../contexts/settings-context';
import { scaleIngredientLine } from '../../utils/ingredient-scaling';

const fractionalPresets = [0.25, 0.5] as const;
const servingTargets = [2, 4, 8] as const;
const customServingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export default function UserRecipeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { confirmDeleteEnabled, palette } = useAppSettings();
  const { customRecipeMap, deleteRecipe, loaded } = useCustomRecipes();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [multiplier, setMultiplier] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;
  const recipe = normalizedSlug ? customRecipeMap[normalizedSlug] : undefined;

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

  const scaledIngredients = useMemo(() => {
    if (!recipe) {
      return [];
    }

    return recipe.ingredients.map((section) => ({
      ...section,
      items: section.items.map((item) => scaleIngredientLine(item, multiplier)),
    }));
  }, [multiplier, recipe]);

  function handleDelete() {
    if (!recipe) {
      return;
    }

    deleteRecipe(recipe.slug);
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
            <View style={styles.detailCardHeader}>
              <Text style={[styles.title, { color: palette.text }]}>{recipe.title}</Text>
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
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This recipe was added directly inside the app and saved into local app storage.
            </Text>
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => router.push({ pathname: '/edit-recipe/[slug]', params: { slug: recipe.slug } })}
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>✏️ Edit Recipe</Text>
              </Pressable>
              <Pressable
                onPress={handleDeletePress}
                style={styles.dangerButton}
              >
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
            <ReferenceNav />
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                <Text style={[styles.tagText, { color: palette.tagText }]}>Saved in app</Text>
              </View>
              {recipe.cuisineRegion ? (
                <View style={styles.cuisineTag}>
                  <Text style={styles.cuisineTagText}>{recipe.cuisineRegion}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Serving controls</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>Scale ingredients</Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Since this form does not ask for servings yet, these buttons act as multipliers for
              the ingredient list.
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

            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Custom multiplier</Text>
            <View style={styles.numberGrid}>
              {customServingOptions.map((value) => {
                const isActive = Math.abs(multiplier - value) < 0.001;

                return (
                  <Pressable
                    key={`custom-${value}`}
                    onPress={() => setMultiplier(value)}
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
              <Text style={[styles.panelTitle, { color: palette.text }]}>Scaled from your saved form</Text>
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
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>No ingredients were saved.</Text>
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
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>No directions were saved.</Text>
                  </View>
                )}
              </View>
            </View>

            {(recipe.notes || recipe.cuisineRegion) ? (
              <View style={[styles.panelDark, { backgroundColor: palette.elevatedDark }]}>
                <Text style={[styles.panelDarkEyebrow, { color: palette.accentSoft }]}>Recipe notes</Text>
                <Text style={[styles.panelDarkTitle, { color: palette.inverseText }]}>Saved extras</Text>
                {recipe.cuisineRegion ? (
                  <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>
                    Cuisine region: {recipe.cuisineRegion}
                  </Text>
                ) : null}
                {recipe.notes ? (
                  <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>{recipe.notes}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
