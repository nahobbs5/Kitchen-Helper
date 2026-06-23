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
import { ProgressBar } from '../components/progress-bar';
import { RecipeSectionEditor } from '../components/recipe-section-editor';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useAppSettings } from '../contexts/settings-context';
import type { RecipeSection } from '../data/obsidian-recipes';
import {
  allergenTagOptions,
  allergyFriendlyTagOptions,
  inferRecipeTags,
  toggleAllergenSelection,
  toggleFriendlySelection,
} from '../utils/allergen-tags';
import {
  type AiImportedRecipe,
  type AiImportTier,
  type AiRecipePhoto,
  importRecipeFromPhotos,
} from '../utils/ai-recipe-import';
import { parseOcrRecipeText } from '../utils/ocr-recipe-parser';
import { extractRecipeMetadata, formatCookTimeTag } from '../utils/recipe-metadata';
import {
  formatRecipeSections,
  normalizeRecipeSections,
  parseRecipeSectionsText,
  recipeSectionsHaveItems,
} from '../utils/recipe-sections';
import { parseRecipeFromHtml } from '../utils/web-recipe-import';

const categoryOptions = [
  { label: 'Appetizer', value: 'Appetizers' },
  { label: 'Breakfast', value: 'Breakfast' },
  { label: 'Side', value: 'Side' },
  { label: 'Entree', value: 'Entree' },
  { label: 'Dessert', value: 'Dessert' },
] as const;

type EntryMode = 'manual' | 'photo' | 'website';
type PhotoMethod = 'ai' | 'ocr';
type OcrState = 'idle' | 'recognizing' | 'done' | 'error';
type AiImportState = 'idle' | 'extracting' | 'done' | 'error';
type WebsiteImportState = 'idle' | 'loading' | 'done' | 'error';
type SelectedRecipePhoto = {
  uri: string;
  ocrText: string;
};
type SelectedAiPhoto = AiRecipePhoto & { uri: string };

