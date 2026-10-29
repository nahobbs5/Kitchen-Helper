import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import {
  ChevronRight,
  Cloud,
  Database,
  Download,
  FileText,
  Globe,
  KeyRound,
  Laptop,
  Lock,
  Settings,
  Smartphone,
  Tablet,
  Trash2,
  Upload,
} from 'lucide-react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import {
  PillButton,
  SettingsActionButton,
  SettingsCard,
  SettingsIconTile,
  SettingsNavRow,
  SettingsRow,
} from '../../components/settings-ui';
import { useAuth } from '../../contexts/auth-context';
import { useCustomRecipes } from '../../contexts/custom-recipes-context';
import { useAppSettings } from '../../contexts/settings-context';
import { PRIVACY_POLICY_URL, formatTimeAgo, openPrivacyPolicy } from '../../utils/app-links';

const THIS_DEVICE_LABEL =
  Platform.OS === 'ios' ? 'iPhone or iPad' : Platform.OS === 'android' ? 'Android device' : 'Web browser';

/** Asks before a destructive action. Uses window.confirm on web, where Alert buttons aren't supported. */
function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function AccountScreen() {
  const router = useRouter();
  const { palette } = useAppSettings();
  const {
    authError,
    authMessage,
    clearAuthFeedback,
    configured,
    isAuthenticating,
    signOut,
    signOutOtherDevices,
    user,
  } = useAuth();
  const { clearSyncError, deleteCloudData, lastSyncedAt, refreshSync, syncBusy, syncEnabled, syncError } =
    useCustomRecipes();
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, setClock] = useState(0);

  // Re-render every 30s so "Synced 5 min ago" stays current.
  useEffect(() => {
    if (!user) return;
    const intervalId = setInterval(() => setClock((tick) => tick + 1), 30000);
    return () => clearInterval(intervalId);
  }, [user]);

  function renderFeedback() {
    const messages = [
      authMessage ? { text: authMessage, error: false } : null,
      deleteMessage ? { text: deleteMessage, error: false } : null,
      authError ? { text: authError, error: true } : null,
      deleteError ? { text: deleteError, error: true } : null,
      syncError ? { text: syncError, error: true } : null,
    ].filter((item): item is { text: string; error: boolean } => item !== null);

    return messages.map((message) => (
      <Text
        key={message.text}
        style={[styles.accountFeedback, { color: message.error ? palette.warningText : palette.accentText }]}
      >
        {message.text}
      </Text>
    ));
  }

  function renderOtherOptions() {
    return (
      <>
        <SettingsNavRow
          icon={Upload}
          label="Export recipes to PDF"
          hint="Choose specific recipes or export all."
          onPress={() => router.push('/account/export')}
        />
        <SettingsNavRow
          icon={Download}
          label="Import recipes"
          hint="Add recipes from supported websites, photos, or files."
          onPress={() => router.push('/add-recipe')}
        />
        <SettingsNavRow
          icon={Globe}
          label="Importer compatibility"
          hint="Which recipe websites the importer works with."
          onPress={() => router.push('/account/importers')}
        />
      </>
    );
  }

  function handleSignOutOthers() {
    confirmAction(
      'Sign out other devices?',
      'Every other phone, tablet, or browser signed in to this account will be signed out. This device stays signed in.',
      'Sign out others',
      () => {
        clearAuthFeedback();
        void signOutOtherDevices();
      }
    );
  }

  function handleDeleteCloudData() {
    confirmAction(
      'Delete your synced data?',
      'This permanently removes your recipes, sample-recipe edits, and recipe order from the cloud, then signs you out. Your recipes stay on this device and upload again if you sign back in.',
      'Delete',
      () => {
        clearAuthFeedback();
        clearSyncError();
        setDeleteError(null);
        setDeleteMessage(null);
        deleteCloudData()
          .then(() => setDeleteMessage('Your synced data was deleted. Your recipes are still on this device.'))
          .catch((error: unknown) =>
            setDeleteError(error instanceof Error ? error.message : 'Unable to delete your synced data.')
          );
      }
    );
  }

  function handleSignOut() {
    clearAuthFeedback();
    clearSyncError();
    setDeleteMessage(null);
    setDeleteError(null);
    void signOut();
  }

  const header = (subtitle?: string) => (
    <View style={styles.settingsPageHeader}>
      <Text style={[styles.settingsPageTitle, { color: palette.text }]}>Account</Text>
      {subtitle ? <Text style={[styles.settingsPageSubtitle, { color: palette.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );

  if (user) {
    const email = user.email ?? 'Signed-in account';
    const syncStatus = syncBusy
      ? 'Syncing…'
      : lastSyncedAt
        ? `Synced ${formatTimeAgo(lastSyncedAt)}`
        : 'Waiting for first sync';

    return (
      <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.settingsPageContent}>
        {header()}

        <View style={[styles.settingsCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
          <View style={styles.accountProfileRow}>
            <View style={[styles.accountAvatar, { backgroundColor: palette.tag }]}>
              <Text style={[styles.accountAvatarText, { color: palette.accent }]}>
                {email.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.settingsPageRowCopy}>
              <Text numberOfLines={1} style={[styles.accountEmail, { color: palette.text }]}>
                {email}
              </Text>
              <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>{syncStatus}</Text>
            </View>
          </View>
          <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} />
          <View style={styles.settingsPageRow}>
            <SettingsIconTile icon={Cloud} />
            <View style={styles.settingsPageRowCopy}>
              <Text style={[styles.settingsPageRowLabel, { color: palette.text }]}>
                {syncEnabled ? 'Sync is on' : 'Sync is paused'}
              </Text>
              <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>
                Your recipes are being synced across devices.
              </Text>
            </View>
            <SettingsActionButton
              label={syncBusy ? 'Syncing…' : 'Refresh'}
              disabled={syncBusy || !syncEnabled}
              onPress={() => {
                clearSyncError();
                void refreshSync();
              }}
            />
          </View>
          {renderFeedback()}
        </View>

        <SettingsCard icon={Smartphone} title="Sign-ins">
          <SettingsRow label={THIS_DEVICE_LABEL} hint="This device">
            <View style={[styles.accountBadge, { backgroundColor: palette.tag }]}>
              <Text style={[styles.accountBadgeText, { color: palette.tagText }]}>Current</Text>
            </View>
          </SettingsRow>
          <PillButton
            variant="secondary"
            label={isAuthenticating ? 'Working…' : 'Sign out on other devices'}
            disabled={isAuthenticating}
            onPress={handleSignOutOthers}
          />
        </SettingsCard>

        <SettingsCard icon={Settings} title="Account options">
          <SettingsNavRow icon={KeyRound} label="Change password" onPress={() => router.push('/account/password')} />
          <SettingsNavRow
            icon={Trash2}
            label="Delete my synced data"
            hint="Removes your recipes from the cloud. Full account removal isn't available in the app yet."
            destructive
            disabled={syncBusy}
            onPress={handleDeleteCloudData}
          />
        </SettingsCard>

        <SettingsCard icon={Database} title="Data & export">
          {renderOtherOptions()}
          <SettingsNavRow
            icon={Cloud}
            label="View synced data"
            hint="See what's stored in your account."
            onPress={() => router.push('/account/synced-data')}
          />
          <SettingsNavRow
            icon={Lock}
            label="Your data"
            hint="What syncs and what stays on this device."
            onPress={() => router.push('/account/your-data')}
          />
          {PRIVACY_POLICY_URL ? (
            <SettingsNavRow icon={FileText} label="Privacy policy" onPress={openPrivacyPolicy} />
          ) : null}
        </SettingsCard>

        <PillButton label="Sign out" disabled={isAuthenticating} onPress={handleSignOut} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.settingsPageContent}>
      {header('Sign in to sync your recipes across devices and keep your data safe.')}

      <View style={[styles.accountHero, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
        <View style={styles.accountHeroArt} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.accountHeroCircle, { width: 72, height: 72, backgroundColor: palette.accent }]}>
            <Cloud size={38} color={palette.accentContrastText} fill={palette.accentContrastText} />
          </View>
          <View style={styles.accountHeroDevices}>
            {[Smartphone, Laptop, Tablet].map((Icon, index) => (
              <View
                key={index}
                style={[
                  styles.accountHeroCircle,
                  { width: index === 1 ? 76 : 64, height: index === 1 ? 76 : 64, backgroundColor: palette.tag },
                ]}
              >
                <Icon size={index === 1 ? 36 : 30} color={palette.accent} strokeWidth={2} />
              </View>
            ))}
          </View>
        </View>

        {configured ? (
          <>
            <Text style={[styles.accountHeroTitle, { color: palette.text }]}>Sync across devices</Text>
            <Text style={[styles.accountHeroBody, { color: palette.textMuted }]}>
              Access your recipes on all your devices and keep everything up to date.
            </Text>
            <PillButton label="Sign in" onPress={() => router.push('/account/sign-in')} />
            <PillButton
              variant="secondary"
              label="Create account"
              onPress={() => router.push({ pathname: '/account/sign-in', params: { mode: 'signup' } })}
            />
          </>
        ) : (
          <>
            <Text style={[styles.accountHeroTitle, { color: palette.text }]}>Sync isn't set up yet</Text>
            <Text style={[styles.accountHeroBody, { color: palette.textMuted }]}>
              Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your Expo environment to turn on
              account sync. Everything else works without it.
            </Text>
          </>
        )}
        {renderFeedback()}
      </View>

      <InfoCard
        icon={Cloud}
        title="What gets synced?"
        body="Your recipes, your edits to sample recipes, and your recipe order."
        onPress={() => router.push('/account/your-data')}
      />
      <InfoCard
        icon={Lock}
        title="Your data"
        body="Your data is private and you control it."
        onPress={() => router.push('/account/your-data')}
      />
      {PRIVACY_POLICY_URL ? (
        <InfoCard icon={FileText} title="Privacy policy" body="Read the full privacy policy." onPress={openPrivacyPolicy} />
      ) : null}

      <Text style={[styles.accountSectionHeading, { color: palette.text }]}>Other options</Text>
      <View style={[styles.settingsCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
        {renderOtherOptions()}
      </View>
    </ScrollView>
  );
}

function InfoCard({
  icon,
  title,
  body,
  onPress,
}: {
  icon: typeof Cloud;
  title: string;
  body: string;
  onPress: () => void;
}) {
  const { palette } = useAppSettings();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsHubCard,
        { backgroundColor: palette.elevated, borderColor: palette.borderAlt, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <SettingsIconTile icon={icon} size={52} />
      <View style={styles.settingsHubCardCopy}>
        <Text style={[styles.settingsHubCardTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.settingsHubCardSubtitle, { color: palette.textMuted }]}>{body}</Text>
      </View>
      <ChevronRight size={20} color={palette.accent} strokeWidth={2.4} />
    </Pressable>
  );
}
