import { useRouter } from 'expo-router';
import { BookHeart, BookMarked, BookOpen, ChefHat, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import type { AppPalette } from '../components/app-theme';
import { kitchenStyles as styles } from '../components/kitchen-styles';
import { FryingPanIcon } from '../components/recipe-action-icons';
import { PillButton } from '../components/settings-ui';
import { useAuth } from '../contexts/auth-context';
import { useAppSettings } from '../contexts/settings-context';

const addRecipeHref = '/add-recipe' as const;

const menuItems: {
  title: string;
  body: string;
  href: '/my-recipes' | '/recipe' | '/reference';
  Icon: LucideIcon;
  tint: (palette: AppPalette) => string;
}[] = [
  {
    title: 'My Recipes',
    body: 'A personal library for your recipes.',
    href: '/my-recipes',
    Icon: BookHeart,
    tint: (palette) => palette.highlightTemp,
  },
  {
    title: 'Sample Recipes',
    body: 'A curated listing of tested favorites from the developer.',
    href: '/recipe',
    Icon: BookOpen,
    tint: (palette) => palette.tag,
  },
  {
    title: 'Kitchen Guides',
    body: 'Conversions, substitutions, and a cooking dictionary in one place.',
    href: '/reference',
    Icon: BookMarked,
    tint: (palette) => palette.highlightDoneness,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isNarrow = width < 380;
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
        <View style={styles.homeDashboard}>
        {configured && !user ? (
          <View
            style={[
              styles.homeSyncCard,
              isNarrow && styles.homeSyncCardStacked,
              { backgroundColor: palette.surface, borderColor: palette.borderAlt },
            ]}
          >
            <View style={[styles.homeArtCircle, styles.homeArtCircleLarge, { backgroundColor: palette.highlightDoneness }]}>
              <ChefHat size={48} color={palette.accent} />
            </View>
            <View style={styles.homeSyncCopy}>
              <Text style={[styles.menuCardTitle, { color: palette.text }]}>Sync your recipes</Text>
              <Text style={[styles.menuCardBody, { color: palette.textMuted }]}>
                Sign in to keep your recipe library in sync across your mobile device and the web.
              </Text>
              <View style={styles.homeSyncActions}>
                <View style={styles.homeSyncAction}>
                  <PillButton label="Sign in" onPress={() => router.push('/account/sign-in')} />
                </View>
                <View style={styles.homeSyncAction}>
                  <PillButton
                    variant="secondary"
                    label="Create account"
                    onPress={() => router.push({ pathname: '/account/sign-in', params: { mode: 'signup' } })}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.homeMenuList}>
          {menuItems.map(({ title, body, href, Icon, tint }) => (
            <Pressable
              key={title}
              accessibilityRole="button"
              onPress={() => router.push(href)}
              android_ripple={{ color: palette.borderAlt }}
              style={({ pressed }) => [
                styles.menuCard,
                styles.homeMenuCardRow,
                { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={[styles.homeArtCircle, { backgroundColor: tint(palette) }]}>
                <Icon size={36} color={palette.accent} />
              </View>
              <View style={styles.homeMenuCardCopy}>
                <Text style={[styles.menuCardTitle, { color: palette.text }]}>{title}</Text>
                <Text style={[styles.menuCardBody, { color: palette.textMuted }]}>{body}</Text>
              </View>
              <View style={[styles.homeChevronButton, { backgroundColor: palette.elevatedAlt }]}>
                <ChevronRight size={22} color={palette.accentText} />
              </View>
            </Pressable>
          ))}
          {isMobile ? null : <View style={styles.homeAddRecipeDesktopRow}>{addRecipeButton}</View>}
        </View>
        </View>
      </ScrollView>
      {isMobile ? addRecipeButton : null}
    </SafeAreaView>
  );
}
