import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Cloud } from 'lucide-react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { SettingsActionButton, SettingsCard, SettingsRow } from '../../components/settings-ui';
import { useAuth } from '../../contexts/auth-context';
import { useCustomRecipes } from '../../contexts/custom-recipes-context';
import { useAppSettings } from '../../contexts/settings-context';
import { formatTimeAgo } from '../../utils/app-links';
import { countSyncedRows, getSyncConfig, type SyncedRowCounts } from '../../utils/supabase-sync';

/** Live counts of what's stored in the signed-in account. */
export default function SyncedDataScreen() {
  const { palette } = useAppSettings();
  const { session, user } = useAuth();
  const { lastSyncedAt } = useCustomRecipes();
  const [counts, setCounts] = useState<SyncedRowCounts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const config = getSyncConfig();
    if (!config || !session?.accessToken || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      setCounts(await countSyncedRows(config, session.accessToken, user.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your synced data.');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) {
    return <Redirect href="/account" />;
  }

  const value = (count: number | undefined) => (loading && !counts ? '…' : String(count ?? 0));

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.settingsPageContent}>
      <View style={styles.settingsPageHeader}>
        <Text style={[styles.settingsPageTitle, { color: palette.text }]}>Synced data</Text>
        <Text style={[styles.settingsPageSubtitle, { color: palette.textMuted }]}>
          {`What's stored in ${user.email ?? 'your account'}.`}
        </Text>
      </View>

      <SettingsCard icon={Cloud} title="In your account">
        <SettingsRow label="Recipes" hint="Recipes you added or imported.">
          <Text style={[styles.settingsHubCardTitle, { color: palette.text }]}>{value(counts?.recipes)}</Text>
        </SettingsRow>
        <SettingsRow label="Sample recipe edits" hint="Changes you made to built-in sample recipes.">
          <Text style={[styles.settingsHubCardTitle, { color: palette.text }]}>{value(counts?.recipeEdits)}</Text>
        </SettingsRow>
        <SettingsRow label="Saved list orders" hint="Custom ordering for your recipe lists.">
          <Text style={[styles.settingsHubCardTitle, { color: palette.text }]}>{value(counts?.recipeOrders)}</Text>
        </SettingsRow>
        <SettingsRow
          label="Last synced"
          hint={lastSyncedAt ? `This device synced ${formatTimeAgo(lastSyncedAt)}.` : 'Not synced yet this session.'}
        >
          <SettingsActionButton label={loading ? 'Loading…' : 'Refresh'} disabled={loading} onPress={() => void load()} />
        </SettingsRow>
        {error ? <Text style={[styles.accountFeedback, { color: palette.warningText }]}>{error}</Text> : null}
      </SettingsCard>
    </ScrollView>
  );
}
