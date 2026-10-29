import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { useAppSettings } from '../../contexts/settings-context';
import type { RecipeForm } from '../../hooks/use-recipe-form';
import { allergenTagOptions, allergyFriendlyTagOptions } from '../../utils/allergen-tags';
import {
  CUISINE_OPTIONS,
  RECIPE_CATEGORY_OPTIONS,
  minutesBoxValue,
  minutesFromBox,
  parseServings,
} from '../../utils/recipe-form-options';
import { kitchenStyles as styles } from '../kitchen-styles';
import { Chip, FormInput, FormLabel, NumberStepper, SelectField } from './wizard-chrome';

const cuisineSelectOptions = CUISINE_OPTIONS.map((cuisine) => ({ label: cuisine, value: cuisine }));

/** Name, category chips and cuisine — shown on the Add start screen and at the top of Details. */
export function BasicInfoFields({ form, categoryStyle }: { form: RecipeForm; categoryStyle: 'chips' | 'dropdown' }) {
  const { values, set } = form;

  return (
    <View style={styles.wizardFieldStack}>
      <View style={styles.wizardField}>
        <FormLabel required>Recipe name</FormLabel>
        <FormInput
          value={values.recipeName}
          onChangeText={(value) => set('recipeName', value)}
          placeholder="Ex: Lemon Herb Roast Chicken"
          accessibilityLabel="Recipe name"
        />
      </View>
      {categoryStyle === 'chips' ? (
        <>
          <View style={styles.wizardField}>
            <FormLabel required>Category</FormLabel>
            <View style={styles.wizardChipGrid}>
              {RECIPE_CATEGORY_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={values.category === option.value}
                  onPress={() => set('category', option.value)}
                />
              ))}
            </View>
          </View>
          <View style={styles.wizardField}>
            <FormLabel>Cuisine region</FormLabel>
            <SelectField
              value={values.cuisineRegion}
              options={cuisineSelectOptions}
              onChange={(value) => set('cuisineRegion', value)}
              placeholder="Select a cuisine (optional)"
              allowCustom
              accessibilityLabel="Cuisine region"
            />
          </View>
        </>
      ) : (
        <View style={styles.wizardFieldRow}>
          <View style={[styles.wizardField, { flex: 1 }]}>
            <FormLabel required>Category</FormLabel>
            <SelectField
              value={values.category}
              options={withCurrent(RECIPE_CATEGORY_OPTIONS, values.category)}
              onChange={(value) => set('category', value)}
              placeholder="Choose"
              accessibilityLabel="Category"
            />
          </View>
          <View style={[styles.wizardField, { flex: 1 }]}>
            <FormLabel>Cuisine region</FormLabel>
            <SelectField
              value={values.cuisineRegion}
              options={cuisineSelectOptions}
              onChange={(value) => set('cuisineRegion', value)}
              placeholder="Optional"
              allowCustom
              accessibilityLabel="Cuisine region"
            />
          </View>
        </View>
      )}
    </View>
  );
}

/** Keeps an older, non-standard category selectable instead of silently dropping it. */
function withCurrent(options: readonly { label: string; value: string }[], current: string) {
  return current && !options.some((option) => option.value === current)
    ? [...options, { label: current, value: current }]
    : options;
}

/**
 * Prep/cook time: a minutes box that takes a number ("15") or a range ("20-25").
 * Values the box can't show ("1 hr 20 min", "overnight") get a plain text box so nothing is lost.
 * Untouched values are saved exactly as they were.
 */
function MinutesField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const { palette } = useAppSettings();
  const boxValue = minutesBoxValue(value);

  return (
    <View style={[styles.wizardField, { flex: 1 }]}>
      <FormLabel>{label}</FormLabel>
      {boxValue === null ? (
        <FormInput value={value} onChangeText={onChange} placeholder="e.g. 1 hr 20 min" accessibilityLabel={label} />
      ) : (
        <View style={[styles.wizardMinutes, { borderColor: palette.borderAlt, backgroundColor: palette.elevated }]}>
          <FormInput
            value={boxValue}
            onChangeText={(text) => onChange(minutesFromBox(text))}
            // "-" isn't on the iOS number pad or Android's numeric keyboards.
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            placeholder="0"
            accessibilityLabel={`${label} in minutes, a number or a range`}
            style={styles.wizardMinutesInput}
          />
          <Text style={[styles.wizardMinutesSuffix, { color: palette.textMuted }]}>minutes</Text>
        </View>
      )}
    </View>
  );
}

