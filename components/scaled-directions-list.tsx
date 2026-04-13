import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { AppPalette } from './app-theme';
import { kitchenStyles as styles } from './kitchen-styles';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import type { RecipeSection } from '../data/obsidian-recipes';
import {
  analyzeScaledDirections,
  type DirectionHighlightRange,
} from '../utils/scaled-directions';

type ScaledDirectionsListProps = {
  slug: string;
  source: 'custom' | 'obsidian';
  baseDirections: RecipeSection[];
  displayDirections: RecipeSection[];
  stepOverrides?: Record<string, string>;
  scale: number;
  palette: AppPalette;
};

function highlightStyle(type: DirectionHighlightRange['type'], palette: AppPalette) {
  switch (type) {
    case 'time':
      return { backgroundColor: palette.tag, color: palette.tagText };
    case 'temperature':
      return { backgroundColor: '#f9d6c4', color: '#7a2f1d' };
    case 'doneness':
      return { backgroundColor: '#dce9c9', color: '#33511c' };
    default:
      return { color: palette.textMuted };
  }
}

function HighlightedStepText({
  text,
  highlights,
  palette,
}: {
  text: string;
  highlights: DirectionHighlightRange[];
  palette: AppPalette;
}) {
  if (highlights.length === 0) {
    return <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{text}</Text>;
  }

  const segments: Array<{ text: string; type?: DirectionHighlightRange['type'] }> = [];
  let cursor = 0;

  for (const highlight of highlights) {
    if (highlight.start > cursor) {
      segments.push({ text: text.slice(cursor, highlight.start) });
    }

    segments.push({
      text: text.slice(highlight.start, highlight.end),
      type: highlight.type,
    });
    cursor = highlight.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return (
    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
      {segments.map((segment, index) => (
        <Text
          key={`${segment.text}-${index}`}
          style={
            segment.type
              ? [
                  styles.directionHighlight,
                  highlightStyle(segment.type, palette),
                ]
              : undefined
          }
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}

export function ScaledDirectionsList({
  slug,
  source,
  baseDirections,
  displayDirections,
  stepOverrides,
  scale,
  palette,
}: ScaledDirectionsListProps) {
  const { resetDirectionStep, updateDirectionStep } = useCustomRecipes();
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');

  const steps = useMemo(
    () =>
      analyzeScaledDirections({
        baseSections: baseDirections,
        displaySections: displayDirections,
        stepOverrides,
        scale,
      }),
    [baseDirections, displayDirections, scale, stepOverrides]
  );

  if (steps.length === 0) {
    return (
      <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>No directions were detected.</Text>
      </View>
    );
  }

  return (
    <View style={styles.listStack}>
      {steps.map((step) => {
        const isEditing = editingStepId === step.id;

        return (
          <View
            key={step.id}
            style={[
              styles.detailCard,
              { backgroundColor: palette.surface, borderColor: palette.borderAlt },
              step.isEdited && styles.editedDirectionCard,
            ]}
          >
            <View style={styles.directionStepHeader}>
              <View style={styles.directionStepMeta}>
                {step.sectionTitle ? (
                  <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{step.sectionTitle}</Text>
                ) : null}
                <Text style={[styles.directionStepNumber, { color: palette.text }]}>Step {step.stepNumber}</Text>
              </View>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => {
                    setEditingStepId(step.id);
                    setDraftText(step.displayText);
                  }}
                  style={[
                    styles.secondaryButton,
                    { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>
                    {isEditing ? 'Editing' : 'Edit'}
                  </Text>
                </Pressable>
                {step.isEdited ? (
                  <Pressable
                    onPress={() => {
                      resetDirectionStep(slug, step.id, source);
                      if (editingStepId === step.id) {
                        setEditingStepId(null);
                        setDraftText('');
                      }
                    }}
                    style={[
                      styles.secondaryButton,
                      { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                    ]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Reset</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {step.isEdited ? (
              <View style={styles.tagRow}>
                <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                  <Text style={[styles.tagText, { color: palette.tagText }]}>Edited locally</Text>
                </View>
              </View>
            ) : null}

            {isEditing ? (
              <View style={styles.formStack}>
                <TextInput
                  value={draftText}
                  onChangeText={setDraftText}
                  multiline
                  style={[
                    styles.formInput,
                    styles.formTextAreaCompact,
                    { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt, color: palette.text },
                  ]}
                />
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => {
                      setEditingStepId(null);
                      setDraftText('');
                    }}
                    style={[
                      styles.secondaryButton,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                    ]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const nextText = draftText.trim();
                      if (!nextText) {
                        return;
                      }

                      updateDirectionStep(slug, step.id, nextText, source);
                      setEditingStepId(null);
                      setDraftText('');
                    }}
                    style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>Save Step</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <HighlightedStepText text={step.displayText} highlights={step.highlights} palette={palette} />
            )}

            {!isEditing && step.annotations.length > 0 ? (
              <View style={styles.directionAnnotationStack}>
                {step.annotations.map((annotation) => (
                  <View
                    key={`${step.id}-${annotation.type}-${annotation.message}`}
                    style={[
                      styles.directionAnnotationCard,
                      annotation.severity === 'warning'
                        ? { backgroundColor: '#fff1e8', borderColor: '#e8b08a' }
                        : { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                    ]}
                  >
                    <Text
                      style={[
                        styles.directionAnnotationLabel,
                        { color: annotation.severity === 'warning' ? '#9b4c20' : palette.accentText },
                      ]}
                    >
                      {annotation.type.replace(/-/g, ' ')}
                    </Text>
                    <Text style={[styles.directionAnnotationText, { color: palette.textMuted }]}>
                      {annotation.message}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
