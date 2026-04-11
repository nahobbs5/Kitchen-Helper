import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import {
  baseIngredients,
  baseServings,
  conversions,
  formatAmount,
  substitutions,
} from '../components/sample-data';
import { useAppSettings } from '../contexts/settings-context';

const previewServingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export default function RecipeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { openSettings, palette } = useAppSettings();
  const [servings, setServings] = useState(baseServings);

  const scaledIngredients = useMemo(() => {
    const multiplier = servings / baseServings;

    return baseIngredients.map((ingredient) => ({
      ...ingredient,
      amount: ingredient.amount * multiplier,
    }));
  }, [servings]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.page}>
        <View
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>Recipe route</Text>
            <Text style={[styles.title, { color: palette.text }]}>Creamy Spinach Pasta</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This page is now its own route, which is exactly why Expo Router is useful. We can
              treat recipe viewing as a real screen instead of a block inside one giant component.
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                onPress={openSettings}
                style={[styles.secondaryButton, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Settings</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Scaling demo</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>Adjust servings</Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Tap a serving size to update the ingredient list below.
            </Text>

            <View style={styles.servingsRow}>
              {[2, 4, 8].map((count) => {
                const isActive = servings === count;

                return (
                  <Pressable
                    key={count}
                    onPress={() => setServings(count)}
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
                      {count} servings
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Custom servings</Text>
            <View style={styles.numberGrid}>
              {previewServingOptions.map((count) => {
                const isActive = servings === count;

                return (
                  <Pressable
                    key={`preview-${count}`}
                    onPress={() => setServings(count)}
                    style={[
                      styles.numberButton,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                      isActive && styles.numberButtonActive,
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text style={[styles.numberButtonText, { color: palette.text }]}>{count}</Text>
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
              <Text style={[styles.panelTitle, { color: palette.text }]}>Scaled in real time</Text>
              <View style={styles.ingredientList}>
                {scaledIngredients.map((ingredient) => (
                  <View key={ingredient.name} style={[styles.ingredientRow, { backgroundColor: palette.surface }]}>
                    <View>
                      <Text style={[styles.ingredientAmount, { color: palette.text }]}>
                        {formatAmount(ingredient.amount)} {ingredient.unit}
                      </Text>
                      <Text style={[styles.ingredientName, { color: palette.textMuted }]}>{ingredient.name}</Text>
                    </View>
                    {ingredient.note ? <Text style={[styles.ingredientNote, { color: palette.textSoft }]}>{ingredient.note}</Text> : null}
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Substitutions</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Helpful swaps with context</Text>
              <View style={styles.cardStack}>
                {substitutions.map((substitute) => (
                  <View
                    key={substitute.ingredient}
                    style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.infoCardTitle, { color: palette.accentText }]}>{substitute.ingredient}</Text>
                    <Text style={[styles.infoCardSwap, { color: palette.text }]}>{substitute.swap}</Text>
                    <Text style={[styles.infoCardMeta, { color: palette.accentText }]}>{substitute.ratio}</Text>
                    <Text style={[styles.infoCardBody, { color: palette.textMuted }]}>{substitute.note}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.secondaryColumn}>
            <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Conversions</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Quick kitchen references</Text>
              <View style={styles.conversionList}>
                {conversions.map((conversion) => (
                  <View key={conversion.from} style={[styles.conversionRow, { backgroundColor: palette.surface }]}>
                    <Text style={[styles.conversionFrom, { color: palette.text }]}>{conversion.from}</Text>
                    <Text style={[styles.conversionArrow, { color: palette.accentText }]}>to {conversion.to}</Text>
                    <Text style={[styles.conversionResult, { color: palette.accent }]}>{conversion.result}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.panelDark, { backgroundColor: palette.elevatedDark }]}>
              <Text style={[styles.panelDarkEyebrow, { color: palette.accentSoft }]}>Why this screen matters</Text>
              <Text style={[styles.panelDarkTitle, { color: palette.inverseText }]}>
                Recipe pages can grow independently
              </Text>
              <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>
                Later, this route can add timers, cooking mode, pantry checks, and recipe notes
                without making the home screen harder to reason about.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
