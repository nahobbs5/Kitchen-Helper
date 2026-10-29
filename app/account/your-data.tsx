import { ScrollView, Text, View } from 'react-native';
import { Cloud, EyeOff, FileText, Smartphone, Trash2 } from 'lucide-react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { SettingsCard, SettingsNavRow } from '../../components/settings-ui';
import { useAppSettings } from '../../contexts/settings-context';
import { PRIVACY_POLICY_URL, openPrivacyPolicy } from '../../utils/app-links';

/**
 * Plain facts about how the app handles data. This is not a legal privacy policy;
 * a hosted policy is linked at the bottom only when EXPO_PUBLIC_PRIVACY_POLICY_URL is set.
 */
export default function YourDataScreen() {
  const { palette } = useAppSettings();

  function Bullets({ items }: { items: string[] }) {
    return (
      <View style={{ gap: 6 }}>
        {items.map((item) => (
          <View key={item} style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={[styles.settingsPageRowHint, { color: palette.accentText }]}>•</Text>
            <Text style={[styles.settingsPageRowHint, { color: palette.text, flex: 1 }]}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.settingsPageContent}>
      <View style={styles.settingsPageHeader}>
        <Text style={[styles.settingsPageTitle, { color: palette.text }]}>Your data</Text>
        <Text style={[styles.settingsPageSubtitle, { color: palette.textMuted }]}>
          What Kitchen Helper stores, where it lives, and how to remove it.
        </Text>
      </View>

      <SettingsCard icon={Cloud} title="What gets synced">
        <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>
          Only when you're signed in, these are saved to your account so they appear on your other devices:
        </Text>
        <Bullets items={['Recipes you add or import', 'Your edits to sample recipes', 'The order of your recipe lists']} />
      </SettingsCard>

      <SettingsCard icon={Smartphone} title="What stays on this device">
        <Bullets
          items={[
            'Star ratings and favorites',
            'App settings (theme, timers, sounds)',
            'Cook timers and recently deleted recipes',
            'Everything, if you never sign in',
          ]}
        />
      </SettingsCard>

      <SettingsCard icon={EyeOff} title="No ads or tracking">
        <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>
          Kitchen Helper has no ads, analytics, or tracking. Your email is used only to sign you in. Synced recipes are
          stored in the app's Supabase database and are readable only by your account.
        </Text>
      </SettingsCard>

      <SettingsCard icon={Trash2} title="Removing your data">
        <Bullets
          items={[
            'Account › Delete my synced data removes everything from the cloud.',
            'Deleting a recipe in the app removes it everywhere it syncs.',
            'Uninstalling the app removes what is stored on this device.',
          ]}
        />
      </SettingsCard>

      {PRIVACY_POLICY_URL ? (
        <View style={[styles.settingsCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
          <SettingsNavRow icon={FileText} label="Privacy policy" hint="Read the full policy." onPress={openPrivacyPolicy} />
        </View>
      ) : null}
    </ScrollView>
  );
}
