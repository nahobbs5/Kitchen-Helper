import { Stack } from 'expo-router';
import { Image, Text, View, useWindowDimensions } from 'react-native';

import { CookTimerModal } from '../components/cook-timer-modal';
import { AccountButton, CookTimerButton, HomeButton, MyRecipesButton, ReferenceButton, SettingsGearButton, SettingsMenuModal } from '../components/settings-menu';
import { AuthProvider } from '../contexts/auth-context';
import { CookTimerProvider } from '../contexts/cook-timer-context';
import { CustomRecipesProvider } from '../contexts/custom-recipes-context';
import { FavoritesProvider } from '../contexts/favorites-context';
import type { AppPalette } from '../components/app-theme';
import { SettingsProvider, useAppSettings } from '../contexts/settings-context';

const headerLogo = require('../assets/logo-header.png');
const headerIcon = require('../assets/favicon.png');

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CookTimerProvider>
          <CustomRecipesProvider>
            <FavoritesProvider>
              <RootNavigator />
              <SettingsMenuModal />
              <CookTimerModal />
            </FavoritesProvider>
          </CustomRecipesProvider>
        </CookTimerProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

type HeaderBrandProps = {
  compact: boolean;
  palette: AppPalette;
  title: string;
};

function HeaderBrand({ compact, palette, title }: HeaderBrandProps) {
  const showRouteTitle = title && title !== 'Kitchen Helper';

  if (compact) {
    return (
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
        <Image
          source={headerIcon}
          style={{ borderRadius: 8, height: 28, width: 28 }}
          resizeMode="contain"
        />
        {showRouteTitle ? (
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15, fontWeight: '700' }}>
            {title}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
      <Image source={headerLogo} style={{ height: 44, width: 168 }} resizeMode="contain" />
      {showRouteTitle ? (
        <Text
          numberOfLines={1}
          style={{ color: palette.textMuted, fontSize: 15, fontWeight: '700', maxWidth: 180 }}
        >
          {title}
        </Text>
      ) : null}
    </View>
  );
}

function RootNavigator() {
  const { palette } = useAppSettings();
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

  return (
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
        options={{ title: 'Kitchen Helper', headerBackVisible: false }}
      />
      <Stack.Screen name="reference" options={{ title: 'Kitchen Reference' }} />
      <Stack.Screen name="conversions" options={{ title: 'Conversions' }} />
      <Stack.Screen name="cooking-dictionary" options={{ title: 'Cooking Dictionary' }} />
      <Stack.Screen name="allergy-substitutions" options={{ title: 'Substitutions' }} />
      <Stack.Screen name="my-recipes" options={{ title: 'My Recipes' }} />
      <Stack.Screen name="add-recipe" options={{ title: 'Add Recipe' }} />
      <Stack.Screen name="edit-recipe/[slug]" options={{ title: 'Edit Recipe' }} />
      <Stack.Screen name="user-recipes/[slug]" options={{ title: 'Recipe' }} />
      <Stack.Screen name="recipes/[slug]" options={{ title: 'Recipe' }} />
      <Stack.Screen name="recipe" options={{ title: 'Sample Recipes' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
    </Stack>
  );
}
