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

const previewServingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export default function RecipeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [servings, setServings] = useState(baseServings);

  const scaledIngredients = useMemo(() => {
    const multiplier = servings / baseServings;

    return baseIngredients.map((ingredient) => ({
      ...ingredient,
      amount: ingredient.amount * multiplier,
    }));
  }, [servings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Recipe route</Text>
            <Text style={styles.title}>Creamy Spinach Pasta</Text>
            <Text style={styles.subtitle}>
              This page is now its own route, which is exactly why Expo Router is useful. We can
              treat recipe viewing as a real screen instead of a block inside one giant component.
            </Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroCardLabel}>Scaling demo</Text>
            <Text style={styles.heroCardTitle}>Adjust servings</Text>
            <Text style={styles.heroCardText}>
              Tap a serving size to update the ingredient list below.
            </Text>

            <View style={styles.servingsRow}>
              {[2, 4, 8].map((count) => {
                const isActive = servings === count;

                return (
                  <Pressable
                    key={count}
                    onPress={() => setServings(count)}
                    style={[styles.servingsButton, isActive && styles.servingsButtonActive]}
                  >
                    <Text
                      style={[
                        styles.servingsButtonText,
                        isActive && styles.servingsButtonTextActive,
                      ]}
                    >
                      {count} servings
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.heroCardLabel}>Custom servings</Text>
            <View style={styles.numberGrid}>
              {previewServingOptions.map((count) => {
                const isActive = servings === count;

                return (
                  <Pressable
                    key={`preview-${count}`}
                    onPress={() => setServings(count)}
                    style={[styles.numberButton, isActive && styles.numberButtonActive]}
                  >
                    <Text style={styles.numberButtonText}>{count}</Text>
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
              <Text style={styles.panelTitle}>Scaled in real time</Text>
              <View style={styles.ingredientList}>
                {scaledIngredients.map((ingredient) => (
                  <View key={ingredient.name} style={styles.ingredientRow}>
                    <View>
                      <Text style={styles.ingredientAmount}>
                        {formatAmount(ingredient.amount)} {ingredient.unit}
                      </Text>
                      <Text style={styles.ingredientName}>{ingredient.name}</Text>
                    </View>
                    {ingredient.note ? <Text style={styles.ingredientNote}>{ingredient.note}</Text> : null}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>Substitutions</Text>
              <Text style={styles.panelTitle}>Helpful swaps with context</Text>
              <View style={styles.cardStack}>
                {substitutions.map((substitute) => (
                  <View key={substitute.ingredient} style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>{substitute.ingredient}</Text>
                    <Text style={styles.infoCardSwap}>{substitute.swap}</Text>
                    <Text style={styles.infoCardMeta}>{substitute.ratio}</Text>
                    <Text style={styles.infoCardBody}>{substitute.note}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.secondaryColumn}>
            <View style={styles.panelAlt}>
              <Text style={styles.panelEyebrow}>Conversions</Text>
              <Text style={styles.panelTitle}>Quick kitchen references</Text>
              <View style={styles.conversionList}>
                {conversions.map((conversion) => (
                  <View key={conversion.from} style={styles.conversionRow}>
                    <Text style={styles.conversionFrom}>{conversion.from}</Text>
                    <Text style={styles.conversionArrow}>to {conversion.to}</Text>
                    <Text style={styles.conversionResult}>{conversion.result}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.panelDark}>
              <Text style={styles.panelDarkEyebrow}>Why this screen matters</Text>
              <Text style={styles.panelDarkTitle}>Recipe pages can grow independently</Text>
              <Text style={styles.panelDarkText}>
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
