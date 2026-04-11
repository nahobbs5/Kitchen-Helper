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
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerRight: () => <SettingsGearButton />,
        contentStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Kitchen Helper' }} />
      <Stack.Screen name="conversions" options={{ title: 'Conversions' }} />
      <Stack.Screen name="cooking-dictionary" options={{ title: 'Cooking Dictionary' }} />
      <Stack.Screen name="allergy-substitutions" options={{ title: 'Allergy Swaps' }} />
      <Stack.Screen name="my-recipes" options={{ title: 'My Recipes' }} />
      <Stack.Screen name="recipes/[slug]" options={{ title: 'Recipe' }} />
      <Stack.Screen name="recipe" options={{ title: 'Recipe Preview' }} />
    </Stack>
  );
}
