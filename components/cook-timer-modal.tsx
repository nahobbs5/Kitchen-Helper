import { ChevronDown, ChevronUp, CirclePlus, Pause, Play, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';

import type { AppPalette } from './app-theme';
import { ClearableSearchInput } from './clearable-search-input';
import { kitchenStyles as styles } from './kitchen-styles';
import {
  formatTimerRemaining,
  isTimerLocked,
  useCookTimer,
  type CookTimerSlot,
} from '../contexts/cook-timer-context';
import { MAX_TIMER_COUNT, useAppSettings } from '../contexts/settings-context';

const PRESET_MINUTES = [5, 10, 15, 30];

const STEPPER_UNITS = [
  { key: 'h', label: 'Hours', max: 23, ms: 3600000 },
  { key: 'm', label: 'Minutes', max: 59, ms: 60000 },
  { key: 's', label: 'Seconds', max: 59, ms: 1000 },
] as const;

function splitDuration(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
}

// Inline H / M / S editor that writes back to the timer's typed value.
function DurationStepper({
  durationMs,
  onChange,
  palette,
}: {
  durationMs: number;
  onChange: (ms: number) => void;
  palette: AppPalette;
}) {
  const parts = splitDuration(durationMs);

  function setPart(key: 'h' | 'm' | 's', value: number) {
    const unit = STEPPER_UNITS.find((item) => item.key === key)!;
    const next = { ...parts, [key]: Math.max(0, Math.min(unit.max, value)) };
    onChange(next.h * 3600000 + next.m * 60000 + next.s * 1000);
  }

  return (
    <View style={[styles.timerStepperPanel, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
      {STEPPER_UNITS.map((unit) => (
        <View key={unit.key} style={styles.timerStepperColumn}>
          <Text style={[styles.timerStepperLabel, { color: palette.textMuted }]}>{unit.label}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`More ${unit.label.toLowerCase()}`}
            hitSlop={6}
            onPress={() => setPart(unit.key, parts[unit.key] + 1)}
            style={[styles.timerStepperButton, { backgroundColor: palette.tag }]}
          >
            <Text style={[styles.timerStepperGlyph, { color: palette.tagText }]}>+</Text>
          </Pressable>
          <TextInput
            value={String(parts[unit.key])}
            onChangeText={(value) => setPart(unit.key, Number(value.replace(/\D/g, '')) || 0)}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={2}
            selectTextOnFocus
            accessibilityLabel={unit.label}
            style={[styles.timerStepperValue, { color: palette.text }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Less ${unit.label.toLowerCase()}`}
            hitSlop={6}
            onPress={() => setPart(unit.key, parts[unit.key] - 1)}
            style={[styles.timerStepperButton, { backgroundColor: palette.tag }]}
          >
            <Text style={[styles.timerStepperGlyph, { color: palette.tagText }]}>−</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export function CookTimerModal() {
  const {
    addTimer,
    closeCookTimer,
    isCookTimerOpen,
    removeTimer,
    resetTimer,
    setTimerDurationMs,
    timers,
    toggleTimer,
    updateTimerDurationInput,
    updateTimerLabel,
  } = useCookTimer();
  const { palette } = useAppSettings();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [openStepperId, setOpenStepperId] = useState<number | null>(null);

  if (!isCookTimerOpen) {
    return null;
  }

  function renderTimerCard(timer: CookTimerSlot, index: number) {
    const progress = timer.durationMs > 0 ? timer.remainingMs / timer.durationMs : 0;
    const hasFinished = !timer.active && timer.durationMs > 0 && timer.remainingMs === 0;
    const locked = isTimerLocked(timer);
    const canStart = timer.active || timer.remainingMs > 0 || timer.durationMs > 0;
    const stepperOpen = openStepperId === timer.id && !timer.hasStarted;
    const startLabel = timer.active ? 'Pause' : timer.hasStarted && timer.remainingMs > 0 ? 'Resume' : 'Start';

    return (
      <View key={timer.id} style={[styles.timerCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
        <View style={styles.timerCardHeader}>
          <Text style={[styles.timerCardTitle, { color: palette.text }]}>Timer {index + 1}</Text>
          {timers.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete timer ${index + 1}`}
              accessibilityState={{ disabled: locked }}
              disabled={locked}
              onPress={() => removeTimer(timer.id)}
              style={[
                styles.timerIconButton,
                { backgroundColor: palette.tag, borderColor: palette.borderAlt, opacity: locked ? 0.4 : 1 },
              ]}
            >
              <Trash2 size={18} color={palette.accent} />
            </Pressable>
          ) : null}
        </View>

        <ClearableSearchInput
          value={timer.label}
          onChangeText={(value) => updateTimerLabel(timer.id, value)}
          placeholder="Name (e.g. Roast chicken)"
          placeholderTextColor={palette.searchPlaceholder}
          clearTintColor={palette.textSoft}
          clearAccessibilityLabel="Clear timer name"
          editable={!timer.active}
          style={[styles.searchInput, styles.timerNameInput, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
          inputStyle={{ color: palette.text, fontSize: 16 }}
        />

        <View style={styles.timerTimeRow}>
          <View style={[styles.timerTimePill, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
            {timer.hasStarted ? (
              <Text style={[styles.timerTimeText, { color: hasFinished ? palette.accent : palette.text }]}>
                {hasFinished ? 'Done' : formatTimerRemaining(timer.remainingMs)}
              </Text>
            ) : (
              <>
                <TextInput
                  value={timer.durationInput}
                  onChangeText={(value) => updateTimerDurationInput(timer.id, value.replace(/\./g, ':'))}
                  placeholder="0:00"
                  placeholderTextColor={palette.searchPlaceholder}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  accessibilityLabel={`Timer ${index + 1} duration, e.g. 5 or 1:30`}
                  style={[styles.timerTimeInput, { color: palette.text }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={stepperOpen ? 'Hide time picker' : 'Show time picker'}
                  hitSlop={8}
                  onPress={() => setOpenStepperId(stepperOpen ? null : timer.id)}
                >
                  {stepperOpen ? (
                    <ChevronUp size={20} color={palette.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={palette.textMuted} />
                  )}
                </Pressable>
              </>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setOpenStepperId(null);
              toggleTimer(timer.id);
            }}
            disabled={!canStart}
            style={[styles.timerStartButton, { backgroundColor: canStart ? palette.accent : palette.borderAlt }]}
          >
            {timer.active ? (
              <Pause size={18} color={palette.accentContrastText} fill={palette.accentContrastText} />
            ) : (
              <Play size={18} color={palette.accentContrastText} fill={palette.accentContrastText} />
            )}
            <Text style={[styles.timerStartText, { color: palette.accentContrastText }]}>{startLabel}</Text>
          </Pressable>
        </View>

        {stepperOpen ? (
          <DurationStepper
            durationMs={timer.durationMs}
            onChange={(ms) => setTimerDurationMs(timer.id, ms)}
            palette={palette}
          />
        ) : null}

        {timer.hasStarted ? (
          <>
            <View style={[styles.timerTrack, { backgroundColor: palette.borderAlt }]}>
              <View
                style={[
                  styles.timerFill,
                  {
                    backgroundColor: hasFinished ? palette.accent : palette.accentSoft,
                    width: `${Math.max(0, Math.min(progress, 1)) * 100}%`,
                  },
                ]}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => resetTimer(timer.id)}
              style={[styles.secondaryButton, styles.timerResetButton, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Reset</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.timerChipRow}>
            {PRESET_MINUTES.map((minutes) => {
              const isActive = timer.durationMs === minutes * 60000;

              return (
                <Pressable
                  key={minutes}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setTimerDurationMs(timer.id, minutes * 60000)}
                  style={[styles.timerChip, { backgroundColor: isActive ? palette.accent : palette.tag }]}
                >
                  <Text style={[styles.timerChipText, { color: isActive ? palette.accentContrastText : palette.tagText }]}>
                    {minutes} min
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.settingsOverlay}>
      <Pressable style={styles.settingsBackdrop} onPress={closeCookTimer} />
      <SafeAreaView
        style={[
          styles.settingsSheet,
          styles.timerSheet,
          { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
          isWide && { padding: 20, gap: 20 },
        ]}
      >
        <View style={styles.timerModalHeader}>
          <View style={[styles.timerHeaderArt, { backgroundColor: palette.tag }]}>
            <Text style={styles.timerHeaderArtText}>⏳</Text>
          </View>
          <View style={styles.timerHeaderCopy}>
            <Text style={[styles.timerHeaderTitle, { color: palette.text }]}>Kitchen Timers</Text>
            <Text style={[styles.timerHeaderSubtitle, { color: palette.textMuted }]}>
              Set up to {MAX_TIMER_COUNT} timers for your cooking.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close timers"
            onPress={closeCookTimer}
            style={[styles.timerIconButton, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
          >
            <X size={20} color={palette.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.timerStack}
          contentContainerStyle={styles.timerStackContent}
          keyboardShouldPersistTaps="handled"
        >
          {timers.map(renderTimerCard)}
        </ScrollView>

        {timers.length < MAX_TIMER_COUNT ? (
          <Pressable
            accessibilityRole="button"
            onPress={addTimer}
            style={[styles.timerAddButton, { backgroundColor: palette.accentSoft }]}
          >
            <CirclePlus size={22} color={palette.elevatedDark} />
            <Text style={[styles.timerAddText, { color: palette.elevatedDark }]}>Add another timer</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
