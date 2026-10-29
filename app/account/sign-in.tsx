import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { PillButton } from '../../components/settings-ui';
import { useAuth } from '../../contexts/auth-context';
import { useCustomRecipes } from '../../contexts/custom-recipes-context';
import { useAppSettings } from '../../contexts/settings-context';

/** Sign in, or create an account with ?mode=signup. Returns to Account once signed in. */
export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { palette } = useAppSettings();
  const {
    authError,
    authMessage,
    clearAuthFeedback,
    isAuthenticating,
    requestPasswordReset,
    signIn,
    signUp,
    user,
  } = useAuth();
  const { clearSyncError } = useCustomRecipes();
  const [mode, setMode] = useState<'signin' | 'signup'>(params.mode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const isSignUp = mode === 'signup';
  const canSubmit = !isAuthenticating && email.trim().length > 0 && password.length > 0;

  // Start each visit without stale messages from another screen.
  useEffect(() => {
    clearAuthFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once signed in (here or after email confirmation), go back to Account.
  useEffect(() => {
    if (user) {
      router.back();
    }
  }, [router, user]);

  async function handleSubmit() {
    clearSyncError();
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
    setPassword('');
  }

  async function handleReset() {
    clearSyncError();
    const sent = await requestPasswordReset(resetEmail || email);
    if (sent) {
      setResetEmail('');
    }
  }

  const inputStyle = [
    styles.accountFormInput,
    { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt, color: palette.text },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.settingsPageContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.settingsPageHeader}>
        <Text style={[styles.settingsPageTitle, { color: palette.text }]}>
          {isSignUp ? 'Create account' : 'Sign in'}
        </Text>
        <Text style={[styles.settingsPageSubtitle, { color: palette.textMuted }]}>
          {isSignUp
            ? 'Create an account to sync your recipes across devices.'
            : 'Welcome back. Sign in to sync your recipes.'}
        </Text>
      </View>

      <View style={[styles.settingsCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={palette.searchPlaceholder}
          accessibilityLabel="Email"
          style={inputStyle}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder="Password"
          placeholderTextColor={palette.searchPlaceholder}
          accessibilityLabel="Password"
          onSubmitEditing={() => canSubmit && void handleSubmit()}
          style={inputStyle}
        />
        <PillButton
          label={isAuthenticating ? 'Working…' : isSignUp ? 'Create account' : 'Sign in'}
          disabled={!canSubmit}
          onPress={() => void handleSubmit()}
        />
        {authMessage ? (
          <Text style={[styles.accountFeedback, { color: palette.accentText }]}>{authMessage}</Text>
        ) : null}
        {authError ? <Text style={[styles.accountFeedback, { color: palette.warningText }]}>{authError}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            clearAuthFeedback();
            setMode(isSignUp ? 'signin' : 'signup');
          }}
          style={{ alignSelf: 'center', paddingVertical: 4 }}
        >
          <Text style={[styles.settingsPageRowLabel, { color: palette.accentText }]}>
            {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </Text>
        </Pressable>
      </View>

      {!isSignUp ? (
        <View style={[styles.settingsCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showReset }}
            onPress={() => {
              clearAuthFeedback();
              setShowReset((current) => !current);
            }}
          >
            <Text style={[styles.settingsPageRowLabel, { color: palette.accentText }]}>Forgot password?</Text>
          </Pressable>
          {showReset ? (
            <>
              <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>
                We'll email you a link to reset it.
              </Text>
              <TextInput
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder={email.trim() || 'Account email'}
                placeholderTextColor={palette.searchPlaceholder}
                accessibilityLabel="Account email for password reset"
                style={inputStyle}
              />
              <PillButton
                variant="secondary"
                label={isAuthenticating ? 'Working…' : 'Send reset email'}
                disabled={isAuthenticating || !(resetEmail.trim() || email.trim())}
                onPress={() => void handleReset()}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
