import { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import type { RecipeSection } from '../data/obsidian-recipes';
import type { AppPalette } from './app-theme';
import { kitchenStyles as styles } from './kitchen-styles';
import {
  formatRecipeSections,
  normalizeRecipeSections,
  parseRecipeSectionsText,
} from '../utils/recipe-sections';

type RecipeSectionEditorProps = {
  label: string;
  hint: string;
  placeholder: string;
  ordered?: boolean;
  sections: RecipeSection[];
  onChange: (sections: RecipeSection[]) => void;
  palette: AppPalette;
  error?: string;
};

export function RecipeSectionEditor({
  label,
  hint,
  placeholder,
  ordered = false,
  sections,
  onChange,
  palette,
  error,
}: RecipeSectionEditorProps) {
  const normalizedSections = useMemo(() => normalizeRecipeSections(sections), [sections]);
  const plainText = useMemo(
    () => formatRecipeSections(sections, { ordered }),
    [ordered, sections]
  );
  const [plainDraft, setPlainDraft] = useState(plainText);

  useEffect(() => {
    const draftSections = parseRecipeSectionsText(plainDraft, { ordered });
    const normalizedDraft = formatRecipeSections(draftSections, { ordered });

    if (normalizedDraft !== plainText) {
      setPlainDraft(plainText);
    }
  }, [ordered, plainDraft, plainText]);

  return (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { color: palette.accentText }]}>{label}</Text>
      <Text style={[styles.formHint, { color: palette.textSoft }]}>{hint}</Text>
      <TextInput
        value={plainDraft}
        onChangeText={(value) => {
          setPlainDraft(value);
          onChange(parseRecipeSectionsText(value, { ordered }));
        }}
        placeholder={placeholder}
        placeholderTextColor={palette.searchPlaceholder}
        multiline
        style={[
          styles.formInput,
          styles.formTextArea,
          { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
        ]}
      />

      {error ? <Text style={[styles.formHint, { color: palette.accent }]}>{error}</Text> : null}
      {normalizedSections.some((section) => section.title) ? (
        <Text style={[styles.formHint, { color: palette.textSoft }]}>
          Section headers will appear in recipe details, sharing, and PDF export.
        </Text>
      ) : null}
    </View>
  );
}
