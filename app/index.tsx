import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { useAppSettings } from '../contexts/settings-context';

const menuItems = [
  {
    eyebrow: 'Your library',
    title: 'My Recipes',
    body: 'A home for saved recipes now, with room for Obsidian-imported recipes later.',
    href: '/my-recipes' as const,
  },
  {
    eyebrow: 'Prototype',
    title: 'Recipe preview',
    body: 'The existing demo page for scaling a recipe and showing substitutions in context.',
    href: '/recipe' as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();

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
            <Text style={[styles.title, { color: palette.text }]}>Useful kitchen tools in one place</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              The home screen now acts like a menu for the app. Instead of one demo page, we have
              dedicated routes for references, substitutions, recipes, and the scaling prototype.
            </Text>

            <View style={styles.badgeRow}>
              <Text style={[styles.badge, { backgroundColor: palette.tag, color: palette.tagText }]}>
                Conversions
              </Text>
              <Text style={[styles.badge, { backgroundColor: palette.tag, color: palette.tagText }]}>
                Dictionary
              </Text>
              <Text style={[styles.badge, { backgroundColor: palette.tag, color: palette.tagText }]}>
                Allergy swaps
              </Text>
              <Text style={[styles.badge, { backgroundColor: palette.tag, color: palette.tagText }]}>
                My recipes
              </Text>
            </View>
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
