import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import { PillButton } from '../../components/settings-ui';
import { useAuth } from '../../contexts/auth-context';
import { useAppSettings } from '../../contexts/settings-context';

const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordScreen() {
  const { palette } = useAppSettings();
  const { authError, authMessage, changePassword, clearAuthFeedback, isAuthenticating, user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    clearAuthFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return <Redirect href="/account" />;
  }

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSave = !isAuthenticating && password.length >= MIN_PASSWORD_LENGTH && confirm === password;

  async function handleSave() {
    const changed = await changePassword(password);
    if (changed) {
      setPassword('');
      setConfirm('');
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
        <Text style={[styles.settingsPageTitle, { color: palette.text }]}>Change password</Text>
        <Text style={[styles.settingsPageSubtitle, { color: palette.textMuted }]}>
          {`For ${user.email ?? 'your account'}.`}
        </Text>
      </View>

      <View style={[styles.settingsCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="New password"
          placeholderTextColor={palette.searchPlaceholder}
          accessibilityLabel="New password"
          style={inputStyle}
        />
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          placeholder="Confirm new password"
          placeholderTextColor={palette.searchPlaceholder}
          accessibilityLabel="Confirm new password"
          style={inputStyle}
        />
        {tooShort ? (
          <Text style={[styles.accountFeedback, { color: palette.warningText }]}>
            {`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
          </Text>
        ) : null}
        {mismatch ? (
          <Text style={[styles.accountFeedback, { color: palette.warningText }]}>Passwords don't match.</Text>
        ) : null}
        <PillButton
          label={isAuthenticating ? 'Saving…' : 'Save new password'}
          disabled={!canSave}
          onPress={() => void handleSave()}
        />
        {authMessage ? (
          <Text style={[styles.accountFeedback, { color: palette.accentText }]}>{authMessage}</Text>
        ) : null}
        {authError ? <Text style={[styles.accountFeedback, { color: palette.warningText }]}>{authError}</Text> : null}
      </View>
    </ScrollView>
  );
}
