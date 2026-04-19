import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { useAuth } from '../contexts/auth-context';
import { useAppSettings } from '../contexts/settings-context';

const menuItems = [
  {
    eyebrow: 'Your library',
    title: 'My Recipes',
    body: 'A personal library for your recipes.',
    href: '/my-recipes' as const,
  },
  {
    eyebrow: 'Imported library',
    title: 'Sample Recipes',
    body: 'A curated listing of tested favorites from the developer.',
    href: '/recipe' as const,
  },
  {
    eyebrow: 'Reference tools',
    title: 'Kitchen Guides',
    body: 'Conversions, substitutions, and cooking dictionary tools collected in one quick-reference space.',
    href: '/reference' as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const { configured, user } = useAuth();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.page}>
        <View
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>Kitchen utility hub</Text>
            <Text style={[styles.title, { color: palette.text }]}>Your Kitchen. Your Way.</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              {configured
                ? user
                  ? null
                  : 'Sign in from Settings to sync your recipe library across mobile and web.'
                : 'Add Supabase sync config to enable a shared recipe library across devices.'}
            </Text>
          </View>
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.primaryColumn}>
            <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Main menu</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Pick a kitchen helper</Text>
              <View style={styles.menuGrid}>
                {menuItems.map((item) => (
                  <Pressable
                    key={item.title}
                    onPress={() => router.push(item.href)}
                    style={[
                      styles.menuCard,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                    ]}
                  >
                    <Text style={[styles.menuCardEyebrow, { color: palette.accentText }]}>{item.eyebrow}</Text>
                    <Text style={[styles.menuCardTitle, { color: palette.text }]}>{item.title}</Text>
                    <Text style={[styles.menuCardBody, { color: palette.textMuted }]}>{item.body}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
