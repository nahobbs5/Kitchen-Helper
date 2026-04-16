import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { useAuth } from '../contexts/auth-context';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useAppSettings } from '../contexts/settings-context';

export default function AccountScreen() {
  const { palette } = useAppSettings();
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const {
    authError,
    authMessage,
    clearAuthFeedback,
    configured: authConfigured,
    isAuthenticating,
    signIn,
    signOut,
    signUp,
    user,
  } = useAuth();
  const {
    clearSyncError,
    syncBusy,
    syncError,
  } = useCustomRecipes();

  useEffect(() => {
    return () => {
      setAuthPassword('');
    };
  }, []);

  async function handleSignIn() {
    clearAuthFeedback();
    clearSyncError();
    await signIn(authEmail, authPassword);
    setAuthPassword('');
  }

  async function handleSignUp() {
    clearAuthFeedback();
    clearSyncError();
    await signUp(authEmail, authPassword);
    setAuthPassword('');
  }

  async function handleSignOut() {
    clearAuthFeedback();
    clearSyncError();
    await signOut();
  }

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
            marginTop: 24,
          },
        ]}
      >
        <Text style={[styles.settingsTitle, { color: palette.text }]}>Sync & sign in</Text>
        <Text style={[styles.settingsBody, { color: palette.textMuted }]}>
          Sign in to sync your recipes across devices.
        </Text>
        <Text style={[styles.settingsSectionTitle, { color: palette.text }]}>Account sync</Text>
        <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
          Use the same account on mobile and web to share one recipe library.
        </Text>
        {!authConfigured ? (
          <View style={styles.settingsCopy}>
            <Text style={[styles.settingsLabel, { color: palette.text }]}>Sync setup required</Text>
            <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
              Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to your Expo
              environment before account sync can run.
            </Text>
          </View>
        ) : user ? (
          <>
            <View style={styles.settingsCopy}>
              <Text style={[styles.settingsLabel, { color: palette.text }]}>Signed in</Text>
              <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                {user.email ?? 'Authenticated account'} is the active sync account for recipes and
                recipe overrides.
              </Text>
              <Text style={[styles.settingsHint, { color: palette.textMuted }]}>
                {syncBusy ? 'Syncing changes now.' : 'New recipe changes will sync across devices.'}
              </Text>
            </View>
            <Pressable
              onPress={handleSignOut}
              disabled={isAuthenticating}
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: palette.elevatedAlt,
                  borderColor: palette.borderAlt,
                  opacity: isAuthenticating ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.settingsCopy}>
              <Text style={[styles.settingsLabel, { color: palette.text }]}>Sign in to sync</Text>
            </View>
            <TextInput
              value={authEmail}
              onChangeText={setAuthEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.formInput,
                {
                  backgroundColor: palette.elevatedAlt,
                  borderColor: palette.borderAlt,
                  color: palette.text,
                },
              ]}
            />
            <TextInput
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={palette.textMuted}
              style={[
                styles.formInput,
                {
                  backgroundColor: palette.elevatedAlt,
                  borderColor: palette.borderAlt,
                  color: palette.text,
                },
              ]}
            />
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleSignIn}
                disabled={isAuthenticating || !authEmail.trim() || !authPassword}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor:
                      isAuthenticating || !authEmail.trim() || !authPassword
                        ? palette.borderAlt
                        : palette.accent,
                  },
                ]}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                  {isAuthenticating ? 'Working…' : 'Sign in'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSignUp}
                disabled={isAuthenticating || !authEmail.trim() || !authPassword}
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: palette.elevatedAlt,
                    borderColor: palette.borderAlt,
                    opacity: isAuthenticating || !authEmail.trim() || !authPassword ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>
                  Create account
                </Text>
              </Pressable>
            </View>
          </>
        )}
        {authMessage ? (
          <Text style={[styles.settingsHint, { color: palette.accentText }]}>{authMessage}</Text>
        ) : null}
        {authError ? (
          <Text style={[styles.settingsHint, { color: '#b14c2f' }]}>{authError}</Text>
        ) : null}
        {syncError ? (
          <Text style={[styles.settingsHint, { color: '#b14c2f' }]}>{syncError}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
