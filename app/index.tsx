import { Link } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';

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
  const { width } = useWindowDimensions();
  const isWide = width >= 960;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Kitchen utility hub</Text>
            <Text style={styles.title}>Useful kitchen tools in one place</Text>
            <Text style={styles.subtitle}>
              The home screen now acts like a menu for the app. Instead of one demo page, we have
              dedicated routes for references, substitutions, recipes, and the scaling prototype.
            </Text>

            <View style={styles.badgeRow}>
              <Text style={styles.badge}>Conversions</Text>
              <Text style={styles.badge}>Allergy swaps</Text>
              <Text style={styles.badge}>My recipes</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroCardLabel}>What this unlocks</Text>
            <Text style={styles.heroCardTitle}>A clearer app structure</Text>
            <Text style={styles.heroCardText}>
              Each major feature can now grow on its own screen without crowding the rest of the
              app. That matters on both Android and web.
            </Text>
          </View>
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.primaryColumn}>
            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>Main menu</Text>
              <Text style={styles.panelTitle}>Pick a kitchen helper</Text>
              <View style={styles.menuGrid}>
                {menuItems.map((item) => (
                  <Link key={item.title} href={item.href} asChild>
                    <Pressable style={styles.menuCard}>
                      <Text style={styles.menuCardEyebrow}>{item.eyebrow}</Text>
                      <Text style={styles.menuCardTitle}>{item.title}</Text>
                      <Text style={styles.menuCardBody}>{item.body}</Text>
                      <Text style={styles.menuCardLink}>Open screen</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.secondaryColumn}>
            <View style={styles.panelAlt}>
              <Text style={styles.panelEyebrow}>Why these pages matter</Text>
              <Text style={styles.panelTitle}>Reference content needs a home</Text>
              <Text style={styles.panelText}>
                Conversions and allergy substitutions are the kind of pages people reopen often.
                Giving them dedicated routes makes the app feel more dependable.
              </Text>
            </View>

            <View style={styles.panelDark}>
              <Text style={styles.panelDarkEyebrow}>Recipe direction</Text>
              <Text style={styles.panelDarkTitle}>My Recipes is now part of the structure</Text>
              <Text style={styles.panelDarkText}>
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
