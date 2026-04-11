import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { useFavorites } from '../../contexts/favorites-context';
import { obsidianRecipeMap } from '../../data/obsidian-recipes';
import { extractBaseServings, scaleIngredientLine } from '../../utils/ingredient-scaling';

const fractionalPresets = [0.25, 0.5] as const;
const servingTargets = [2, 4, 8] as const;
const customServingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export default function ObsidianRecipeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const recipe = slug ? obsidianRecipeMap[slug] : undefined;
  const [multiplier, setMultiplier] = useState(1);
  const { isFavorite, toggleFavorite } = useFavorites();

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
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: 'Recipe not found' }} />
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.panel}>
            <Text style={styles.panelEyebrow}>Missing recipe</Text>
            <Text style={styles.panelTitle}>We could not find that recipe</Text>
            <Text style={styles.panelText}>
              The route did not match a generated Obsidian recipe. Running `corepack pnpm
              sync:recipes` will refresh the app data after recipe files change.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: recipe.title }} />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{recipe.category}</Text>
            <View style={styles.detailCardHeader}>
              <Text style={styles.title}>{recipe.title}</Text>
              <Pressable
                onPress={() => toggleFavorite(recipe.slug)}
                style={[styles.starButton, isFavorite(recipe.slug) && styles.starButtonActive]}
              >
                <Text style={styles.starButtonText}>{isFavorite(recipe.slug) ? '★' : '☆'}</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              This page is generated from your Obsidian Markdown note. The app is now reading the
              note structure, showing the ingredients and directions, and letting you scale the
              ingredient list.
            </Text>

            {recipe.servings ? (
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>{recipe.servings}</Text>
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
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Prep: {recipe.prepTime}</Text>
                  </View>
                ) : null}
                {recipe.cookTime ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Cook: {recipe.cookTime}</Text>
                  </View>
                ) : null}
                {recipe.totalTime ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Total: {recipe.totalTime}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroCardLabel}>Serving controls</Text>
            <Text style={styles.heroCardTitle}>
              {baseServings ? `Based on ${baseServings} servings` : 'Based on original recipe amount'}
            </Text>
            <Text style={styles.heroCardText}>
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
                    style={[styles.servingsButton, isActive && styles.servingsButtonActive]}
                  >
                    <Text
                      style={[
                        styles.servingsButtonText,
                        isActive && styles.servingsButtonTextActive,
                      ]}
                    >
                      {button.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.heroCardLabel}>{customLabel}</Text>
            <View style={styles.numberGrid}>
              {customServingOptions.map((value) => {
                const optionMultiplier = baseServings ? value / baseServings : value;
                const isActive = Math.abs(multiplier - optionMultiplier) < 0.001;

                return (
                  <Pressable
                    key={`custom-${value}`}
                    onPress={() => setMultiplier(optionMultiplier)}
                    style={[styles.numberButton, isActive && styles.numberButtonActive]}
                  >
                    <Text style={styles.numberButtonText}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.primaryColumn}>
            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>Ingredients</Text>
              <Text style={styles.panelTitle}>Scaled from Markdown</Text>
              <View style={styles.listStack}>
                {scaledIngredients.length > 0 ? (
                  scaledIngredients.map((section, index) => (
                    <View key={`${section.title ?? 'ingredients'}-${index}`} style={styles.detailCard}>
                      {section.title ? <Text style={styles.detailCardMeta}>{section.title}</Text> : null}
                      {section.items.map((item) => (
                        <Text key={item} style={styles.detailCardBody}>
                          - {item}
                        </Text>
                      ))}
                    </View>
                  ))
                ) : (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardBody}>No ingredients were detected in this note.</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.secondaryColumn}>
            <View style={styles.panelAlt}>
              <Text style={styles.panelEyebrow}>Directions</Text>
              <Text style={styles.panelTitle}>Recipe steps</Text>
              <View style={styles.listStack}>
                {recipe.directions.length > 0 ? (
                  recipe.directions.map((section, sectionIndex) => (
                    <View key={`${section.title ?? 'directions'}-${sectionIndex}`} style={styles.detailCard}>
                      {section.title ? <Text style={styles.detailCardMeta}>{section.title}</Text> : null}
                      {section.items.map((item, itemIndex) => (
                        <Text key={`${itemIndex}-${item}`} style={styles.detailCardBody}>
                          {itemIndex + 1}. {item}
                        </Text>
                      ))}
                    </View>
                  ))
                ) : (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardBody}>No directions were detected in this note.</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.panelDark}>
              <Text style={styles.panelDarkEyebrow}>Recipe notes</Text>
              <Text style={styles.panelDarkTitle}>Markdown-backed recipe</Text>
              <Text style={styles.panelDarkText}>
                If you update the Markdown file, rerun `corepack pnpm sync:recipes` to regenerate
                the app data from the vault. A custom serving amount can be added later on top of
                this scaling setup.
              </Text>
              {recipe.prepTime || recipe.cookTime || recipe.totalTime ? (
                <View style={styles.listStack}>
                  {recipe.prepTime ? <Text style={styles.panelDarkText}>Prep time: {recipe.prepTime}</Text> : null}
                  {recipe.cookTime ? <Text style={styles.panelDarkText}>Cook time: {recipe.cookTime}</Text> : null}
                  {recipe.totalTime ? <Text style={styles.panelDarkText}>Total time: {recipe.totalTime}</Text> : null}
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
