import { useRouter } from 'expo-router';
import { Image, Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { kitchenStyles as styles } from '../components/kitchen-styles';
import { FryingPanIcon } from '../components/recipe-action-icons';
import { useAuth } from '../contexts/auth-context';
import { useAppSettings } from '../contexts/settings-context';

const homeHeroLogo = require('../assets/kitchen-helper-logo-icon.png');
const addRecipeHref = '/add-recipe' as const;

const menuItems = [
  {
    title: 'My Recipes',
    body: 'A personal library for your recipes.',
    href: '/my-recipes' as const,
  },
  {
    title: 'Sample Recipes',
    body: 'A curated listing of tested favorites from the developer.',
    href: '/recipe' as const,
  },
  {
    title: 'Kitchen Guides',
    body: 'Conversions, substitutions, and cooking dictionary tools collected in one quick-reference space.',
    href: '/reference' as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isMobile = width < 768;
  const { palette } = useAppSettings();
  const { configured, user } = useAuth();
  const addRecipeButton = (
    <Pressable
      accessibilityLabel="Add recipe"
      onPress={() => router.push(addRecipeHref)}
      style={[
        styles.homeAddRecipeButton,
        isMobile ? styles.homeAddRecipeButtonFloating : styles.homeAddRecipeButtonDesktop,
        { backgroundColor: palette.addButtonBg, borderColor: palette.addButtonBorder },
      ]}
    >
      <View style={[styles.homeAddRecipeIconWrap, isMobile && styles.homeAddRecipeIconWrapFloating]}>
        <FryingPanIcon size={isMobile ? 66 : 38} palette={palette} />
        <View
          style={[
            styles.homeAddRecipePlusBadge,
            isMobile && styles.homeAddRecipePlusBadgeFloating,
            { backgroundColor: palette.addButtonBg, borderColor: palette.addButtonBorder },
          ]}
        >
          <Text
            style={[
              styles.homeAddRecipePlusText,
              isMobile && styles.homeAddRecipePlusTextFloating,
              { color: palette.addButtonText },
            ]}
          >
            +
          </Text>
        </View>
      </View>
      {!isMobile ? (
        <Text style={[styles.homeAddRecipeLabel, { color: palette.addButtonText }]}>Add Recipe</Text>
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={[styles.page, isMobile && styles.homePageWithFloatingAction]}>
        <View
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
            {isMobile ? (
              <View style={styles.heroTitleStack}>
                <Text style={[styles.title, { color: palette.text }]}>Your Kitchen.</Text>
                <View style={styles.heroTitleRow}>
                  <Text style={[styles.title, { color: palette.text }]}>Your Way.</Text>
                  <Image source={homeHeroLogo} style={styles.heroTitleLogo} resizeMode="contain" />
                </View>
              </View>
            ) : (
              <Text style={[styles.title, { color: palette.text }]}>Your Kitchen. Your Way.</Text>
            )}
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              {configured
                ? user
                  ? null
                  : 'Sign in on the account page to sync your recipe library across mobile and web.'
                : 'Add Supabase sync config to enable a shared recipe library across devices.'}
            </Text>
          </View>
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.primaryColumn}>
            <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
              <View style={styles.menuGrid}>
                {menuItems.map((item) => (
                  <Pressable
                    key={item.title}
                    onPress={() => router.push(item.href)}
                    style={[
                      styles.menuCard,
                      isMobile && item.title === 'Kitchen Guides' && styles.homeKitchenGuidesCardMobile,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                    ]}
                  >
                    <Text style={[styles.menuCardTitle, { color: palette.text }]}>{item.title}</Text>
                    <Text
                      style={[
                        styles.menuCardBody,
                        isMobile && item.title === 'Kitchen Guides' && styles.homeKitchenGuidesBodyMobile,
                        { color: palette.textMuted },
                      ]}
                    >
                      {item.body}
                    </Text>
                  </Pressable>
                ))}
                {isMobile ? null : <View style={styles.homeAddRecipeDesktopRow}>{addRecipeButton}</View>}
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
      {isMobile ? addRecipeButton : null}
    </SafeAreaView>
  );
}
