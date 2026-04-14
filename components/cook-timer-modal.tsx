import { useEffect } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, Vibration, useWindowDimensions, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

import { kitchenStyles as styles } from './kitchen-styles';
import { useCookTimer, formatTimerRemaining } from '../contexts/cook-timer-context';
import { useAppSettings } from '../contexts/settings-context';

const timerBeep = require('../assets/timer-beep.wav');

export function CookTimerModal() {
  const {
    closeCookTimer,
    completedEventCount,
    isCookTimerOpen,
    openCookTimer,
    resetTimer,
    timers,
    toggleTimer,
    updateTimerDurationInput,
    updateTimerLabel,
  } = useCookTimer();
  const { palette } = useAppSettings();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const player = useAudioPlayer(timerBeep);

  useEffect(() => {
    if (completedEventCount === 0) {
      return;
    }

    try {
      player.seekTo(0);
      player.play();
    } catch {}

    Vibration.vibrate([0, 220, 120, 220]);
    openCookTimer();
  }, [completedEventCount, openCookTimer, player]);

  if (!isCookTimerOpen) {
    return null;
  }

  return (
    <View style={styles.settingsOverlay}>
      <Pressable style={styles.settingsBackdrop} onPress={closeCookTimer} />
      <SafeAreaView
        style={[
          styles.settingsSheet,
          styles.timerSheet,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
          },
          isWide && { padding: 20, gap: 20 },
        ]}
      >
        <View style={styles.timerModalHeader}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[styles.settingsEyebrow, { color: palette.accentText }]}>Cook Timer</Text>
            <Text style={[styles.settingsTitle, { color: palette.text, fontSize: 20 }]}>Kitchen timers</Text>
          </View>
          <Pressable
            onPress={closeCookTimer}
            style={[styles.timerCloseButton, { position: 'absolute', right: 0, top: 0, backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
          >
            <Text style={[styles.timerCloseText, { color: palette.text }]}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.timerStack} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          {timers.map((timer) => {
            const progress = timer.durationMs > 0 ? timer.remainingMs / timer.durationMs : 0;
            const hasFinished = !timer.active && timer.durationMs > 0 && timer.remainingMs === 0;
            const canReset = timer.active || timer.hasStarted;
            const timerName = timer.label.trim() || `Timer ${timer.id}`;

            return (
              <View
                key={timer.id}
                style={[
                  styles.settingsSection,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    padding: 12,
                    gap: 10,
                  },
                ]}
              >
                <View style={styles.timerHeaderRow}>
                  <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>{timerName}</Text>
                  <Text style={[styles.timerRemainingText, { color: hasFinished ? palette.accent : palette.textMuted }]}>
                    {hasFinished ? 'Done' : formatTimerRemaining(timer.remainingMs)}
                  </Text>
                </View>

                <TextInput
                  value={timer.label}
                  onChangeText={(value) => updateTimerLabel(timer.id, value)}
                  placeholder={`Timer ${timer.id} name`}
                  placeholderTextColor={palette.searchPlaceholder}
                  editable={!timer.active}
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: palette.elevated,
                      borderColor: palette.borderAlt,
                      color: palette.text,
                    },
                  ]}
                />

                <TextInput
                  value={timer.durationInput}
                  onChangeText={(value) => updateTimerDurationInput(timer.id, value)}
                  placeholder="5 or 1:30"
                  placeholderTextColor={palette.searchPlaceholder}
                  editable={!timer.active}
                  style={[
                    styles.formInput,
                    styles.timerDurationInput,
                    {
                      backgroundColor: palette.elevated,
                      borderColor: palette.borderAlt,
                      color: palette.text,
                    },
                  ]}
                />

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

                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => toggleTimer(timer.id)}
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor:
                          timer.active || timer.remainingMs > 0 || timer.durationMs > 0
                            ? palette.accent
                            : palette.borderAlt,
                      },
                    ]}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                      {timer.active ? 'Pause' : timer.hasStarted && timer.remainingMs > 0 ? 'Resume' : 'Start'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => resetTimer(timer.id)}
                    disabled={!canReset}
                    style={[
                      styles.secondaryButton,
                      {
                        backgroundColor: palette.elevated,
                        borderColor: palette.borderAlt,
                        opacity: canReset ? 1 : 0.45,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: canReset ? palette.accentText : palette.textMuted },
                      ]}
                    >
                      Reset
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={closeCookTimer}
          style={[
            styles.settingsCloseButton,
            {
              backgroundColor: palette.accent,
              marginHorizontal: 12,
              marginBottom: 12,
            },
          ]}
        >
          <Text style={[styles.settingsCloseText, { color: palette.accentContrastText }]}>Done</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
