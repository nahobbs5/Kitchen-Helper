import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { ReferenceNav } from '../components/reference-nav';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useAppSettings } from '../contexts/settings-context';

const categoryOptions = [
  { label: 'Appetizer', value: 'Appetizers' },
  { label: 'Breakfast', value: 'Breakfast' },
  { label: 'Side', value: 'Side' },
  { label: 'Entree', value: 'Entree' },
  { label: 'Dessert', value: 'Dessert' },
] as const;

export default function AddRecipeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const { addRecipe } = useCustomRecipes();

  const [category, setCategory] = useState<string>('Entree');
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [directions, setDirections] = useState('');
  const [notes, setNotes] = useState('');
  const [cuisineRegion, setCuisineRegion] = useState('');
  const [saveAttempted, setSaveAttempted] = useState(false);

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

  function handleSave() {
    setSaveAttempted(true);

    if (!canSave) {
      return;
    }

    addRecipe({
      category,
      title: recipeName,
      ingredientsText: ingredients,
      directionsText: directions,
      notes,
      cuisineRegion,
    });

    router.replace('/my-recipes');
  }

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
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>Recipe form</Text>
            <Text style={[styles.title, { color: palette.text }]}>Add a new recipe</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This is the first step toward adding recipes inside the app. For now, it is a clean
              manual-entry form. Later we can turn this into a choice screen for manual entry,
              importing, or pulling from existing files.
            </Text>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => router.push('/my-recipes')}
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
              >
              <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                  Back to My Recipes
              </Text>
            </Pressable>
          </View>

            <ReferenceNav />
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>What this form covers</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>Core recipe details first</Text>
              <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              This first version covers the required fields you called out: category, recipe name,
              ingredients, and directions. Notes are optional, and cuisine-region tagging can be
              layered in next.
            </Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Required fields are marked with `*`.
            </Text>

            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                <Text style={[styles.tagText, { color: palette.tagText }]}>Required: category</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                <Text style={[styles.tagText, { color: palette.tagText }]}>Required: name</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                <Text style={[styles.tagText, { color: palette.tagText }]}>Required: ingredients</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                <Text style={[styles.tagText, { color: palette.tagText }]}>Required: directions</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                <Text style={[styles.tagText, { color: palette.tagText }]}>Optional: notes</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                <Text style={[styles.tagText, { color: palette.tagText }]}>Optional: cuisine region</Text>
              </View>
            </View>
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
                  <Text style={[styles.formHint, { color: palette.textSoft }]}>
                    Choose the main shelf this recipe belongs in.
                  </Text>
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
                  <Text style={[styles.formHint, { color: palette.textSoft }]}>
                    Optional examples: American, European, Asian, Mexican, Mediterranean
                  </Text>
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
                  <Text style={[styles.formHint, { color: palette.textSoft }]}>
                    One ingredient per line works best for a future parser.
                  </Text>
                  <TextInput
                    value={ingredients}
                    onChangeText={setIngredients}
                    placeholder={'2 cups flour\n1 teaspoon salt\n1/2 cup butter'}
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
                  <Text style={[styles.formHint, { color: palette.textSoft }]}>
                    Step-by-step instructions can be entered as plain text for now.
                  </Text>
                  <TextInput
                    value={directions}
                    onChangeText={setDirections}
                    placeholder={'1. Preheat the oven.\n2. Mix the ingredients.\n3. Bake until golden.'}
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
                  <Text style={[styles.formHint, { color: palette.textSoft }]}>Optional notes, tips, or serving reminders.</Text>
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
                    <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>Save Recipe</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.secondaryColumn}>
            <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Draft preview</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>What the form currently has</Text>

              <View
                style={[styles.helperCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
              >
                <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{category}</Text>
                <Text style={[styles.helperCardTitle, { color: palette.text }]}>
                  {recipeName.trim() || 'Recipe name will appear here'}
                </Text>
                <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                  {ingredients.trim()
                    ? `${ingredients
                        .trim()
                        .split('\n')
                        .filter(Boolean).length} ingredient line(s) added`
                    : 'No ingredients entered yet'}
                </Text>
                <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                  {directions.trim()
                    ? `${directions
                        .trim()
                        .split('\n')
                        .filter(Boolean).length} direction line(s) added`
                    : 'No directions entered yet'}
                </Text>
                {notes.trim() ? (
                  <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>Notes included</Text>
                ) : (
                  <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>No notes added</Text>
                )}
                {cuisineRegion.trim() ? (
                  <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                    Cuisine region: {cuisineRegion.trim()}
                  </Text>
                ) : (
                  <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>No cuisine region added</Text>
                )}
              </View>

              <View
                style={[styles.helperCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
              >
                <Text style={[styles.helperCardTitle, { color: palette.text }]}>How save works right now</Text>
                <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                  Saving now writes the recipe into local app storage and sends you back to `My
                  Recipes`, where the new recipe will appear in the shared library.
                </Text>
              </View>
            </View>

            <View style={[styles.panelDark, { backgroundColor: palette.elevatedDark }]}>
              <Text style={[styles.panelDarkEyebrow, { color: palette.accentSoft }]}>Optional metadata</Text>
              <Text style={[styles.panelDarkTitle, { color: palette.inverseText }]}>Cuisine region tag</Text>
              <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>
                This field is now part of the form, so you can tag recipes with values like
                `American`, `European`, `Asian`, or `Mexican`. Later we can turn that into its own
                filter in the recipe library.
              </Text>
              <View style={styles.listStack}>
                <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>
                  {missingRequiredFields.length === 0
                    ? 'All required fields are currently filled in for this draft.'
                    : `Still missing: ${missingRequiredFields.join(', ')}.`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
