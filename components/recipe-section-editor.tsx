import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

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

function createBlankSection(title: string | null = null): RecipeSection {
  return { title, items: [''] };
}

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
  const [mode, setMode] = useState<'plain' | 'structured'>('plain');
  const normalizedSections = useMemo(() => normalizeRecipeSections(sections), [sections]);
  const plainText = useMemo(
    () => formatRecipeSections(sections, { ordered }),
    [ordered, sections]
  );
  const [plainDraft, setPlainDraft] = useState(plainText);
  const editableSections = sections.length > 0 ? sections : [createBlankSection()];

  useEffect(() => {
    const draftSections = parseRecipeSectionsText(plainDraft, { ordered });
    const normalizedDraft = formatRecipeSections(draftSections, { ordered });

    if (normalizedDraft !== plainText) {
      setPlainDraft(plainText);
    }
  }, [ordered, plainDraft, plainText]);

  function setSectionTitle(sectionIndex: number, title: string) {
    onChange(
      editableSections.map((section, index) =>
        index === sectionIndex ? { ...section, title } : section
      )
    );
  }

  function setSectionItem(sectionIndex: number, itemIndex: number, value: string) {
    onChange(
      editableSections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              items:
                section.items.length === 0
                  ? [value]
                  : section.items.map((item, currentItemIndex) =>
                      currentItemIndex === itemIndex ? value : item
                    ),
            }
          : section
      )
    );
  }

  function addSection() {
    onChange([...editableSections, createBlankSection('New section')]);
  }

  function removeSection(sectionIndex: number) {
    const nextSections = editableSections.filter((_, index) => index !== sectionIndex);
    onChange(nextSections.length > 0 ? nextSections : [createBlankSection()]);
  }

  function addLine(sectionIndex: number) {
    onChange(
      editableSections.map((section, index) =>
        index === sectionIndex ? { ...section, items: [...section.items, ''] } : section
      )
    );
  }

  function removeLine(sectionIndex: number, itemIndex: number) {
    onChange(
      editableSections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              items: section.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex),
            }
          : section
      )
    );
  }

  return (
    <View style={styles.formField}>
      <View style={styles.detailCardHeader}>
        <View style={styles.detailCardTitleBlock}>
          <Text style={[styles.formLabel, { color: palette.accentText }]}>{label}</Text>
          <Text style={[styles.formHint, { color: palette.textSoft }]}>{hint}</Text>
        </View>
        <View style={styles.detailCardActionRow}>
          {(['plain', 'structured'] as const).map((option) => {
            const isActive = mode === option;

            return (
              <Pressable
                key={option}
                onPress={() => setMode(option)}
                style={[
                  styles.secondaryButton,
                  { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                  isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                ]}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: isActive ? palette.inverseText : palette.accentText },
                  ]}
                >
                  {option === 'plain' ? 'Text' : 'Sections'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {mode === 'plain' ? (
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
      ) : (
        <View style={styles.formStack}>
          {editableSections.map((section, sectionIndex) => (
            <View
              key={`section-${sectionIndex}`}
              style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
            >
              <TextInput
                value={section.title ?? ''}
                onChangeText={(value) => setSectionTitle(sectionIndex, value)}
                placeholder="Optional section header"
                placeholderTextColor={palette.searchPlaceholder}
                style={[
                  styles.formInput,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt, color: palette.text },
                ]}
              />
              {(section.items.length > 0 ? section.items : ['']).map((item, itemIndex) => (
                <View key={`item-${itemIndex}`} style={styles.formField}>
                  <TextInput
                    value={item}
                    onChangeText={(value) => setSectionItem(sectionIndex, itemIndex, value)}
                    placeholder={ordered ? 'Recipe step' : 'Ingredient line'}
                    placeholderTextColor={palette.searchPlaceholder}
                    multiline={ordered}
                    style={[
                      styles.formInput,
                      ordered && styles.formTextAreaCompact,
                      { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt, color: palette.text },
                    ]}
                  />
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => removeLine(sectionIndex, itemIndex)}
                      style={[
                        styles.secondaryButton,
                        { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                      ]}
                    >
                      <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Remove line</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => addLine(sectionIndex)}
                  style={[
                    styles.secondaryButton,
                    { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Add line</Text>
                </Pressable>
                <Pressable
                  onPress={() => removeSection(sectionIndex)}
                  style={[
                    styles.secondaryButton,
                    { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Remove section</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <View style={styles.actionRow}>
            <Pressable
              onPress={addSection}
              style={[
                styles.secondaryButton,
                { backgroundColor: palette.surface, borderColor: palette.borderAlt },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Add section</Text>
            </Pressable>
          </View>
        </View>
      )}

      {error ? <Text style={[styles.formHint, { color: palette.accent }]}>{error}</Text> : null}
      {normalizedSections.some((section) => section.title) ? (
        <Text style={[styles.formHint, { color: palette.textSoft }]}>
          Section headers will appear in recipe details, sharing, and PDF export.
        </Text>
      ) : null}
    </View>
  );
}
