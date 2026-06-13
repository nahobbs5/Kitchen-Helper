import { Platform, Vibration } from 'react-native';

/**
 * Short pickup haptic for drag-to-reorder, gated by the user's setting and to
 * mobile platforms only (no-op on web). Uses React Native's built-in Vibration
 * so the web bundle stays dependency-free.
 *
 * For a genuinely light tap on iOS, install expo-haptics
 * (`npx expo install expo-haptics`) and replace the Vibration call with
 * `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.
 */
export function triggerReorderHaptic(enabled: boolean) {
  if (!enabled) {
    return;
  }

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return;
  }

  Vibration.vibrate(15);
}
