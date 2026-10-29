import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { DetailsStep } from '../../components/recipe-wizard/details-step';
import { FinishStep } from '../../components/recipe-wizard/finish-step';
import { RecipeSectionEditor } from '../../components/recipe-section-editor';
import { SAVE_GREEN, WizardFooter, WizardStepper } from '../../components/recipe-wizard/wizard-chrome';
import { useCustomRecipes, type RecipeSource, type UserRecipe } from '../../contexts/custom-recipes-context';
import { useAppSettings } from '../../contexts/settings-context';
import type { ObsidianRecipe } from '../../data/obsidian-recipes';
import { obsidianRecipeMap } from '../../data/obsidian-recipes';
import { WIZARD_STEPS, useRecipeForm, type RecipeFormValues, type WizardStep } from '../../hooks/use-recipe-form';

type EditableRecipe =
  | (ObsidianRecipe & {
      notes: string | null;
      cuisineRegion: string | null;
      sourceInfo: RecipeSource;
    })
  | UserRecipe;

function toFormValues(recipe: EditableRecipe): RecipeFormValues {
  return {
    category: recipe.category ?? 'Entree',
    recipeName: recipe.title,
    cuisineRegion: recipe.cuisineRegion ?? '',
    servings: recipe.servings ?? '',
    prepTime: recipe.prepTime ?? '',
    cookTime: recipe.cookTime ?? '',
    notes: recipe.notes ?? '',
    ingredientsSections: recipe.ingredients,
    directionsSections: recipe.directions,
    allergenTags: recipe.allergenTags ?? [],
    allergyFriendlyTags: recipe.allergyFriendlyTags ?? [],
    sourceInfo: recipe.sourceInfo ?? null,
  };
}