function ServingsField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { palette } = useAppSettings();
  const servings = parseServings(value);
  const [forceText, setForceText] = useState(false);
  const useText = forceText || (value.trim() !== '' && servings === null);

  return (
    <View style={styles.wizardField}>
      <FormLabel>Servings</FormLabel>
      {useText ? (
        <FormInput value={value} onChangeText={onChange} placeholder="e.g. 4–6 or 12 muffins" accessibilityLabel="Servings" />
      ) : (
        <NumberStepper
          label="servings"
          value={servings ?? 0}
          min={0}
          onChange={(next) => onChange(next > 0 ? String(next) : '')}
        />
      )}
      <Pressable onPress={() => setForceText(!useText)} hitSlop={6}>
        <Text style={[styles.wizardTinyLink, { color: palette.accentText }]}>
          {useText ? (value.trim() === '' || servings !== null ? 'Use a number' : '') : 'Type instead'}
        </Text>
      </Pressable>
    </View>
  );
}

export function DetailsStep({
  form,
  sourceUrl,
  onSourceUrlChange,
}: {
  form: RecipeForm;
  /** Shown when the recipe came from a website. */
  sourceUrl?: string;
  onSourceUrlChange?: (url: string) => void;
}) {
  const { palette } = useAppSettings();
  const { values, set } = form;
  const showError = values.recipeName.trim() === '';

  return (
    <View style={styles.wizardFieldStack}>
      <Text style={[styles.wizardSectionTitle, { color: palette.accent }]}>Basic information</Text>
      <BasicInfoFields form={form} categoryStyle="dropdown" />
      {showError ? (
        <Text style={[styles.accountFeedback, { color: palette.warningText }]}>Recipe name is required.</Text>
      ) : null}

      <View style={[styles.wizardFieldRow, { alignItems: 'flex-start' }]}>
        <ServingsField value={values.servings} onChange={(value) => set('servings', value)} />
        <MinutesField label="Prep time" value={values.prepTime} onChange={(value) => set('prepTime', value)} />
        <MinutesField label="Cook time" value={values.cookTime} onChange={(value) => set('cookTime', value)} />
      </View>

      <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} />

      <View style={styles.wizardField}>
        <Text style={[styles.wizardHeading, { color: palette.text }]}>Notes</Text>
        <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>
          Optional notes, tips, or additional info.
        </Text>
        <FormInput
          value={values.notes}
          onChangeText={form.setNotes}
          placeholder="Add any notes about this recipe…"
          multiline
          textAlignVertical="top"
          accessibilityLabel="Notes"
          style={{ minHeight: 110 }}
        />
      </View>

      {sourceUrl !== undefined ? (
        <View style={styles.wizardField}>
          <FormLabel required={Boolean(onSourceUrlChange)}>Website URL</FormLabel>
          {onSourceUrlChange ? null : (
            <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>
              Records where this recipe came from. The source URL can&apos;t be changed.
            </Text>
          )}
          <FormInput
            value={sourceUrl}
            onChangeText={onSourceUrlChange}
            editable={Boolean(onSourceUrlChange)}
            placeholder="https://example.com/recipe"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Website URL"
            style={onSourceUrlChange ? undefined : { opacity: 0.7 }}
          />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Allergy-friendly / allergen tags. Shown on the Finish step, after ingredients and directions,
 * so auto-detect has the recipe text to work from.
 */
export function TagsFields({ form }: { form: RecipeForm }) {
  const { palette } = useAppSettings();
  const { values } = form;
  const [tagTab, setTagTab] = useState<'friendly' | 'allergen'>('friendly');

  return (
    <View style={styles.wizardField}>
      <View style={styles.wizardSectionHeading}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.wizardHeading, { color: palette.text }]}>Tags</Text>
          <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>Help you find this recipe later.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={form.applyDetectedTags} hitSlop={6}>
          <Text style={[styles.wizardTinyLink, { color: palette.accentText }]}>Auto-detect</Text>
        </Pressable>
      </View>
      <View style={[styles.wizardSegment, { borderColor: palette.borderAlt, backgroundColor: palette.elevated }]}>
        {(
          [
            { key: 'friendly', label: 'Allergy-friendly tags' },
            { key: 'allergen', label: 'Allergen tags' },
          ] as const
        ).map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tagTab === tab.key }}
            onPress={() => setTagTab(tab.key)}
            style={[styles.wizardSegmentOption, tagTab === tab.key && { backgroundColor: palette.accentSoft }]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.wizardChipText,
                { color: tagTab === tab.key ? palette.accentContrastText : palette.text },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.wizardChipGrid}>
        {tagTab === 'friendly'
          ? allergyFriendlyTagOptions.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={values.allergyFriendlyTags.includes(tag)}
                onPress={() => form.toggleFriendly(tag)}
              />
            ))
          : allergenTagOptions.map((tag) => (
              <Chip
                key={tag}
                label={tag.replace(/^Contains /, '')}
                selected={values.allergenTags.includes(tag)}
                onPress={() => form.toggleAllergen(tag)}
              />
            ))}
      </View>
    </View>
  );
}
