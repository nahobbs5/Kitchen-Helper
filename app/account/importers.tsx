import { ScrollView, Text, View } from 'react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { useAppSettings } from '../../contexts/settings-context';

/** Known compatibility with the website recipe importer. Moved from the old Account page. */
export default function ImporterCompatibilityScreen() {
  const { palette } = useAppSettings();

  return (
    <ScrollView
      style={[styles.settingsScroll, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.settingsScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.settingsSection,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            marginTop: 16,
          },
        ]}
      >
        <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>Recipe importer</Text>
        <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
          Known compatibility with the website importer.
        </Text>

        <View style={{ gap: 4 }}>
          <Text style={[styles.settingsLabel, { color: palette.text }]}>Full</Text>
          {[
            'allrecipes.com',
            'cooking.nytimes.com',
            'food.com',
            'littlesweetbaker.com',
            'nutrition.gov',
            'recipetineats.com',
            'sallysbakingaddiction.com',
            'simplyrecipes.com',
            'tinykitchendivas.com',
          ].map((site) => (
            <Text key={site} style={[styles.settingsHint, { color: palette.textMuted }]}>
              {site}
            </Text>
          ))}
        </View>

        <View style={{ gap: 4, marginTop: 12 }}>
          <Text style={[styles.settingsLabel, { color: palette.text }]}>Limited</Text>
          {[
            'seriouseats.com',
            'smittenkitchen.com',
          ].map((site) => (
            <Text key={site} style={[styles.settingsHint, { color: palette.textMuted }]}>
              {site}
            </Text>
          ))}
        </View>

        <View style={{ gap: 4, marginTop: 12 }}>
          <Text style={[styles.settingsLabel, { color: palette.text }]}>Doesn't Work</Text>
          {[
            'inspiredtaste.net',
            'therealfooddietitians.com',
          ].map((site) => (
            <Text key={site} style={[styles.settingsHint, { color: palette.textMuted }]}>
              {site}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
