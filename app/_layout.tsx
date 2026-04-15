import { Stack } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';

import { CookTimerModal } from '../components/cook-timer-modal';
import { CookTimerButton, HomeButton, MyRecipesButton, ReferenceButton, SettingsGearButton, SettingsMenuModal } from '../components/settings-menu';
import { AuthProvider } from '../contexts/auth-context';
import { CookTimerProvider } from '../contexts/cook-timer-context';
import { CustomRecipesProvider } from '../contexts/custom-recipes-context';
import { FavoritesProvider } from '../contexts/favorites-context';
import { SettingsProvider, useAppSettings } from '../contexts/settings-context';

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
        headerTitle: isCompact ? 'KH' : undefined,
        headerBackVisible: true,
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 8, marginRight: 4 }}>
            <HomeButton />
            <MyRecipesButton />
            <ReferenceButton />
            <CookTimerButton />
            <SettingsGearButton />
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
    </Stack>
  );
}
