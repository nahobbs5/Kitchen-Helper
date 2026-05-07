import { useRouter } from 'expo-router';
import { Image, Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { kitchenStyles as styles } from '../components/kitchen-styles';
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
        { backgroundColor: '#fff8ef', borderColor: '#edca88' },
      ]}
    >
      <View style={[styles.homeAddRecipeIconWrap, isMobile && styles.homeAddRecipeIconWrapFloating]}>
        <FryingPanIcon size={isMobile ? 66 : 38} />
        <View
          style={[
            styles.homeAddRecipePlusBadge,
            isMobile && styles.homeAddRecipePlusBadgeFloating,
            { backgroundColor: '#fff8ef', borderColor: '#edca88' },
          ]}
        >
          <Text
            style={[
              styles.homeAddRecipePlusText,
              isMobile && styles.homeAddRecipePlusTextFloating,
              { color: '#4a2d63' },
            ]}
          >
            +
          </Text>
        </View>
      </View>
      {!isMobile ? (
        <Text style={[styles.homeAddRecipeLabel, { color: '#4a2d63' }]}>Add Recipe</Text>
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

function FryingPanIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="6 11 27 24" fill="none">
      <Path
        d="M17 22.3L26.2 28.8"
        stroke="#4a2d63"
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <Path
        d="M24.3 27.5L29 30.8"
        stroke="#4a2d63"
        strokeWidth={4.4}
        strokeLinecap="round"
      />
      <Circle cx={15.1} cy={20.4} r={7.2} fill="#4a2d63" />
      <Circle cx={15.1} cy={20.4} r={3.9} fill="#fff8ef" />
      <Circle cx={15.1} cy={20.4} r={1.8} fill="#d3a64f" />
      <Path
        d="M11.3 17.3C12.3 16.4 13.6 15.9 15.1 15.9"
        stroke="#7d6293"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
