import { useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

import type { AppPalette } from './app-theme';
import { kitchenStyles as styles } from './kitchen-styles';
import { useCookTimer } from '../contexts/cook-timer-context';
import type { RecipeSection } from '../data/obsidian-recipes';
import {
  analyzeScaledDirections,
  type DirectionAnnotation,
  type DirectionHighlightRange,
  getTimeHighlights,
  parseHighlightedTimeMs,
} from '../utils/scaled-directions';

type ActiveMessage = {
  label: string;
  annotations: DirectionAnnotation[];
};

type ScaledDirectionsListProps = {
  baseDirections: RecipeSection[];
  displayDirections: RecipeSection[];
  stepOverrides?: Record<string, string>;
  scale: number;
  palette: AppPalette;
  emptyMessage?: string;
  recipeName?: string;
};

type RecipeDirectionsListProps = {
  directions: RecipeSection[];
  palette: AppPalette;
  emptyMessage: string;
  recipeName?: string;
};

function highlightStyle(type: DirectionHighlightRange['type'], palette: AppPalette) {
  switch (type) {
    case 'time':
      return { backgroundColor: palette.tag, color: palette.tagText };
    case 'temperature':
      return { backgroundColor: palette.highlightTemp, color: palette.highlightTempText };
    case 'doneness':
      return { backgroundColor: palette.highlightDoneness, color: palette.highlightDonenessText };
    case 'cook-method':
      return { backgroundColor: palette.highlightMethod, color: palette.highlightMethodText };
    case 'equipment':
      return { backgroundColor: palette.highlightEquipment, color: palette.highlightEquipmentText };
    default:
      return { color: palette.textMuted };
  }
}

function HighlightedStepText({
  text,
  highlights,
  palette,
  onTimeTap,
  onMessageTap,
  prefix,
}: {
  text: string;
  highlights: DirectionHighlightRange[];
  palette: AppPalette;
  onTimeTap?: (highlightText: string) => void;
  onMessageTap?: (annotations: DirectionAnnotation[]) => void;
  prefix?: string;
}) {
  if (highlights.length === 0) {
    return (
      <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
        {prefix}{text}
      </Text>
    );
  }

  const segments: Array<{
    text: string;
    type?: DirectionHighlightRange['type'];
    annotations?: DirectionAnnotation[];
  }> = [];
  let cursor = 0;

  for (const highlight of highlights) {
    if (highlight.start > cursor) {
      segments.push({ text: text.slice(cursor, highlight.start) });
    }

    segments.push({
      text: text.slice(highlight.start, highlight.end),
      type: highlight.type,
      annotations: highlight.annotations,
    });
    cursor = highlight.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return (
    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
      {prefix}
      {segments.map((segment, index) => {
        const isTappableTime = segment.type === 'time' && !!onTimeTap;
        const hasMessage = !isTappableTime && !!segment.annotations?.length && !!onMessageTap;
        const isTappable = isTappableTime || hasMessage;
        return (
          <Text
            key={`${segment.text}-${index}`}
            style={
              segment.type
                ? [
                    styles.directionHighlight,
                    highlightStyle(segment.type, palette),
                    isTappable && { textDecorationLine: 'underline' },
                  ]
                : undefined
            }
            onPress={
              isTappableTime
                ? () => onTimeTap(segment.text)
                : hasMessage
                  ? () => onMessageTap(segment.annotations!)
                  : undefined
            }
            suppressHighlighting={!isTappable}
          >
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
}

export function RecipeDirectionsList({
  directions,
  palette,
  emptyMessage,
  recipeName,
}: RecipeDirectionsListProps) {
  const { loadTimerSlot, openCookTimer } = useCookTimer();

  function handleTimeTap(highlightText: string, stepNumber: number) {
    const durationMs = parseHighlightedTimeMs(highlightText);
    if (durationMs <= 0) return;
    const label = recipeName ? `${recipeName} · Step ${stepNumber}` : `Step ${stepNumber}`;
    const loaded = loadTimerSlot(label, durationMs);
    if (loaded) openCookTimer();
  }

  if (directions.length === 0) {
    return <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{emptyMessage}</Text>;
  }

  let overallStep = 0;

  return (
    <View style={styles.listStack}>
      {directions.map((section, sectionIndex) => (
        <View
          key={`${section.title ?? 'directions'}-${sectionIndex}`}
          style={styles.recipeFlatGroup}
        >
          {section.title ? (
            <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{section.title}</Text>
          ) : null}
          {section.items.map((item, itemIndex) => {
            overallStep += 1;
            const stepNumber = overallStep;
            const highlights = getTimeHighlights(item);
            return (
              <HighlightedStepText
                key={`${itemIndex}-${item}`}
                prefix={`${itemIndex + 1}. `}
                text={item}
                highlights={highlights}
                palette={palette}
                onTimeTap={(t) => handleTimeTap(t, stepNumber)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function ScaledDirectionsList({
  baseDirections,
  displayDirections,
  stepOverrides,
  scale,
  palette,
  emptyMessage = 'No directions were detected.',
  recipeName,
}: ScaledDirectionsListProps) {
  const { loadTimerSlot, openCookTimer } = useCookTimer();
  const [activeMessage, setActiveMessage] = useState<ActiveMessage | null>(null);

  function handleTimeTap(highlightText: string, stepNumber: number) {
    const durationMs = parseHighlightedTimeMs(highlightText);
    if (durationMs <= 0) return;
    const label = recipeName ? `${recipeName} · Step ${stepNumber}` : `Step ${stepNumber}`;
    const loaded = loadTimerSlot(label, durationMs);
    if (loaded) openCookTimer();
  }

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
    return <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>{emptyMessage}</Text>;
  }

  return (
    <View style={styles.listStack}>
      {steps.map((step) => (
        <View key={step.id} style={styles.recipeFlatGroup}>
          <View style={styles.directionStepMeta}>
            {step.sectionTitle ? (
              <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{step.sectionTitle}</Text>
            ) : null}
            <Text style={[styles.directionStepNumber, { color: palette.text }]}>Step {step.stepNumber}</Text>
          </View>

          <HighlightedStepText
            text={step.displayText}
            highlights={step.highlights}
            palette={palette}
            onTimeTap={(highlightText) => handleTimeTap(highlightText, step.stepNumber)}
            onMessageTap={(annotations) =>
              setActiveMessage({ label: `Step ${step.stepNumber}`, annotations })
            }
          />

          {step.annotations.length > 0 ? (
            <View style={styles.directionAnnotationStack}>
              {step.annotations.map((annotation) => (
                <View
                  key={`${step.id}-${annotation.type}-${annotation.message}`}
                  style={[
                    styles.directionAnnotationCard,
                    annotation.severity === 'warning'
                      ? { backgroundColor: palette.warningBg, borderColor: palette.warningBorder }
                      : { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  ]}
                >
                  <Text
                    style={[
                      styles.directionAnnotationLabel,
                      { color: annotation.severity === 'warning' ? palette.warningText : palette.accentText },
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
      ))}

      <Modal
        visible={!!activeMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveMessage(null)}
      >
        <View style={styles.settingsOverlay}>
          <Pressable style={styles.settingsBackdrop} onPress={() => setActiveMessage(null)} />
          <SafeAreaView
            style={[
              styles.settingsSheet,
              { backgroundColor: palette.elevated, borderColor: palette.borderAlt, gap: 12 },
            ]}
          >
            <Text style={[styles.settingsTitle, { color: palette.text, fontSize: 18 }]}>
              {activeMessage?.label}
            </Text>
            <ScrollView contentContainerStyle={{ gap: 10 }}>
              {(activeMessage?.annotations ?? []).map((annotation) => (
                <View
                  key={`${annotation.type}-${annotation.message}`}
                  style={[
                    styles.directionAnnotationCard,
                    annotation.severity === 'warning'
                      ? { backgroundColor: palette.warningBg, borderColor: palette.warningBorder }
                      : { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                  ]}
                >
                  <Text
                    style={[
                      styles.directionAnnotationLabel,
                      { color: annotation.severity === 'warning' ? palette.warningText : palette.accentText },
                    ]}
                  >
                    {annotation.type.replace(/-/g, ' ')}
                  </Text>
                  <Text style={[styles.directionAnnotationText, { color: palette.textMuted }]}>
                    {annotation.message}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setActiveMessage(null)}
              style={[styles.settingsCloseButton, { backgroundColor: palette.accent }]}
            >
              <Text style={[styles.settingsCloseText, { color: palette.accentContrastText }]}>Close</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
