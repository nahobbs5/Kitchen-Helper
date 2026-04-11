import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { useAppSettings } from '../contexts/settings-context';

const menuItems = [
  {
    eyebrow: 'Reference',
    title: 'Common conversions',
    body: 'A kitchen-friendly cheat sheet for cups, spoons, temperatures, and ingredient weights.',
    href: '/conversions' as const,
  },
  {
    eyebrow: 'Allergy help',
    title: 'Common allergy substitutions',
    body: 'Practical swap ideas for dairy-free, egg-free, gluten-free, nut-free, and soy-free cooking.',
    href: '/allergy-substitutions' as const,
  },
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
  const { openSettings, palette } = useAppSettings();

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
                Allergy swaps
              </Text>
              <Text style={[styles.badge, { backgroundColor: palette.tag, color: palette.tagText }]}>
                My recipes
              </Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={openSettings}
                style={[styles.secondaryButton, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Settings</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>What this unlocks</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>A clearer app structure</Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Each major feature can now grow on its own screen without crowding the rest of the
              app. That matters on both Android and web.
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
                    <Text style={[styles.menuCardLink, { color: palette.accent }]}>Open screen</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.secondaryColumn}>
            <View
              style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}
            >
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Why these pages matter</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Reference content needs a home</Text>
              <Text style={[styles.panelText, { color: palette.textMuted }]}>
                Conversions and allergy substitutions are the kind of pages people reopen often.
                Giving them dedicated routes makes the app feel more dependable.
              </Text>
            </View>

            <View style={[styles.panelDark, { backgroundColor: palette.elevatedDark }]}>
              <Text style={[styles.panelDarkEyebrow, { color: palette.accentSoft }]}>Recipe direction</Text>
              <Text style={[styles.panelDarkTitle, { color: palette.inverseText }]}>
                My Recipes is now part of the structure
              </Text>
              <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>
                That page is where saved recipes can live now, and later it can become the place
                where your Obsidian recipe notes get imported or synced.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