export default function EditRecipeScreen() {
  const { slug, source } = useLocalSearchParams<{ slug: string; source?: 'custom' | 'obsidian' }>();
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;
  const normalizedSource = Array.isArray(source) ? source[0] : source;
  const router = useRouter();
  const { confirmDeleteEnabled, palette } = useAppSettings();
  const { customRecipeMap, deleteRecipe, recipeOverrideMap, loaded, syncBusy, updateRecipe } = useCustomRecipes();
  const customRecipe = normalizedSlug ? customRecipeMap[normalizedSlug] : undefined;
  const obsidianRecipe = normalizedSlug ? obsidianRecipeMap[normalizedSlug] : undefined;
  const override = normalizedSlug ? recipeOverrideMap[normalizedSlug] : undefined;
  const effectiveSource: 'custom' | 'obsidian' = normalizedSource === 'obsidian' ? 'obsidian' : 'custom';
  const recipe: EditableRecipe | undefined = useMemo(() => {
    if (effectiveSource === 'custom') {
      return customRecipe;
    }

    if (!obsidianRecipe || override?.deleted) {
      return undefined;
    }

    return {
      ...obsidianRecipe,
      title: override?.title ?? obsidianRecipe.title,
      category: override?.category ?? obsidianRecipe.category,
      ingredients: override?.ingredients ?? obsidianRecipe.ingredients,
      directions: override?.directions ?? obsidianRecipe.directions,
      prepTime: override?.prepTime ?? obsidianRecipe.prepTime,
      cookTime: override?.cookTime ?? obsidianRecipe.cookTime,
      servings: override?.servings ?? obsidianRecipe.servings,
      notes: override ? override.notes : obsidianRecipe.notes,
      cuisineRegion: override?.cuisineRegion ?? null,
      sourceInfo: override?.sourceInfo ?? null,
      allergenTags: override?.allergenTags ?? obsidianRecipe.allergenTags,
      allergyFriendlyTags: override?.allergyFriendlyTags ?? obsidianRecipe.allergyFriendlyTags,
    };
  }, [customRecipe, effectiveSource, obsidianRecipe, override]);

  const form = useRecipeForm(recipe ? toFormValues(recipe) : undefined);
  const [step, setStep] = useState<WizardStep>('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const loadedSlugRef = useRef<string | null>(recipe ? normalizedSlug ?? null : null);

  // Load the recipe into the form once it's available (storage can finish loading after mount).
  useEffect(() => {
    if (recipe && loadedSlugRef.current !== normalizedSlug) {
      loadedSlugRef.current = normalizedSlug ?? null;
      form.reset(toFormValues(recipe));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, normalizedSlug]);

  function goTo(next: WizardStep) {
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  const recipeRoute = {
    pathname: effectiveSource === 'custom' ? ('/user-recipes/[slug]' as const) : ('/recipes/[slug]' as const),
    params: { slug: normalizedSlug ?? '' },
  };

  async function handleSave() {
    if (!form.canSave) {
      if (form.firstInvalidStep) goTo(form.firstInvalidStep);
      return;
    }
    if (!normalizedSlug) return;

    const saved = await updateRecipe(normalizedSlug, form.buildSaveInput(recipe?.sourceInfo ?? null), effectiveSource);
    if (saved) {
      router.replace(recipeRoute);
    }
  }

  async function handleDelete() {
    if (!normalizedSlug) return;
    await deleteRecipe(normalizedSlug, effectiveSource);
    router.replace('/my-recipes');
  }

  function handleDeletePress() {
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
            <Text style={[styles.panelTitle, { color: palette.text }]}>Opening recipe editor</Text>
            <Text style={[styles.panelText, { color: palette.textMuted }]}>
              Local app recipes are still loading from storage.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!recipe || !normalizedSlug) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: 'Recipe not found' }} />
        <ScrollView contentContainerStyle={styles.page}>
          <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
            <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Missing recipe</Text>
            <Text style={[styles.panelTitle, { color: palette.text }]}>We could not open that editor</Text>
            <Text style={[styles.panelText, { color: palette.textMuted }]}>
              The saved recipe could not be found in local app storage.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const stepIndex = WIZARD_STEPS.findIndex((item) => item.key === step);
  const nextStep = WIZARD_STEPS[stepIndex + 1]?.key;
  const prevStep = WIZARD_STEPS[stepIndex - 1]?.key;

  const deleteControls = (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        onPress={handleDeletePress}
        style={[styles.wizardBackButton, { borderColor: palette.warningBorder, backgroundColor: palette.warningBg }]}
      >
        <Trash2 size={18} color={palette.warningText} />
        <Text style={[styles.pillButtonText, { color: palette.warningText }]}>Delete recipe</Text>
      </Pressable>
      {showDeleteConfirm ? (
        <View style={[styles.settingsCard, { backgroundColor: palette.warningBg, borderColor: palette.warningBorder }]}>
          <Text style={[styles.settingsPageRowLabel, { color: palette.text }]}>{`Delete ${recipe.title}?`}</Text>
          <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>
            {effectiveSource === 'custom'
              ? 'This removes the recipe and returns you to My Recipes.'
              : 'This hides the sample recipe from the app library and returns you to My Recipes. The original note is not deleted.'}
          </Text>
          <View style={styles.wizardFooter}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowDeleteConfirm(false)}
              style={[styles.wizardBackButton, { borderColor: palette.borderAlt, backgroundColor: palette.elevated }]}
            >
              <Text style={[styles.pillButtonText, { color: palette.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleDelete()}
              style={[styles.wizardNextButton, { backgroundColor: palette.warningText }]}
            >
              <Text style={[styles.pillButtonText, { color: palette.accentContrastText }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ title: `Edit ${recipe.title}` }} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.settingsPageContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.wizardPageHeader, { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }]}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[styles.settingsPageTitle, { color: palette.text }]}>Edit recipe</Text>
            <Text numberOfLines={1} style={[styles.settingsPageSubtitle, { color: palette.textMuted }]}>
              {recipe.title}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: syncBusy }}
            disabled={syncBusy}
            onPress={() => void handleSave()}
            style={[styles.wizardSmallButton, { backgroundColor: SAVE_GREEN, borderColor: SAVE_GREEN, marginTop: 8 }]}
          >
            <Text style={[styles.wizardSmallButtonText, { color: '#ffffff' }]}>
              {syncBusy ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <WizardStepper current={step} completed={(key) => form.stepErrors[key].length === 0} onSelect={goTo} />

        {step === 'details' ? <DetailsStep form={form} sourceUrl={recipe.sourceInfo?.url ?? undefined} /> : null}
        {step === 'ingredients' ? (
          <RecipeSectionEditor
            label="Ingredients *"
            hint="Use ## Sauce or [Sauce] for section headers."
            placeholder={'## Dough\n2 cups flour\n1 teaspoon salt\n\n[Filling]\n1/2 cup butter'}
            sections={form.values.ingredientsSections}
            onChange={form.setIngredientsSections}
            palette={palette}
            error={form.stepErrors.ingredients[0]}
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
            error={form.stepErrors.directions[0]}
          />
        ) : null}
        {step === 'finish' ? <FinishStep form={form} onEditStep={goTo} footer={deleteControls} /> : null}

        <WizardFooter
          onBack={prevStep ? () => goTo(prevStep) : () => router.replace(recipeRoute)}
          primaryLabel={
            step === 'finish' ? (syncBusy ? 'Saving…' : 'Save changes') : `Next: ${WIZARD_STEPS[stepIndex + 1].label}`
          }
          primaryIcon={step === 'finish' ? 'none' : 'arrow'}
          primaryTone={step === 'finish' ? 'save' : 'accent'}
          primaryDisabled={step === 'finish' && syncBusy}
          onPrimary={() => (step === 'finish' ? void handleSave() : nextStep && goTo(nextStep))}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
