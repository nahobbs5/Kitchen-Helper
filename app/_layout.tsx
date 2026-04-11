import { Stack } from 'expo-router';

import { SettingsGearButton, SettingsMenuModal } from '../components/settings-menu';
import { FavoritesProvider } from '../contexts/favorites-context';
import { SettingsProvider, useAppSettings } from '../contexts/settings-context';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <FavoritesProvider>
        <RootNavigator />
        <SettingsMenuModal />
      </FavoritesProvider>
    </SettingsProvider>
  );
}

function RootNavigator() {
  const { palette } = useAppSettings();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: palette.headerBackground,
        },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerBackVisible: true,
        headerBackButtonDisplayMode: 'minimal',
        headerRight: () => <SettingsGearButton />,
        contentStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Kitchen Helper', headerBackVisible: false }} />
      <Stack.Screen name="conversions" options={{ title: 'Conversions', headerBackVisible: true }} />
      <Stack.Screen
        name="allergy-substitutions"
        options={{ title: 'Allergy Swaps', headerBackVisible: true }}
      />
      <Stack.Screen name="my-recipes" options={{ title: 'My Recipes', headerBackVisible: true }} />
      <Stack.Screen name="recipes/[slug]" options={{ title: 'Recipe', headerBackVisible: true }} />
      <Stack.Screen name="recipe" options={{ title: 'Recipe Preview', headerBackVisible: true }} />
    </Stack>
  );
}
