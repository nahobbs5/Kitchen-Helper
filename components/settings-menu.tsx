import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { kitchenStyles as styles } from './kitchen-styles';
import { useCookTimer } from '../contexts/cook-timer-context';
import { MAX_TIMER_COUNT, MIN_TIMER_COUNT, useAppSettings } from '../contexts/settings-context';

const TIMER_COUNT_ERROR_MESSAGE = `Enter a number from ${MIN_TIMER_COUNT} to ${MAX_TIMER_COUNT}.`;

function parseTimerCountInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function HeaderTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const { palette } = useAppSettings();

  return (
    <View
      style={{ position: 'relative', overflow: 'visible' }}
      {...({
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      } as any)}
    >
      {children}
      {hovered && (
        <View
          style={{
            position: 'absolute',
            top: 42,
            left: -26,
            width: 90,
            alignItems: 'center',
            zIndex: 1000,
          }}
          pointerEvents="none"
        >
          <View
            style={{
              backgroundColor: palette.elevated,
              borderColor: palette.borderAlt,
              borderWidth: 1,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: palette.textMuted, fontSize: 11 }}>{label}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export function ReferenceButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useAppSettings();
  const isReferenceScreen = pathname === '/reference';

  return (
    <HeaderTooltip label="Reference">
      <Pressable
        onPress={() => {
          if (!isReferenceScreen) {
            router.push('/reference');
          }
        }}
        disabled={isReferenceScreen}
        accessibilityRole="button"
        accessibilityLabel="Open kitchen reference"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
            opacity: isReferenceScreen ? 0.45 : 1,
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>📖</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function HomeButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useAppSettings();
  const isHomeScreen = pathname === '/';

  return (
    <HeaderTooltip label="Home">
      <Pressable
        onPress={() => {
          if (!isHomeScreen) {
            router.replace('/');
          }
        }}
        disabled={isHomeScreen}
        accessibilityRole="button"
        accessibilityLabel="Go to home screen"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
            opacity: isHomeScreen ? 0.45 : 1,
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>🏠</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function MyRecipesButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useAppSettings();
  const isMyRecipesScreen = pathname === '/my-recipes';

  return (
    <HeaderTooltip label="My Recipes">
      <Pressable
        onPress={() => {
          if (!isMyRecipesScreen) {
            router.push('/my-recipes');
          }
        }}
        disabled={isMyRecipesScreen}
        accessibilityRole="button"
        accessibilityLabel="Open my recipes"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
            opacity: isMyRecipesScreen ? 0.45 : 1,
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>🍳</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function CookTimerButton() {
  const { openCookTimer } = useCookTimer();
  const { palette } = useAppSettings();

  return (
    <HeaderTooltip label="Cook Timer">
      <Pressable
        onPress={openCookTimer}
        accessibilityRole="button"
        accessibilityLabel="Open cook timer"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>⏳</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function SettingsGearButton() {
  const { openSettings, palette } = useAppSettings();

  return (
    <HeaderTooltip label="Settings">
      <Pressable
        onPress={openSettings}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>⚙</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function AccountButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useAppSettings();
  const isAccountScreen = pathname === '/account';

  return (
    <HeaderTooltip label="Account">
      <Pressable
        onPress={() => {
          if (!isAccountScreen) {
            router.push('/account');
          }
        }}
        disabled={isAccountScreen}
        accessibilityRole="button"
        accessibilityLabel="Open account"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
            opacity: isAccountScreen ? 0.45 : 1,
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>👤</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function SettingsMenuModal() {
  const {
    closeSettings,
    confirmDeleteEnabled,
    darkModeEnabled,
    isSettingsOpen,
    keepScreenAwake,
    palette,
    resetToDefaults,
    timerCount,
    toggleConfirmDelete,
    toggleDarkMode,
    toggleKeepScreenAwake,
    setTimerCount,
  } = useAppSettings();
  const [timerCountInput, setTimerCountInput] = useState(String(timerCount));
  const [timerCountError, setTimerCountError] = useState('');
  const [resetDefaultsChecked, setResetDefaultsChecked] = useState(false);

  useEffect(() => {
    setTimerCountInput(String(timerCount));
    setTimerCountError('');
  }, [timerCount]);

  if (!isSettingsOpen) {
    return null;
  }

  function handleResetDefaults() {
    setResetDefaultsChecked(true);
    resetToDefaults();
    setTimerCountInput('3');
    setTimerCountError('');
    setTimeout(() => {
      setResetDefaultsChecked(false);
    }, 0);
  }

  function handleTimerCountChange(text: string) {
    setTimerCountInput(text);

    const nextTimerCount = parseTimerCountInput(text);

    if (
      nextTimerCount === null ||
      nextTimerCount < MIN_TIMER_COUNT ||
      nextTimerCount > MAX_TIMER_COUNT
    ) {
      setTimerCountError(TIMER_COUNT_ERROR_MESSAGE);
      return;
    }

    setTimerCountError('');
    setTimerCount(nextTimerCount);
  }

  return (
    <View style={styles.settingsOverlay} pointerEvents="box-none">
      <Pressable style={styles.settingsBackdrop} onPress={closeSettings} />
      <View
        style={[
          styles.settingsSheet,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
          },
        ]}
      >
        <ScrollView
          style={styles.settingsScroll}
          contentContainerStyle={styles.settingsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.settingsEyebrow, { color: palette.accentText }]}>Settings</Text>
          <Text style={[styles.settingsTitle, { color: palette.text }]}>Kitchen preferences</Text>
          <Text style={[styles.settingsBody, { color: palette.textMuted }]}>
            These options are saved on this device so the app keeps the same feel the next time
            you open it.
          </Text>

          <View style={[styles.settingsRow, { justifyContent: 'center', gap: 10 }]}>
            <View style={[styles.settingsCopy, { flex: 1, maxWidth: 220 }]}>
              <Text style={[styles.settingsLabel, { color: palette.text }]}>Restore defaults</Text>
            </View>
            <Pressable
              onPress={handleResetDefaults}
              style={[
                styles.numberButton,
                {
                  minWidth: 72,
                  backgroundColor: resetDefaultsChecked ? palette.accentSoft : palette.elevatedAlt,
                  borderColor: resetDefaultsChecked ? palette.accentSoft : palette.borderAlt,
                },
              ]}
            >
              <Text
                style={[
                  styles.numberButtonText,
                  { color: resetDefaultsChecked ? palette.accentContrastText : palette.text },
                ]}
              >
                {resetDefaultsChecked ? '☑' : '☐'}
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.settingsSection,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>Appearance</Text>
            <View style={styles.settingsRow}>
              <View style={styles.settingsCopy}>
                <Text style={[styles.settingsLabel, { color: palette.text }]}>Dark mode</Text>
                <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                  Switch the app to a darker reading palette on web and Android.
                </Text>
              </View>
              <Pressable
                onPress={() => toggleDarkMode()}
                style={[
                  styles.numberButton,
                  {
                    minWidth: 72,
                    backgroundColor: darkModeEnabled ? palette.accentSoft : palette.elevatedAlt,
                    borderColor: darkModeEnabled ? palette.accentSoft : palette.borderAlt,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numberButtonText,
                    { color: darkModeEnabled ? palette.accentContrastText : palette.text },
                  ]}
                >
                  {darkModeEnabled ? 'On' : 'Off'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.settingsRow}>
              <View style={styles.settingsCopy}>
                <Text style={[styles.settingsLabel, { color: palette.text }]}>Number of timers</Text>
                <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                  How many timer slots to show in the cook timer (1–6).
                </Text>
              </View>
              <TextInput
                value={timerCountInput}
                onChangeText={handleTimerCountChange}
                onBlur={() => {
                  if (timerCountError) {
                    setTimerCountError(TIMER_COUNT_ERROR_MESSAGE);
                  }
                }}
                keyboardType="number-pad"
                style={[
                  styles.numberButton,
                  timerCountError ? styles.timerCountInputError : null,
                  {
                    width: 72,
                    textAlign: 'center',
                    backgroundColor: palette.elevatedAlt,
                    borderColor: timerCountError ? '#b3261e' : palette.borderAlt,
                    color: palette.text,
                  },
                ]}
              />
            </View>
            {timerCountError ? (
              <Text style={[styles.timerCountErrorText, { color: '#b3261e' }]}>
                {timerCountError}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.settingsSection,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>Cook mode</Text>
            <View style={styles.settingsRow}>
              <View style={styles.settingsCopy}>
                <Text style={[styles.settingsLabel, { color: palette.text }]}>Keep screen awake</Text>
                <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                  Prevent the screen from turning off while the app stays open.
                </Text>
              </View>
              <Pressable
                onPress={() => toggleKeepScreenAwake()}
                style={[
                  styles.numberButton,
                  {
                    minWidth: 72,
                    backgroundColor: keepScreenAwake ? palette.accentSoft : palette.elevatedAlt,
                    borderColor: keepScreenAwake ? palette.accentSoft : palette.borderAlt,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numberButtonText,
                    { color: keepScreenAwake ? palette.accentContrastText : palette.text },
                  ]}
                >
                  {keepScreenAwake ? 'On' : 'Off'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View
            style={[
              styles.settingsSection,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>Recipe management</Text>
            <View style={styles.settingsRow}>
              <View style={styles.settingsCopy}>
                <Text style={[styles.settingsLabel, { color: palette.text }]}>Confirm delete</Text>
                <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                  Ask before deleting a saved app recipe. Turn this off for faster cleanup. Does not
                  apply to bulk deletes.
                </Text>
              </View>
              <Pressable
                onPress={() => toggleConfirmDelete()}
                style={[
                  styles.numberButton,
                  {
                    minWidth: 72,
                    backgroundColor: confirmDeleteEnabled ? palette.accentSoft : palette.elevatedAlt,
                    borderColor: confirmDeleteEnabled ? palette.accentSoft : palette.borderAlt,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numberButtonText,
                    { color: confirmDeleteEnabled ? palette.accentContrastText : palette.text },
                  ]}
                >
                  {confirmDeleteEnabled ? 'On' : 'Off'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={closeSettings}
            style={[
              styles.settingsCloseButton,
              {
                backgroundColor: palette.accent,
              },
            ]}
          >
            <Text style={[styles.settingsCloseText, { color: palette.accentContrastText }]}>Save</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
