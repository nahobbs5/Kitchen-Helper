import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { Camera, FileText, Link, Pencil } from 'lucide-react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { ProgressBar } from '../components/progress-bar';
import { BasicInfoFields, DetailsStep } from '../components/recipe-wizard/details-step';
import { FinishStep } from '../components/recipe-wizard/finish-step';
import { RecipeSectionEditor } from '../components/recipe-section-editor';
import { ChoiceCard, WizardFooter, WizardStepper } from '../components/recipe-wizard/wizard-chrome';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useAppSettings } from '../contexts/settings-context';
import { EMPTY_RECIPE_FORM, WIZARD_STEPS, useRecipeForm, type WizardStep } from '../hooks/use-recipe-form';
import { allergenTagOptions, allergyFriendlyTagOptions } from '../utils/allergen-tags';
import {
  type AiImportedRecipe,
  type AiImportTier,
  type AiRecipePhoto,
  importRecipeFromPhotos,
} from '../utils/ai-recipe-import';
import { parseRecipeFromMarkdown } from '../utils/markdown-recipe-import';
import { parseOcrRecipeText } from '../utils/ocr-recipe-parser';
import { RECIPE_CATEGORY_VALUES } from '../utils/recipe-form-options';
import { normalizeRecipeSections, parseRecipeSectionsText } from '../utils/recipe-sections';
import { parseRecipeFromHtml } from '../utils/web-recipe-import';

type EntryMode = 'manual' | 'photo' | 'website' | 'markdown';
type PhotoMethod = 'ai' | 'ocr';
type OcrState = 'idle' | 'recognizing' | 'done' | 'error';
type AiImportState = 'idle' | 'extracting' | 'done' | 'error';
type WebsiteImportState = 'idle' | 'loading' | 'done' | 'error';
type MarkdownImportState = 'idle' | 'reading' | 'done' | 'error';
type SelectedRecipePhoto = {
  uri: string;
  ocrText: string;
};
type SelectedAiPhoto = AiRecipePhoto & { uri: string };

/** 'start' picks how to add the recipe; the rest are the wizard steps. */
type AddStep = 'start' | WizardStep;

const ENTRY_MODES = [
  { value: 'manual' as const, title: 'Manual entry', subtitle: 'Type in your recipe', icon: Pencil },
  { value: 'photo' as const, title: 'Photo', subtitle: 'Scan or AI-read a photo', icon: Camera },
  { value: 'website' as const, title: 'Website', subtitle: 'Import from a URL', icon: Link },
  { value: 'markdown' as const, title: 'Markdown', subtitle: 'Paste formatted text', icon: FileText },
];

const STEP_SUBTITLES: Record<AddStep, string> = {
  start: "Choose how you'd like to add your recipe.",
  details: 'Enter the details for your recipe.',
  ingredients: 'Add ingredients and directions.',
  directions: 'Add the steps to make it.',
  finish: 'Check everything, then save.',
};

