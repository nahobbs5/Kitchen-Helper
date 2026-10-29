import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAppSettings } from '../../contexts/settings-context';
import { WIZARD_STEPS, type RecipeForm, type WizardStep } from '../../hooks/use-recipe-form';
import { RECIPE_CATEGORY_OPTIONS } from '../../utils/recipe-form-options';
import { countRecipeSectionItems } from '../../utils/recipe-sections';
import { kitchenStyles as styles } from '../kitchen-styles';
import { TagsFields } from './details-step';

/** Review everything before saving, with a jump back to each step. */
export function FinishStep({
  form,
  onEditStep,
  footer,
}: {
  form: RecipeForm;
  onEditStep: (step: WizardStep) => void;
  /** Save / Delete actions. */
  footer?: ReactNode;
}) {
  const { palette } = useAppSettings();
  const { values } = form;
  const categoryLabel =
    RECIPE_CATEGORY_OPTIONS.find((option) => option.value === values.category)?.label ?? values.category;
  const meta = [
    values.servings.trim() ? `Serves ${values.servings.trim().replace(/^serves\s+/i, '')}` : null,
    values.prepTime.trim() ? `Prep ${values.prepTime.trim()}` : null,
    values.cookTime.trim() ? `Cook ${values.cookTime.trim()}` : null,
  ].filter(Boolean) as string[];
  const missing = WIZARD_STEPS.flatMap((step) => form.stepErrors[step.key].map((message) => ({ step: step.key, message })));

  function sectionSummary(kind: 'ingredients' | 'directions') {
    const sections = kind === 'ingredients' ? values.ingredientsSections : values.directionsSections;
    const total = countRecipeSectionItems(sections);
    const noun = kind === 'ingredients' ? 'ingredient' : 'step';
    const titled = sections.filter((section) => section.title);
    return titled.length > 0
      ? `${total} ${noun}${total === 1 ? '' : 's'} in ${sections.length} sections: ${titled.map((section) => section.title).join(', ')}`
      : `${total} ${noun}${total === 1 ? '' : 's'}`;
  }

  function Row({ label, value, step }: { label: string; value: string; step: WizardStep }) {
    return (
      <View style={styles.settingsPageRow}>
        <View style={styles.settingsPageRowCopy}>
          <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>{label}</Text>
          <Text style={[styles.settingsPageRowLabel, { color: palette.text }]}>{value}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${label}`} onPress={() => onEditStep(step)} hitSlop={8}>
          <Text style={[styles.wizardTinyLink, { color: palette.accentText }]}>Edit</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wizardFieldStack}>
      <TagsFields form={form} />

      <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} />
      <Text style={[styles.wizardSectionTitle, { color: palette.accent }]}>Review your recipe</Text>

      {missing.length > 0 ? (
        <View style={[styles.settingsCard, { backgroundColor: palette.warningBg, borderColor: palette.warningBorder }]}>
          {missing.map((item) => (
            <Pressable key={item.message} onPress={() => onEditStep(item.step)}>
              <Text style={[styles.settingsPageRowLabel, { color: palette.warningText }]}>{`• ${item.message}`}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={[styles.settingsCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
        <Row label="Recipe name" value={values.recipeName.trim() || '—'} step="details" />
        <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} />
        <Row
          label="Category & cuisine"
          value={[categoryLabel, values.cuisineRegion.trim()].filter(Boolean).join(' · ')}
          step="details"
        />
        {meta.length > 0 ? (
          <>
            <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} />
            <Row label="Servings & time" value={meta.join(' · ')} step="details" />
          </>
        ) : null}
        <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} />
        <Row label="Ingredients" value={sectionSummary('ingredients')} step="ingredients" />
        <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} />
        <Row label="Directions" value={sectionSummary('directions')} step="directions" />
        {values.notes.trim() ? (
          <>
            <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} />
            <Row label="Notes" value={values.notes.trim()} step="details" />
          </>
        ) : null}
      </View>

      {footer}
    </View>
  );
}
