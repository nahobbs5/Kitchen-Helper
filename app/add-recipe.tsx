import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useAppSettings } from '../contexts/settings-context';
import {
  allergenTagOptions,
  allergyFriendlyTagOptions,
  inferRecipeTags,
  toggleAllergenSelection,
  toggleFriendlySelection,
} from '../utils/allergen-tags';
import { parseOcrRecipeText } from '../utils/ocr-recipe-parser';
import { parseRecipeFromHtml } from '../utils/web-recipe-import';

const categoryOptions = [
  { label: 'Appetizer', value: 'Appetizers' },
  { label: 'Breakfast', value: 'Breakfast' },
  { label: 'Side', value: 'Side' },
  { label: 'Entree', value: 'Entree' },
  { label: 'Dessert', value: 'Dessert' },
] as const;

type EntryMode = 'manual' | 'photo' | 'website';
type OcrState = 'idle' | 'recognizing' | 'done' | 'error';
type WebsiteImportState = 'idle' | 'loading' | 'done' | 'error';

export default function AddRecipeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { openSettings, palette } = useAppSettings();
  const { addRecipe, syncBusy, syncConfigured, syncEnabled } = useCustomRecipes();

  const [entryMode, setEntryMode] = useState<EntryMode>('manual');
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [ocrError, setOcrError] = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [websiteImportState, setWebsiteImportState] = useState<WebsiteImportState>('idle');
  const [websiteImportError, setWebsiteImportError] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState<string>('Entree');
  const [recipeName, setRecipeName] = useState('');
  const [sourceInfo, setSourceInfo] = useState<{ websiteName: string | null; author: string | null; url: string | null } | null>(null);
  const [ingredients, setIngredients] = useState('');
  const [directions, setDirections] = useState('');
  const [notes, setNotes] = useState('');
  const [cuisineRegion, setCuisineRegion] = useState('');
  const [allergenTags, setAllergenTags] = useState<string[]>([]);
  const [allergyFriendlyTags, setAllergyFriendlyTags] = useState<string[]>([]);
  const [allergenTouched, setAllergenTouched] = useState(false);
  const [friendlyTouched, setFriendlyTouched] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

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
  const supportsLocalOcr = Platform.OS !== 'web';

  useEffect(() => {
    if (!allergenTouched) {
      setAllergenTags(detectedTags.allergenTags);
    }

    if (!friendlyTouched) {
      setAllergyFriendlyTags(detectedTags.allergyFriendlyTags);
    }
  }, [allergenTouched, detectedTags.allergenTags, detectedTags.allergyFriendlyTags, friendlyTouched]);

  async function handleSave() {
    setSaveAttempted(true);

    if (!canSave) {
      return;
    }

    const savedRecipe = await addRecipe({
      category,
      title: recipeName,
      ingredientsText: ingredients,
      directionsText: directions,
      notes,
      cuisineRegion,
      sourceInfo,
      allergenTags,
      allergyFriendlyTags,
    });

    if (savedRecipe) {
      router.replace('/my-recipes');
    }
  }

  function handleAllergenToggle(tag: (typeof allergenTagOptions)[number]) {
    setAllergenTouched(true);
    const next = toggleAllergenSelection(allergenTags, allergyFriendlyTags, tag);
    setAllergenTags(next.allergenTags);
    setAllergyFriendlyTags(next.allergyFriendlyTags);
  }

  function handleFriendlyToggle(tag: (typeof allergyFriendlyTagOptions)[number]) {
    setFriendlyTouched(true);
    const next = toggleFriendlySelection(allergenTags, allergyFriendlyTags, tag);
    setAllergenTags(next.allergenTags);
    setAllergyFriendlyTags(next.allergyFriendlyTags);
  }

  function handleAutoDetectTags() {
    setAllergenTouched(true);
    setFriendlyTouched(true);
    setAllergenTags(detectedTags.allergenTags);
    setAllergyFriendlyTags(detectedTags.allergyFriendlyTags);
  }

  function applyOcrResult(rawText: string) {
    const parsed = parseOcrRecipeText(rawText);

    if (parsed.title) {
      setRecipeName(parsed.title);
    }

    if (parsed.ingredientsText) {
      setIngredients(parsed.ingredientsText);
    }

    if (parsed.directionsText) {
      setDirections(parsed.directionsText);
    }

    if (parsed.notesText) {
      setNotes(parsed.notesText);
    }
  }

  async function handleImportFromWebsite() {
    const trimmedUrl = websiteUrl.trim();
    setWebsiteImportError('');

    if (!trimmedUrl) {
      setWebsiteImportState('error');
      setWebsiteImportError('A recipe URL is required before import can run.');
      return;
    }

    setWebsiteImportState('loading');

    try {
      const response = await fetch(trimmedUrl);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const html = await response.text();
      const imported = parseRecipeFromHtml(trimmedUrl, html);

      if (imported.title) {
        setRecipeName(imported.title);
      }

      if (imported.suggestedCategory) {
        setCategory(imported.suggestedCategory);
      }

      if (imported.ingredientsText) {
        setIngredients(imported.ingredientsText);
      }

      if (imported.directionsText) {
        setDirections(imported.directionsText);
      }

      setSourceInfo(imported.source);
      setWebsiteImportState('done');
    } catch (error) {
      setWebsiteImportState('error');
      setWebsiteImportError(
        Platform.OS === 'web'
          ? 'Website import failed. Many sites block browser-side fetching with CORS, so this mode is more reliable in the native app.'
          : 'Website import failed for this page. The site may block scraping or may not expose recipe data in a parseable format.'
      );
    }
  }

  async function handlePickRecipePhoto() {
    setOcrError('');

    if (!supportsLocalOcr) {
      setOcrState('error');
      setOcrError('Local OCR is currently set up for native builds. On web, use manual entry for now.');
      return;
    }

    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setOcrState('error');
      setOcrError('Photo access is needed to import a recipe from an image.');
      return;
    }

    const selection = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (selection.canceled || !selection.assets[0]?.uri) {
      return;
    }

    const imageUri = selection.assets[0].uri;
    setSelectedImageUri(imageUri);
    setOcrState('recognizing');
    setOcrRawText('');

    try {
      const { recognizeText } = await import('@infinitered/react-native-mlkit-text-recognition');
      const result = await recognizeText(imageUri);
      const recognizedText = result.text?.trim() ?? '';

      if (!recognizedText) {
        setOcrState('error');
        setOcrError('No readable recipe text was found in that image. Try a clearer photo or use manual entry.');
        return;
      }

      setOcrRawText(recognizedText);
      applyOcrResult(recognizedText);
      setOcrState('done');
    } catch (error) {
      setOcrState('error');
      setOcrError(
        'Local OCR needs a native development build with ML Kit available. If you are testing in Expo Go, this import mode will not be available there yet.'
      );
    }
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
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => router.push('/my-recipes')}
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                  ↩ Back to My Recipes
                </Text>
              </Pressable>
            </View>

          </View>
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.primaryColumn}>
            <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Recipe entry</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Choose how to start</Text>

              <View style={styles.formStack}>
                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Entry mode</Text>
                  <View style={styles.servingsRow}>
                    {[
                      { label: 'Manual entry', value: 'manual' as const },
                      { label: 'Photo OCR', value: 'photo' as const },
                      { label: 'Website', value: 'website' as const },
                    ].map((option) => {
                      const isActive = entryMode === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => setEntryMode(option.value)}
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

                {entryMode === 'photo' ? (
                  <View style={styles.formField}>
                    <Text style={[styles.formLabel, { color: palette.accentText }]}>Recipe photo</Text>
                    <Text style={[styles.formHint, { color: palette.textSoft }]}>
                      Pick a recipe image from your device. We will run local OCR, then prefill the
                      form below so you can review it before saving. The local OCR path is meant to reduce typing, especially for printed recipes or clean screenshots. It will not perfectly understand every recipe layout. Best results usually come from straight, high-contrast photos with clear section headings like Ingredients and Directions.
                    </Text>
                    {!supportsLocalOcr ? (
                      <Text style={[styles.formHint, { color: palette.accent }]}>
                        Local OCR is currently configured for native builds. On web, use manual
                        entry for now.
                      </Text>
                    ) : (
                      <Text style={[styles.formHint, { color: palette.textSoft }]}>
                        This OCR path uses a native ML Kit module, so it is intended for a dev
                        build rather than Expo Go.
                      </Text>
                    )}
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={handlePickRecipePhoto}
                        style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                      >
                        <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                          + Pick Recipe Photo
                        </Text>
                      </Pressable>
                    </View>
                    {ocrState === 'recognizing' ? (
                      <Text style={[styles.formHint, { color: palette.accentText }]}>
                        Reading the recipe image and filling the form...
                      </Text>
                    ) : null}
                    {ocrError ? (
                      <Text style={[styles.formHint, { color: palette.accent }]}>{ocrError}</Text>
                    ) : null}
                    {selectedImageUri ? (
                      <Image
                        source={{ uri: selectedImageUri }}
                        style={{
                          width: '100%',
                          height: 220,
                          borderRadius: 18,
                          marginTop: 8,
                        }}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                ) : null}

                {entryMode === 'website' ? (
                  <View style={styles.formField}>
                    <Text style={[styles.formLabel, { color: palette.accentText }]}>Recipe website</Text>
                    <Text style={[styles.formHint, { color: palette.textSoft }]}>
                      Paste a recipe URL. We will look for structured recipe data and use it to prefill
                      the form, including website and author details when available. Website import looks for recipe schema first. When a site does not expose clean structured data, the import can be partial and may need manual cleanup.
                    </Text>
                    <TextInput
                      value={websiteUrl}
                      onChangeText={setWebsiteUrl}
                      placeholder="https://example.com/recipe"
                      placeholderTextColor={palette.searchPlaceholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.formInput,
                        { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                      ]}
                    />
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={handleImportFromWebsite}
                        style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                      >
                        <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                          Import Website Recipe
                        </Text>
                      </Pressable>
                    </View>
                    {websiteImportState === 'loading' ? (
                      <Text style={[styles.formHint, { color: palette.accentText }]}>
                        Scanning the website for recipe data...
                      </Text>
                    ) : null}
                    {websiteImportError ? (
                      <Text style={[styles.formHint, { color: palette.accent }]}>{websiteImportError}</Text>
                    ) : null}
                    {Platform.OS === 'web' ? (
                      <Text style={[styles.formHint, { color: palette.textSoft }]}>
                        Browser CORS rules will block some sites. Native builds are more reliable for this mode.
                      </Text>
                    ) : null}
                  </View>
                ) : null}

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
                    One ingredient per line works best for parsing and scaling later.
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
                  <Text style={[styles.formHint, { color: palette.textSoft }]}>
                    Optional notes, tips, serving reminders, or OCR cleanup notes.
                  </Text>
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
                    These are auto-detected from the recipe text first, and you can adjust them before saving.
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
                            isActive && styles.allergyFriendlyTag,
                            isActive && { borderColor: '#97bf72' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.servingsButtonText,
                              { color: palette.text },
                              isActive && styles.allergyFriendlyTagText,
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
                      <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>
                        Auto-detect tags
                      </Text>
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
                            isActive && styles.allergenTag,
                            isActive && { borderColor: '#e98d34' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.servingsButtonText,
                              { color: palette.text },
                              isActive && styles.allergenTagText,
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
                    onPress={() => {
                      if (!syncEnabled) {
                        openSettings();
                        return;
                      }

                      void handleSave();
                    }}
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor:
                          canSave && syncEnabled && !syncBusy ? palette.accent : palette.borderAlt,
                      },
                    ]}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                      {syncBusy ? 'Saving…' : 'Save Recipe'}
                    </Text>
                  </Pressable>
                </View>
                {!syncEnabled ? (
                  <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                    {syncConfigured
                      ? 'Open Settings to sign in before saving recipes.'
                      : 'Add sync configuration, then sign in before saving recipes.'}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {isWide ? (
            <View style={styles.secondaryColumn}>
              <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
                <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Recipe preview</Text>

                <View
                  style={[styles.helperCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                >
                  <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{category}</Text>
                  <Text style={[styles.helperCardTitle, { color: palette.text }]}>
                    {recipeName.trim() || 'Recipe name will appear here'}
                  </Text>
                  <Text style={[styles.helperCardBody, { color: palette.accentText }]}>Ingredients</Text>
                  <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                    {ingredients.trim() ? ingredients.trim() : 'No ingredients entered yet'}
                  </Text>
                  <Text style={[styles.helperCardBody, { color: palette.accentText }]}>Directions</Text>
                  <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                    {directions.trim() ? directions.trim() : 'No directions entered yet'}
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
                  {entryMode === 'website' && sourceInfo?.websiteName ? (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      Website: {sourceInfo.websiteName}
                    </Text>
                  ) : null}
                  {entryMode === 'website' && sourceInfo?.author ? (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      Author: {sourceInfo.author}
                    </Text>
                  ) : null}
                  {entryMode === 'website' && sourceInfo?.url ? (
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      Source: {sourceInfo.url}
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

                {ocrRawText ? (
                  <View
                    style={[styles.helperCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.helperCardTitle, { color: palette.text }]}>OCR text preview</Text>
                    <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                      {ocrRawText}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
