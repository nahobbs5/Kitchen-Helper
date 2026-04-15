import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { kitchenStyles as styles } from './kitchen-styles';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useCookTimer } from '../contexts/cook-timer-context';
import { useAppSettings } from '../contexts/settings-context';
import { buildExportRecipes, exportRecipesToPdf } from '../utils/export-recipes';

export function ReferenceButton() {
  const router = useRouter();
  const { palette } = useAppSettings();

  return (
    <Pressable
      onPress={() => router.push('/reference')}
      accessibilityRole="button"
      accessibilityLabel="Open kitchen reference"
      style={[
        styles.settingsGearButton,
        {
          backgroundColor: palette.elevated,
          borderColor: palette.borderAlt,
        },
      ]}
    >
      <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>📖</Text>
    </Pressable>
  );
}

export function CookTimerButton() {
  const { openCookTimer } = useCookTimer();
  const { palette } = useAppSettings();

  return (
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
  );
}

export function SettingsGearButton() {
  const { openSettings, palette } = useAppSettings();

  return (
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
  );
}

export function SettingsMenuModal() {
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
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
  const [resetDefaultsChecked, setResetDefaultsChecked] = useState(false);
  const { customRecipes, loaded, recipeOverrideMap } = useCustomRecipes();

  const exportRecipes = useMemo(
    () => buildExportRecipes({ customRecipes, recipeOverrideMap }),
    [customRecipes, recipeOverrideMap]
  );

  useEffect(() => {
    setTimerCountInput(String(timerCount));
  }, [timerCount]);

  if (!isSettingsOpen) {
    return null;
  }

  async function handleExportRecipes() {
    if (isExporting || !loaded) {
      return;
    }

    setExportError(null);
    setExportMessage(null);
    setIsExporting(true);

    try {
      const result = await exportRecipesToPdf(exportRecipes);
      setExportMessage(result.message);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Recipe export failed. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  }

  function handleResetDefaults() {
    setResetDefaultsChecked(true);
    resetToDefaults();
    setTimerCountInput('3');
    setTimeout(() => {
      setResetDefaultsChecked(false);
    }, 0);
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
                onChangeText={(text) => {
                  setTimerCountInput(text);
                  const n = parseInt(text, 10);
                  if (!isNaN(n) && n >= 1 && n <= 6) {
                    setTimerCount(n);
                  }
                }}
                onBlur={() => {
                  const n = parseInt(timerCountInput, 10);
                  if (isNaN(n) || n < 1 || n > 6) {
                    setTimerCountInput(String(timerCount));
                  }
                }}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  styles.numberButton,
                  {
                    width: 72,
                    textAlign: 'center',
                    backgroundColor: palette.elevatedAlt,
                    borderColor: palette.borderAlt,
                    color: palette.text,
                  },
                ]}
              />
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

          <View
            style={[
              styles.settingsSection,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>Export</Text>
            <View style={styles.settingsCopy}>
              <Text style={[styles.settingsLabel, { color: palette.text }]}>Export all recipes to PDF</Text>
              <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                Create one cookbook-style PDF from the full library, including app recipes and local
                overrides.
              </Text>
              <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                {exportRecipes.length} recipe{exportRecipes.length === 1 ? '' : 's'} ready to export.
              </Text>
            </View>
            <Pressable
              onPress={handleExportRecipes}
              disabled={isExporting || !loaded}
              style={[
                styles.settingsCloseButton,
                {
                  backgroundColor: isExporting || !loaded ? palette.borderAlt : palette.accent,
                },
              ]}
            >
              <Text style={[styles.settingsCloseText, { color: palette.accentContrastText }]}>
                {isExporting ? 'Exporting…' : 'Export all recipes to PDF'}
              </Text>
            </Pressable>
            {exportMessage ? (
              <Text style={[styles.settingsHint, { color: palette.accentText }]}>{exportMessage}</Text>
            ) : null}
            {exportError ? (
              <Text style={[styles.settingsHint, { color: '#b14c2f' }]}>{exportError}</Text>
            ) : null}
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
