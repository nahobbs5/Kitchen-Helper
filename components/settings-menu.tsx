import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { kitchenStyles as styles } from './kitchen-styles';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useCookTimer } from '../contexts/cook-timer-context';
import { useAppSettings } from '../contexts/settings-context';
import { buildExportRecipes, exportRecipesToPdf } from '../utils/export-recipes';

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
    toggleConfirmDelete,
    toggleDarkMode,
    toggleKeepScreenAwake,
  } = useAppSettings();
  const { customRecipes, loaded, recipeOverrideMap } = useCustomRecipes();

  const exportRecipes = useMemo(
    () => buildExportRecipes({ customRecipes, recipeOverrideMap }),
    [customRecipes, recipeOverrideMap]
  );

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
            <Text style={[styles.settingsCloseText, { color: palette.accentContrastText }]}>Done</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
