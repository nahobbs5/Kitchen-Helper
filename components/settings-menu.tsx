import { usePathname, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { kitchenStyles as styles } from './kitchen-styles';
import { useCookTimer } from '../contexts/cook-timer-context';
import { useAppSettings } from '../contexts/settings-context';

function HeaderTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const { palette } = useAppSettings();

  return (
    <View
      style={{ position: 'relative', overflow: 'visible' }}
      // @ts-expect-error React Native Web hover events are not in the RN type definitions
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <View
          style={{
            position: 'absolute',
            top: 42,
            left: -26,
            width: 90,
            alignItems: 'center',
            zIndex: 1000,
          }}
          pointerEvents="none"
        >
          <View
            style={{
              backgroundColor: palette.elevated,
              borderColor: palette.borderAlt,
              borderWidth: 1,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: palette.textMuted, fontSize: 11 }}>{label}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export function ReferenceButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useAppSettings();
  const isReferenceScreen = pathname === '/reference';

  return (
    <HeaderTooltip label="Reference">
      <Pressable
        onPress={() => {
          if (!isReferenceScreen) {
            router.push('/reference');
          }
        }}
        disabled={isReferenceScreen}
        accessibilityRole="button"
        accessibilityLabel="Open kitchen reference"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
            ...(isReferenceScreen && { borderColor: palette.accent, borderWidth: 2 }),
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>📖</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function HomeButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useAppSettings();
  const isHomeScreen = pathname === '/';

  return (
    <HeaderTooltip label="Home">
      <Pressable
        onPress={() => {
          if (!isHomeScreen) {
            router.replace('/');
          }
        }}
        disabled={isHomeScreen}
        accessibilityRole="button"
        accessibilityLabel="Go to home screen"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
            ...(isHomeScreen && { borderColor: palette.accent, borderWidth: 2 }),
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>🏠</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function MyRecipesButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useAppSettings();
  const isMyRecipesScreen = pathname === '/my-recipes';

  return (
    <HeaderTooltip label="My Recipes">
      <Pressable
        onPress={() => {
          if (!isMyRecipesScreen) {
            router.push('/my-recipes');
          }
        }}
        disabled={isMyRecipesScreen}
        accessibilityRole="button"
        accessibilityLabel="Open my recipes"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
            ...(isMyRecipesScreen && { borderColor: palette.accent, borderWidth: 2 }),
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>🍳</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function CookTimerButton() {
  const { openCookTimer } = useCookTimer();
  const { palette } = useAppSettings();

  return (
    <HeaderTooltip label="Cook Timer">
      <Pressable
        onPress={openCookTimer}
        accessibilityRole="button"
        accessibilityLabel="Open cook timer"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>⏳</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function SettingsGearButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useAppSettings();
  const isSettingsHub = pathname === '/settings';

  return (
    <HeaderTooltip label="Settings">
      <Pressable
        onPress={() => {
          if (!isSettingsHub) {
            router.navigate('/settings');
          }
        }}
        disabled={isSettingsHub}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
            ...(isSettingsHub && { borderColor: palette.accent, borderWidth: 2 }),
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>⚙</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

export function AccountButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette } = useAppSettings();
  const isAccountScreen = pathname === '/account';

  return (
    <HeaderTooltip label="Account">
      <Pressable
        onPress={() => {
          if (!isAccountScreen) {
            // navigate (not push) so sub-pages like /account/export return to the main Account page.
            router.navigate('/account');
          }
        }}
        disabled={isAccountScreen}
        accessibilityRole="button"
        accessibilityLabel="Open account"
        style={[
          styles.settingsGearButton,
          {
            backgroundColor: palette.elevated,
            borderColor: palette.borderAlt,
            ...(isAccountScreen && { borderColor: palette.accent, borderWidth: 2 }),
          },
        ]}
      >
        <Text style={[styles.settingsGearIcon, { color: palette.accent }]}>👤</Text>
      </Pressable>
    </HeaderTooltip>
  );
}

// Phone header: nav buttons spread evenly across the width.
// Sub-pages swap Home for a back arrow.
export function CompactNavHeader({ showBack, onBack }: { showBack: boolean; onBack: () => void }) {
  const { palette } = useAppSettings();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: palette.headerBackground, paddingTop: insets.top }}>
      <View style={styles.compactNavRow}>
        {showBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={6}
            style={styles.compactNavBack}
          >
            <ArrowLeft size={26} color={palette.text} />
          </Pressable>
        ) : (
          <HomeButton />
        )}
        <MyRecipesButton />
        <ReferenceButton />
        <CookTimerButton />
        <SettingsGearButton />
        <AccountButton />
      </View>
    </View>
  );
}