export default function AddRecipeScreen() {
  const router = useRouter();
  const { palette } = useAppSettings();
  const { addRecipe, syncBusy } = useCustomRecipes();
  const form = useRecipeForm(EMPTY_RECIPE_FORM, { autoDetectTags: true });
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState<AddStep>('start');
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
  const [markdownText, setMarkdownText] = useState('');
  const [markdownImportState, setMarkdownImportState] = useState<MarkdownImportState>('idle');
  const [markdownImportError, setMarkdownImportError] = useState('');
  const [saveError, setSaveError] = useState('');

  const supportsLocalOcr = Platform.OS !== 'web';
  const sourceUrl = (form.values.sourceInfo?.url ?? websiteUrl).trim();

  // The import handlers below predate the shared form hook; these keep their setter names.
  const setRecipeName = (value: string) => form.set('recipeName', value);
  const setCategory = (value: string) => form.set('category', value);
  const setCuisineRegion = (value: string) => form.set('cuisineRegion', value);
  const setIngredientsSections = (value: ReturnType<typeof normalizeRecipeSections>) => form.set('ingredientsSections', value);
  const setDirectionsSections = (value: ReturnType<typeof normalizeRecipeSections>) => form.set('directionsSections', value);
  const setPrepTime = (value: string) => form.set('prepTime', value);
  const setCookTime = (value: string) => form.set('cookTime', value);
  const setServings = (value: string) => form.set('servings', value);
  const setNotes = (value: string) => form.set('notes', value);
  const setSourceInfo = (value: typeof form.values.sourceInfo) => form.set('sourceInfo', value);
  const categoryOptions = RECIPE_CATEGORY_VALUES.map((value) => ({ value }));
  function applyImportedTags(allergenTags: string[], allergyFriendlyTags: string[]) {
    form.markTagsTouched();
    form.patch({ allergenTags, allergyFriendlyTags });
  }

  function scrollToTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function goTo(next: AddStep) {
    setStep(next);
    scrollToTop();
  }

  async function handleSave() {
    if (!form.canSave) {
      if (form.firstInvalidStep) goTo(form.firstInvalidStep);
      return;
    }
    if (entryMode === 'website' && !sourceUrl) {
      setSaveError('Website URL is required for website imports.');
      goTo('start');
      return;
    }
    setSaveError('');

    const savedRecipe = await addRecipe(
      form.buildSaveInput(
        entryMode === 'website'
          ? {
              websiteName: form.values.sourceInfo?.websiteName ?? null,
              author: form.values.sourceInfo?.author ?? null,
              url: sourceUrl || null,
            }
          : form.values.sourceInfo
      )
    );

    if (savedRecipe) {
      router.replace('/my-recipes');
    }
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
      applyImportedTags(aiAllergens, aiFriendly);
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

  function handleImportMarkdown() {
    setMarkdownImportError('');

    if (!markdownText.trim()) {
      setMarkdownImportState('error');
      setMarkdownImportError('Paste some markdown or pick a file before importing.');
      return;
    }

    try {
      const recipe = parseRecipeFromMarkdown(markdownText);
      applyAiResult(recipe);
      setMarkdownImportState('done');
    } catch (error) {
      setMarkdownImportState('error');
      setMarkdownImportError(error instanceof Error ? error.message : 'Markdown import failed.');
    }
  }

  async function handlePickMarkdownFile() {
    setMarkdownImportError('');
    setMarkdownImportState('reading');

    try {
      const DocumentPicker = await import('expo-document-picker');
      const selection = await DocumentPicker.getDocumentAsync({
        type: ['text/markdown', 'text/plain', 'text/x-markdown'],
        copyToCacheDirectory: true,
      });

      if (selection.canceled || !selection.assets[0]?.uri) {
        setMarkdownImportState('idle');
        return;
      }

      const LegacyFileSystem = await import('expo-file-system/legacy');
      const fileText = await LegacyFileSystem.readAsStringAsync(selection.assets[0].uri, {
        encoding: LegacyFileSystem.EncodingType.UTF8,
      });

      setMarkdownText(fileText);

      const recipe = parseRecipeFromMarkdown(fileText);
      applyAiResult(recipe);
      setMarkdownImportState('done');
    } catch (error) {
      setMarkdownImportState('error');
      setMarkdownImportError(error instanceof Error ? error.message : 'Could not read that markdown file.');
    }
  }

  const stepIndex = WIZARD_STEPS.findIndex((item) => item.key === step);
  const nextStep = WIZARD_STEPS[stepIndex + 1]?.key;
  const prevStep: AddStep = stepIndex <= 0 ? 'start' : WIZARD_STEPS[stepIndex - 1].key;
  const stepIsValid = step === 'start' ? form.stepErrors.details.length === 0 : form.stepErrors[step as WizardStep].length === 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.settingsPageContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.wizardPageHeader}>
          <Text style={[styles.settingsPageTitle, { color: palette.text }]}>Add a new recipe</Text>
          <Text style={[styles.settingsPageSubtitle, { color: palette.textMuted }]}>{STEP_SUBTITLES[step]}</Text>
        </View>

        {step === 'start' ? (
          <View style={styles.wizardFieldStack}>
            <View style={styles.choiceGrid}>
              {ENTRY_MODES.map((mode) => (
                <ChoiceCard
                  key={mode.value}
                  icon={mode.icon}
                  title={mode.title}
                  subtitle={mode.subtitle}
                  selected={entryMode === mode.value}
                  onPress={() => setEntryMode(mode.value)}
                />
              ))}
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

                {entryMode === 'markdown' ? (
                  <View style={styles.formField}>
                    <Text style={[styles.formLabel, { color: palette.accentText }]}>Markdown recipe</Text>
                    <Text style={[styles.formHint, { color: palette.textSoft }]}>
                      Paste a recipe written in markdown — like something an AI assistant gave you — or pick a .md
                      file. We will look for a title and Ingredients/Instructions sections and use them to prefill
                      the form below, so you can review everything before saving.
                    </Text>
                    <TextInput
                      value={markdownText}
                      onChangeText={setMarkdownText}
                      placeholder={'# Recipe Title\n\n## Ingredients\n- ...\n\n## Instructions\n1. ...'}
                      placeholderTextColor={palette.searchPlaceholder}
                      multiline
                      textAlignVertical="top"
                      style={[
                        styles.formInput,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.borderAlt,
                          color: palette.text,
                          minHeight: 220,
                        },
                      ]}
                    />
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={handleImportMarkdown}
                        style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                      >
                        <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                          Import Markdown
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          void handlePickMarkdownFile();
                        }}
                        style={[
                          styles.secondaryButton,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                        ]}
                      >
                        <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>
                          Pick .md File
                        </Text>
                      </Pressable>
                    </View>
                    {markdownImportState === 'reading' ? (
                      <>
                        <Text style={[styles.formHint, { color: palette.accentText }]}>
                          Reading the selected file and filling the form...
                        </Text>
                        <View style={{ marginTop: 8 }}>
                          <ProgressBar palette={palette} accessibilityLabel="Reading markdown file" />
                        </View>
                      </>
                    ) : null}
                    {markdownImportState === 'done' ? (
                      <Text style={[styles.formHint, { color: palette.accentText }]}>
                        Done — review the prefilled form below before saving.
                      </Text>
                    ) : null}
                    {markdownImportError ? (
                      <Text style={[styles.formHint, { color: palette.accent }]}>{markdownImportError}</Text>
                    ) : null}
                  </View>
                ) : null}

            <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} />
            <Text style={[styles.wizardSectionTitle, { color: palette.accent }]}>Basic information</Text>
            <BasicInfoFields form={form} categoryStyle="chips" />
            {saveError && !sourceUrl ? (
              <Text style={[styles.accountFeedback, { color: palette.warningText }]}>{saveError}</Text>
            ) : null}
            <WizardFooter
              primaryLabel="Next: Add details"
              primaryDisabled={!stepIsValid}
              onPrimary={() => goTo('details')}
            />
            {!stepIsValid ? (
              <Text style={[styles.accountFeedback, { color: palette.textMuted }]}>
                Add a recipe name to continue.
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.wizardFieldStack}>
            <WizardStepper current={step} completed={(key) => form.stepErrors[key].length === 0} />

            {step === 'details' ? (
              <DetailsStep
                form={form}
                sourceUrl={entryMode === 'website' ? sourceUrl : undefined}
                onReplaceSourceUrl={entryMode === 'website' ? () => goTo('start') : undefined}
              />
            ) : null}
            {step === 'ingredients' ? (
              <RecipeSectionEditor
                label="Ingredients *"
                hint="Use ## Sauce or [Sauce] for section headers."
                placeholder={'## Dough\n2 cups flour\n1 teaspoon salt\n\n[Filling]\n1/2 cup butter'}
                sections={form.values.ingredientsSections}
                onChange={form.setIngredientsSections}
                palette={palette}
              />
            ) : null}
            {step === 'directions' ? (
              <RecipeSectionEditor
                label="Directions *"
                hint="Use ## Sauce or [Sauce] for section headers. One step per line; numbers optional."
                placeholder={'## Prep\n1. Preheat the oven.\n\n[Bake]\n2. Bake until golden.'}
                ordered
                sections={form.values.directionsSections}
                onChange={form.setDirectionsSections}
                palette={palette}
              />
            ) : null}
            {step === 'finish' ? <FinishStep form={form} onEditStep={goTo} /> : null}

            {saveError && !sourceUrl ? (
              <Text style={[styles.accountFeedback, { color: palette.warningText }]}>{saveError}</Text>
            ) : null}
            {!stepIsValid && step !== 'finish' ? (
              <Text style={[styles.accountFeedback, { color: palette.textMuted }]}>
                {form.stepErrors[step as WizardStep][0]}
              </Text>
            ) : null}
            <WizardFooter
              onBack={() => goTo(prevStep)}
              primaryLabel={
                step === 'finish'
                  ? syncBusy
                    ? 'Saving…'
                    : 'Save recipe'
                  : `Next: ${WIZARD_STEPS[stepIndex + 1].label}`
              }
              primaryIcon={step === 'finish' ? 'none' : 'arrow'}
              primaryTone={step === 'finish' ? 'save' : 'accent'}
              primaryDisabled={step === 'finish' ? !form.canSave || syncBusy : !stepIsValid}
              onPrimary={() => (step === 'finish' ? void handleSave() : nextStep && goTo(nextStep))}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
