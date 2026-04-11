import { Stack } from 'expo-router';

import { CookTimerModal } from '../components/cook-timer-modal';
import { SettingsGearButton, SettingsMenuModal } from '../components/settings-menu';
import { CookTimerProvider } from '../contexts/cook-timer-context';
import { CustomRecipesProvider } from '../contexts/custom-recipes-context';
import { FavoritesProvider } from '../contexts/favorites-context';
import { SettingsProvider, useAppSettings } from '../contexts/settings-context';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <CookTimerProvider>
        <CustomRecipesProvider>
          <FavoritesProvider>
            <RootNavigator />
            <SettingsMenuModal />
            <CookTimerModal />
          </FavoritesProvider>
        </CustomRecipesProvider>
      </CookTimerProvider>
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
      <Stack.Screen name="add-recipe" options={{ title: 'Add Recipe' }} />
      <Stack.Screen name="edit-recipe/[slug]" options={{ title: 'Edit Recipe' }} />
      <Stack.Screen name="user-recipes/[slug]" options={{ title: 'Recipe' }} />
      <Stack.Screen name="recipes/[slug]" options={{ title: 'Recipe' }} />
      <Stack.Screen name="recipe" options={{ title: 'Recipe Preview' }} />
    </Stack>
  );
}