export default function AddRecipeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const { addRecipe, syncBusy } = useCustomRecipes();

  const [entryMode, setEntryMode] = useState<EntryMode>('manual');
  const [photoMethod, setPhotoMethod] = useState<PhotoMethod>('ai');
  const [aiState, setAiState] = useState<AiImportState>('idle');
  const [aiError, setAiError] = useState('');
  const [aiPhotos, setAiPhotos] = useState<SelectedAiPhoto[]>([]);
  const [lastAiTier, setLastAiTier] = useState<AiImportTier>('fast');
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [ocrError, setOcrError] = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const [selectedRecipePhotos, setSelectedRecipePhotos] = useState<SelectedRecipePhoto[]>([]);
  const [websiteImportState, setWebsiteImportState] = useState<WebsiteImportState>('idle');
  const [websiteImportError, setWebsiteImportError] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState<string>('Entree');
  const [recipeName, setRecipeName] = useState('');
  const [sourceInfo, setSourceInfo] = useState<{ websiteName: string | null; author: string | null; url: string | null } | null>(null);
  const [ingredientsSections, setIngredientsSections] = useState<RecipeSection[]>([]);
  const [directionsSections, setDirectionsSections] = useState<RecipeSection[]>([]);
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [notes, setNotes] = useState('');
  const [cuisineRegion, setCuisineRegion] = useState('');
  const [allergenTags, setAllergenTags] = useState<string[]>([]);
  const [allergyFriendlyTags, setAllergyFriendlyTags] = useState<string[]>([]);
  const [allergenTouched, setAllergenTouched] = useState(false);
  const [friendlyTouched, setFriendlyTouched] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const ingredientsText = useMemo(
    () => formatRecipeSections(ingredientsSections),
    [ingredientsSections]
  );
  const directionsText = useMemo(
    () => formatRecipeSections(directionsSections, { ordered: true }),
    [directionsSections]
  );

  const detectedTags = useMemo(
    () =>
      inferRecipeTags({
        title: recipeName,
        ingredientsText,
        directionsText,
        notes,
      }),
    [directionsText, ingredientsText, notes, recipeName]
  );

  const missingRequiredFields = useMemo(
    () =>
      [
        !recipeName.trim() ? 'recipe name' : null,
        !recipeSectionsHaveItems(ingredientsSections) ? 'ingredients' : null,
        !recipeSectionsHaveItems(directionsSections) ? 'directions' : null,
      ].filter(Boolean) as string[],
    [directionsSections, ingredientsSections, recipeName]
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
      ingredientsText,
      directionsText,
      ingredientsSections,
      directionsSections,
      prepTime,
      cookTime,
      servings,
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
      setIngredientsSections(parseRecipeSectionsText(parsed.ingredientsText));
    }

    if (parsed.directionsText) {
      setDirectionsSections(parseRecipeSectionsText(parsed.directionsText, { ordered: true }));
    }

    if (parsed.prepTime) {
      setPrepTime(parsed.prepTime);
    }

    if (parsed.cookTime) {
      setCookTime(parsed.cookTime);
    }

    if (parsed.servings) {
      setServings(parsed.servings);
    }

    if (parsed.notesText) {
      setNotes(parsed.notesText);
    }
  }

  function buildOcrRawText(photos: SelectedRecipePhoto[]) {
    return photos
      .map((photo, index) => {
        if (!photo.ocrText) {
          return '';
        }

        return index === 0 ? photo.ocrText : `--- Photo ${index + 1} ---\n${photo.ocrText}`;
      })
      .filter(Boolean)
      .join('\n\n');
  }

  function applyExtractedMetadata(nextIngredients: string, nextDirections: string, nextNotes = notes) {
    const extracted = extractRecipeMetadata({
      ingredientsText: nextIngredients,
      directionsText: nextDirections,
      notesText: nextNotes,
    });

    if (extracted.prepTime && !prepTime.trim()) {
      setPrepTime(extracted.prepTime);
    }

    if (extracted.cookTime && !cookTime.trim()) {
      setCookTime(extracted.cookTime);
    }

    if (extracted.servings && !servings.trim()) {
      setServings(extracted.servings);
    }

    return extracted;
  }

  function handleIngredientsSectionsChange(nextSections: RecipeSection[]) {
    applyExtractedMetadata(formatRecipeSections(nextSections), directionsText);
    setIngredientsSections(nextSections);
  }

  function handleDirectionsSectionsChange(nextSections: RecipeSection[]) {
    applyExtractedMetadata(ingredientsText, formatRecipeSections(nextSections, { ordered: true }));
    setDirectionsSections(nextSections);
  }

  function handleNotesChange(value: string) {
    const extracted = applyExtractedMetadata(ingredientsText, directionsText, value);
    setNotes(extracted.notesText);
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
        setIngredientsSections(parseRecipeSectionsText(imported.ingredientsText));
      }

      if (imported.directionsText) {
        setDirectionsSections(parseRecipeSectionsText(imported.directionsText, { ordered: true }));
      }

      if (imported.prepTime) {
        setPrepTime(imported.prepTime);
      }

      if (imported.cookTime) {
        setCookTime(imported.cookTime);
      }

      if (imported.servings) {
        setServings(imported.servings);
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
      allowsMultipleSelection: true,
      selectionLimit: 2,
      orderedSelection: true,
      quality: 1,
    });

    if (selection.canceled || !selection.assets[0]?.uri) {
      return;
    }

    const pickedImageUris = selection.assets.map((asset) => asset.uri).filter(Boolean);
    const existingPhotos = selectedRecipePhotos.length >= 2 ? [] : selectedRecipePhotos;
    const newPhotos = pickedImageUris
      .slice(0, 2 - existingPhotos.length)
      .map((uri) => ({ uri, ocrText: '' }));
    const nextPhotos = [...existingPhotos, ...newPhotos];

    setSelectedRecipePhotos(nextPhotos);
    setOcrState('recognizing');
    setOcrRawText(buildOcrRawText(existingPhotos));

    try {
      const { recognizeText } = await import('@infinitered/react-native-mlkit-text-recognition');
      const recognizedPhotos = [...nextPhotos];

      for (let index = existingPhotos.length; index < nextPhotos.length; index += 1) {
        const result = await recognizeText(nextPhotos[index].uri);
        const recognizedText = result.text?.trim() ?? '';
        recognizedPhotos[index] = { ...recognizedPhotos[index], ocrText: recognizedText };
      }

      const recognizedText = buildOcrRawText(recognizedPhotos);

      if (!recognizedText) {
        setOcrState('error');
        setOcrError('No readable recipe text was found in the selected image(s). Try clearer photos or use manual entry.');
        return;
      }

      setSelectedRecipePhotos(recognizedPhotos);
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

  function applyAiResult(recipe: AiImportedRecipe) {
    if (recipe.title) {
      setRecipeName(recipe.title);
    }

    const ingredients = normalizeRecipeSections(recipe.ingredientSections ?? []);
    if (ingredients.length > 0) {
      setIngredientsSections(ingredients);
    }

    const directions = normalizeRecipeSections(recipe.directionSections ?? []);
    if (directions.length > 0) {
      setDirectionsSections(directions);
    }

    if (recipe.prepTime) {
      setPrepTime(recipe.prepTime);
    }

    if (recipe.cookTime) {
      setCookTime(recipe.cookTime);
    }

    if (recipe.servings) {
      setServings(recipe.servings);
    }

    if (recipe.notes) {
      setNotes(recipe.notes);
    }

    if (
      recipe.suggestedCategory
      && categoryOptions.some((option) => option.value === recipe.suggestedCategory)
    ) {
      setCategory(recipe.suggestedCategory);
    }

    if (recipe.cuisineRegion) {
      setCuisineRegion(recipe.cuisineRegion);
    }

    const aiAllergens = (recipe.allergenTags ?? []).filter((tag) =>
      (allergenTagOptions as readonly string[]).includes(tag)
    );
    const aiFriendly = (recipe.allergyFriendlyTags ?? []).filter((tag) =>
      (allergyFriendlyTagOptions as readonly string[]).includes(tag)
    );

    if (aiAllergens.length > 0 || aiFriendly.length > 0) {
      setAllergenTouched(true);
      setFriendlyTouched(true);
      setAllergenTags(aiAllergens);
      setAllergyFriendlyTags(aiFriendly);
    }
  }

  async function runAiExtraction(photos: SelectedAiPhoto[], tier: AiImportTier) {
    setAiState('extracting');
    setAiError('');
    setLastAiTier(tier);

    try {
      const recipe = await importRecipeFromPhotos(
        photos.map(({ base64, mediaType }) => ({ base64, mediaType })),
        tier
      );
      applyAiResult(recipe);
      setAiState('done');
    } catch (error) {
      setAiState('error');
      setAiError(error instanceof Error ? error.message : 'AI recipe import failed.');
    }
  }

  async function handlePickPhotosForAi() {
    setAiError('');

    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setAiState('error');
      setAiError('Photo access is needed to import a recipe from an image.');
      return;
    }

    const selection = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 2,
      orderedSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (selection.canceled) {
      return;
    }

    const photos = selection.assets
      .filter((asset) => asset.base64)
      .slice(0, 2)
      .map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 as string,
        mediaType: asset.mimeType ?? 'image/jpeg',
      }));

    if (photos.length === 0) {
      setAiState('error');
      setAiError('Could not read the selected image(s). Try different photos.');
      return;
    }

    setAiPhotos(photos);
    await runAiExtraction(photos, 'fast');
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
                    <Text style={[styles.formLabel, { color: palette.accentText }]}>Import method</Text>
                    <View style={styles.servingsRow}>
                      {[
                        { label: 'AI extract', value: 'ai' as const },
                        { label: 'Offline OCR', value: 'ocr' as const },
                      ].map((option) => {
                        const isActive = photoMethod === option.value;

                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => setPhotoMethod(option.value)}
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

                    {photoMethod === 'ai' ? (
                      <>
                        <Text style={[styles.formHint, { color: palette.textSoft }]}>
                          Pick up to two recipe photos. They are sent to your private import service, read by AI, and used to
                          prefill the form below — including category, cuisine, and allergy tags — so you can review everything
                          before saving. Handles handwriting and multi-column layouts much better than offline OCR. Typical cost
                          is well under a cent per recipe.
                        </Text>
                        <View style={styles.actionRow}>
                          <Pressable
                            onPress={() => {
                              void handlePickPhotosForAi();
                            }}
                            style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                          >
                            <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                              Select Recipe Photos
                            </Text>
                          </Pressable>
                          {aiPhotos.length > 0 && aiState !== 'extracting' && lastAiTier === 'fast' ? (
                            <Pressable
                              onPress={() => {
                                void runAiExtraction(aiPhotos, 'accurate');
                              }}
                              style={[
                                styles.secondaryButton,
                                { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                              ]}
                            >
                              <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>
                                Retry with Better Model
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                        {aiState === 'extracting' ? (
                          <>
                            <Text style={[styles.formHint, { color: palette.accentText }]}>
                              {lastAiTier === 'accurate'
                                ? 'Re-reading the photo(s) with the more accurate model...'
                                : 'Reading the recipe photo(s) and filling the form...'}
                            </Text>
                            <View style={{ marginTop: 8 }}>
                              <ProgressBar palette={palette} accessibilityLabel="Reading recipe photos" />
                            </View>
                          </>
                        ) : null}
                        {aiState === 'done' ? (
                          <Text style={[styles.formHint, { color: palette.accentText }]}>
                            Done — review the prefilled form below before saving. If something looks off, try the better model.
                          </Text>
                        ) : null}
                        {aiError ? (
                          <Text style={[styles.formHint, { color: palette.accent }]}>{aiError}</Text>
                        ) : null}
                        {aiPhotos.length > 0 ? (
                          <View style={styles.formStack}>
                            {aiPhotos.map((photo, index) => (
                              <View key={`${photo.uri}-${index}`} style={styles.formField}>
                                <Text style={[styles.formHint, { color: palette.accentText }]}>Photo {index + 1}</Text>
                                <Image
                                  source={{ uri: photo.uri }}
                                  style={{
                                    width: '100%',
                                    height: 220,
                                    borderRadius: 18,
                                    marginTop: 8,
                                  }}
                                  resizeMode="cover"
                                />
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Text style={[styles.formHint, { color: palette.textSoft }]}>
                          Free, on-device text recognition — no photo leaves your phone. Works best on straight, high-contrast
                          photos of printed recipes with clear section headings like Ingredients and Directions. For handwriting
                          or busy layouts, AI extract is far more reliable.
                        </Text>
                        {!supportsLocalOcr ? (
                          <Text style={[styles.formHint, { color: palette.accent }]}>
                            Local OCR is currently configured for native builds. On web, use AI extract or manual entry.
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
                              Select Recipe Photos
                            </Text>
                          </Pressable>
                        </View>
                        {ocrState === 'recognizing' ? (
                          <>
                            <Text style={[styles.formHint, { color: palette.accentText }]}>
                              Reading the selected recipe image(s) and filling the form...
                            </Text>
                            <View style={{ marginTop: 8 }}>
                              <ProgressBar palette={palette} accessibilityLabel="Recognizing recipe text" />
                            </View>
                          </>
                        ) : null}
                        {ocrError ? (
                          <Text style={[styles.formHint, { color: palette.accent }]}>{ocrError}</Text>
                        ) : null}
                        {selectedRecipePhotos.length > 0 ? (
                          <View style={styles.formStack}>
                            {selectedRecipePhotos.map((photo, index) => (
                              <View key={`${photo.uri}-${index}`} style={styles.formField}>
                                <Text style={[styles.formHint, { color: palette.accentText }]}>Photo {index + 1}</Text>
                                <Image
                                  source={{ uri: photo.uri }}
                                  style={{
                                    width: '100%',
                                    height: 220,
                                    borderRadius: 18,
                                    marginTop: 8,
                                  }}
                                  resizeMode="cover"
                                />
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </>
                    )}
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
                      <>
                        <Text style={[styles.formHint, { color: palette.accentText }]}>
                          Scanning the website for recipe data...
                        </Text>
                        <View style={{ marginTop: 8 }}>
                          <ProgressBar palette={palette} accessibilityLabel="Scanning website for recipe data" />
                        </View>
                      </>
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
                    placeholder={isWide ? 'Example: Lemon Herb Roast Chicken' : 'Ex: Lemon Herb Roast Chicken'}
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

                <RecipeSectionEditor
                  label="Ingredients *"
                  hint="Use ## Sauce or [Sauce] for section headers."
                  placeholder={'## Dough\n2 cups flour\n1 teaspoon salt\n\n[Filling]\n1/2 cup butter'}
                  sections={ingredientsSections}
                  onChange={handleIngredientsSectionsChange}
                  palette={palette}
                  error={
                    saveAttempted && !recipeSectionsHaveItems(ingredientsSections)
                      ? 'Ingredients are required.'
                      : undefined
                  }
                />

                <RecipeSectionEditor
                  label="Directions *"
                  hint="Use ## Sauce or [Sauce] for section headers. One step per line; numbers optional."
                  placeholder={'## Prep\n1. Preheat the oven.\n\n[Bake]\n2. Bake until golden.'}
                  ordered
                  sections={directionsSections}
                  onChange={handleDirectionsSectionsChange}
                  palette={palette}
                  error={
                    saveAttempted && !recipeSectionsHaveItems(directionsSections)
                      ? 'Directions are required.'
                      : undefined
                  }
                />

                <View style={styles.formField}>
                  <View style={styles.metadataRow}>
                    <View style={styles.metadataField}>
                      <Text style={[styles.formLabel, { color: palette.accentText }]}>Prep time</Text>
                      <TextInput
                        value={prepTime}
                        onChangeText={setPrepTime}
                        placeholder="15 minutes"
                        placeholderTextColor={palette.searchPlaceholder}
                        style={[
                          styles.formInput,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                        ]}
                      />
                    </View>
                    <View style={styles.metadataField}>
                      <Text style={[styles.formLabel, { color: palette.accentText }]}>Cook/bake time</Text>
                      <TextInput
                        value={cookTime}
                        onChangeText={setCookTime}
                        placeholder="30 minutes"
                        placeholderTextColor={palette.searchPlaceholder}
                        style={[
                          styles.formInput,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                        ]}
                      />
                    </View>
                    <View style={styles.metadataField}>
                      <Text style={[styles.formLabel, { color: palette.accentText }]}>Servings</Text>
                      <TextInput
                        value={servings}
                        onChangeText={setServings}
                        placeholder="Serves 4"
                        placeholderTextColor={palette.searchPlaceholder}
                        style={[
                          styles.formInput,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: palette.accentText }]}>Notes</Text>
                  <Text style={[styles.formHint, { color: palette.textSoft }]}>
                    Optional notes, tips, serving sizes, etc.
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={handleNotesChange}
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
                    onPress={() => {
                      void handleSave();
                    }}
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: canSave && !syncBusy ? palette.accent : palette.borderAlt,
                      },
                    ]}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                      {syncBusy ? 'Saving…' : 'Save Recipe'}
                    </Text>
                  </Pressable>
                </View>
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
                    {ingredientsText.trim() ? ingredientsText.trim() : 'No ingredients entered yet'}
                  </Text>
                  <Text style={[styles.helperCardBody, { color: palette.accentText }]}>Directions</Text>
                  <Text style={[styles.helperCardBody, { color: palette.textMuted }]}>
                    {directionsText.trim() ? directionsText.trim() : 'No directions entered yet'}
                  </Text>
                  {prepTime.trim() || cookTime.trim() || servings.trim() ? (
                    <View style={styles.tagRow}>
                      {prepTime.trim() ? (
                        <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                          <Text style={[styles.tagText, { color: palette.tagText }]}>Prep: {prepTime.trim()}</Text>
                        </View>
                      ) : null}
                      {cookTime.trim() ? (
                        <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                          <Text style={[styles.tagText, { color: palette.tagText }]}>
                            {formatCookTimeTag(
                              { title: recipeName, category, directions: [{ items: [directionsText] }] },
                              cookTime.trim()
                            )}
                          </Text>
                        </View>
                      ) : null}
                      {servings.trim() ? (
                        <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                          <Text style={[styles.tagText, { color: palette.tagText }]}>Serves: {servings.trim()}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
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
