import { Stack } from 'expo-router';

import { FavoritesProvider } from '../contexts/favorites-context';

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff7ea',
          },
          headerTintColor: '#2a2118',
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#f4efe6',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Kitchen Helper' }} />
        <Stack.Screen name="conversions" options={{ title: 'Conversions' }} />
        <Stack.Screen name="allergy-substitutions" options={{ title: 'Allergy Swaps' }} />
        <Stack.Screen name="my-recipes" options={{ title: 'My Recipes' }} />
        <Stack.Screen name="recipes/[slug]" options={{ title: 'Recipe' }} />
        <Stack.Screen name="recipe" options={{ title: 'Recipe Preview' }} />
      </Stack>
    </FavoritesProvider>
  );
}
