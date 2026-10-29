import { Linking } from 'react-native';

/**
 * Optional link to a hosted privacy policy. Rows that point to it stay hidden until
 * EXPO_PUBLIC_PRIVACY_POLICY_URL is set, so the app never links to a page that doesn't exist.
 */
export const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() || null;

export function openPrivacyPolicy() {
  if (PRIVACY_POLICY_URL) {
    void Linking.openURL(PRIVACY_POLICY_URL);
  }
}

/** "just now", "5 min ago", "2 hours ago", "3 days ago". */
export function formatTimeAgo(timestamp: number, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
