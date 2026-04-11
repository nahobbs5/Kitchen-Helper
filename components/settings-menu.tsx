import { Modal, Pressable, Switch, Text, View } from 'react-native';

import { kitchenStyles as styles } from './kitchen-styles';
import { useAppSettings } from '../contexts/settings-context';

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
  const {
    closeSettings,
    darkModeEnabled,
    isSettingsOpen,
    keepScreenAwake,
    palette,
    toggleDarkMode,
    toggleKeepScreenAwake,
  } = useAppSettings();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={isSettingsOpen}
      onRequestClose={closeSettings}
    >
      <View style={styles.settingsOverlay}>
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
              <Switch
                value={darkModeEnabled}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#b89b81', true: '#f0b35f' }}
                thumbColor={darkModeEnabled ? '#7a2f1d' : '#fff7ea'}
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
              <Switch
                value={keepScreenAwake}
                onValueChange={toggleKeepScreenAwake}
                trackColor={{ false: '#b89b81', true: '#f0b35f' }}
                thumbColor={keepScreenAwake ? '#7a2f1d' : '#fff7ea'}
              />
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
            <Text style={[styles.settingsCloseText, { color: palette.accentContrastText }]}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
