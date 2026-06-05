import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Image, Platform, Text, View, useWindowDimensions } from 'react-native';

import { CookTimerFinishedAlerts } from '../components/cook-timer-alerts';
import { CookTimerModal } from '../components/cook-timer-modal';
import { AccountButton, CookTimerButton, HomeButton, MyRecipesButton, ReferenceButton, SettingsGearButton, SettingsMenuModal } from '../components/settings-menu';
import { AuthProvider } from '../contexts/auth-context';
import { CookTimerProvider } from '../contexts/cook-timer-context';
import { CustomRecipesProvider } from '../contexts/custom-recipes-context';
import { FavoritesProvider } from '../contexts/favorites-context';
import type { AppPalette } from '../components/app-theme';
import { SettingsProvider, useAppSettings } from '../contexts/settings-context';

const headerLogo = require('../assets/kitchen-helper-logo-icon.png');
export default function RootLayout() {
  useAndroidImmersiveNavigation();

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={handleAndroidImmersiveNavigationTouch}
    >
      <SettingsProvider>
        <AuthProvider>
          <CookTimerProvider>
            <CustomRecipesProvider>
              <FavoritesProvider>
                <RootNavigator />
                <SettingsMenuModal />
                <CookTimerModal />
                <CookTimerFinishedAlerts />
              </FavoritesProvider>
            </CustomRecipesProvider>
          </CookTimerProvider>
        </AuthProvider>
      </SettingsProvider>
    </View>
  );
}

function hideAndroidNavigationBar() {
  if (Platform.OS !== 'android') {
    return;
  }

  void (async () => {
    try {
      await NavigationBar.setBehaviorAsync('overlay-swipe');
      await NavigationBar.setVisibilityAsync('hidden');
    } catch {
      // Some Android navigation modes do not support programmatic control.
    }
  })();
}

function handleAndroidImmersiveNavigationTouch() {
  hideAndroidNavigationBar();
  return false;
}

function useAndroidImmersiveNavigation() {
  useEffect(() => {
    hideAndroidNavigationBar();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        hideAndroidNavigationBar();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

type HeaderBrandProps = {
  compact: boolean;
  palette: AppPalette;
  title: string;
  titleMaxWidth: number;
};

function HeaderBrand({ compact, palette, title, titleMaxWidth }: HeaderBrandProps) {
  const showRouteTitle = title && title !== 'Kitchen Helper';

  if (compact) {
    return showRouteTitle ? (
      <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15, fontWeight: '700' }}>
        {title}
      </Text>
    ) : null;
  }

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12, minWidth: 0 }}>
      <Image source={headerLogo} style={{ flexShrink: 0, height: 44, width: 44 }} resizeMode="contain" />
      {showRouteTitle ? (
        <Text
          numberOfLines={1}
          style={{
            color: palette.textMuted,
            flexShrink: 1,
            fontSize: 15,
            fontWeight: '700',
            maxWidth: titleMaxWidth,
            minWidth: 0,
          }}
        >
          {title}
        </Text>
      ) : null}
    </View>
  );
}

function RootNavigator() {
  const { darkModeEnabled, palette } = useAppSettings();
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const desktopTitleMaxWidth = Math.max(180, width - 430);
  const topLevelScreenOptions = (title: string) => ({
    title: isCompact ? '' : title,
    headerBackVisible: false,
    headerLeft: () => null,
  });

  return (
    <>
      <StatusBar
        backgroundColor={darkModeEnabled ? '#1d1712' : '#fff7ea'}
        style={darkModeEnabled ? 'light' : 'dark'}
        translucent={false}
      />
      <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.headerBackground,
        },
        headerTintColor: palette.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerTitle: ({ children }) => (
          <HeaderBrand
            compact={isCompact}
            palette={palette}
            title={typeof children === 'string' ? children : 'Kitchen Helper'}
            titleMaxWidth={desktopTitleMaxWidth}
          />
        ),
        headerTitleAlign: isCompact ? 'center' : 'left',
        headerBackVisible: true,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 8, marginRight: 4 }}>
            <HomeButton />
            <MyRecipesButton />
            <ReferenceButton />
            <CookTimerButton />
            <SettingsGearButton />
            <AccountButton />
          </View>
        ),
        contentStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={topLevelScreenOptions('Kitchen Helper')}
      />
      <Stack.Screen name="reference" options={topLevelScreenOptions('Kitchen Reference')} />
      <Stack.Screen name="my-recipes" options={topLevelScreenOptions('My Recipes')} />
      <Stack.Screen name="add-recipe" options={{ title: 'Add Recipe' }} />
      <Stack.Screen name="edit-recipe/[slug]" options={{ title: 'Edit Recipe' }} />
      <Stack.Screen name="user-recipes/[slug]" options={{ title: 'Recipe' }} />
      <Stack.Screen name="recipes/[slug]" options={{ title: 'Recipe' }} />
      <Stack.Screen name="recipe" options={{ title: 'Sample Recipes' }} />
      <Stack.Screen name="account" options={topLevelScreenOptions('Account')} />
      </Stack>
    </>
  );
}
