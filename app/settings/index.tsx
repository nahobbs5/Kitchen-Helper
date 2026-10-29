import { useRouter, type Href } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { BookOpen, ChevronRight, Clock, NotebookText, Palette, RotateCcw, Share2, type LucideIcon } from 'lucide-react-native';

import { SettingsIconTile } from '../../components/settings-ui';
import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { useAppSettings } from '../../contexts/settings-context';

type HubItem = { title: string; subtitle: string; icon: LucideIcon; href: Href };

const HUB_ITEMS: HubItem[] = [
  { title: 'Appearance', subtitle: 'Theme and visual preferences', icon: Palette, href: '/settings/appearance' },
  { title: 'Cooking', subtitle: 'Timers and cooking experience', icon: Clock, href: '/settings/cooking' },
  { title: 'Recipe Management', subtitle: 'Saved recipes and list behavior', icon: NotebookText, href: '/settings/recipes' },
  { title: 'Kitchen Guides', subtitle: 'Default view and content', icon: BookOpen, href: '/settings/guides' },
  { title: 'Data & Exports', subtitle: 'Sharing and export options', icon: Share2, href: '/settings/data' },
];

const RESTORE_ALL_MESSAGE = 'Reset every setting to its default? Your recipes and their order are not affected.';

export default function SettingsHubScreen() {
  const router = useRouter();
  const { palette, resetToDefaults } = useAppSettings();

  function confirmRestoreAll() {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(RESTORE_ALL_MESSAGE)) {
        resetToDefaults();
      }
      return;
    }

    Alert.alert('Restore defaults', RESTORE_ALL_MESSAGE, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', style: 'destructive', onPress: resetToDefaults },
    ]);
  }

  function renderCard(key: string, title: string, subtitle: string, icon: LucideIcon, onPress: () => void) {
    return (
      <Pressable
        key={key}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.settingsHubCard,
          { backgroundColor: palette.elevated, borderColor: palette.borderAlt, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <SettingsIconTile icon={icon} size={52} />
        <View style={styles.settingsHubCardCopy}>
          <Text style={[styles.settingsHubCardTitle, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.settingsHubCardSubtitle, { color: palette.textMuted }]}>{subtitle}</Text>
        </View>
        <ChevronRight size={20} color={palette.accent} strokeWidth={2.4} />
      </Pressable>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.settingsPageContent}>
      <View style={styles.settingsPageHeader}>
        <Text style={[styles.settingsPageTitle, { color: palette.text }]}>Settings</Text>
        <Text style={[styles.settingsPageSubtitle, { color: palette.textMuted }]}>
          Customize your Kitchen Helper experience.
        </Text>
      </View>

      {HUB_ITEMS.map((item) =>
        renderCard(item.title, item.title, item.subtitle, item.icon, () => router.push(item.href))
      )}
      {renderCard('restore', 'Restore Defaults', 'Reset every setting to its default', RotateCcw, confirmRestoreAll)}
    </ScrollView>
  );
}
