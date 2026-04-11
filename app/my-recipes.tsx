import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { ReferenceNav } from '../components/reference-nav';
import { useAppSettings } from '../contexts/settings-context';
import { useFavorites } from '../contexts/favorites-context';
import { obsidianRecipes } from '../data/obsidian-recipes';

export default function MyRecipesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchText, setSearchText] = useState('');
  const { favoriteSlugs, isFavorite, toggleFavorite } = useFavorites();
  const recipeCategories = Object.entries(
    obsidianRecipes.reduce<Record<string, number>>((groups, recipe) => {
      groups[recipe.category] = (groups[recipe.category] ?? 0) + 1;
      return groups;
    }, {})
  ).map(([name, count]) => ({ name, count }));
  const categoryFilters = [
    { name: 'All', count: obsidianRecipes.length },
    { name: 'Favorites', count: favoriteSlugs.length },
    ...recipeCategories,
  ];
  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredRecipes = useMemo(
    () =>
      (activeCategory === 'All'
        ? obsidianRecipes
        : activeCategory === 'Favorites'
          ? obsidianRecipes.filter((recipe) => favoriteSlugs.includes(recipe.slug))
          : obsidianRecipes.filter((recipe) => recipe.category === activeCategory)).filter((recipe) =>
        normalizedSearch
          ? `${recipe.title} ${recipe.category} ${recipe.allergyFriendlyTags.join(' ')} ${recipe.allergenTags.join(' ')}` 
              .toLowerCase()
              .includes(normalizedSearch)
          : true
      ),
    [activeCategory, favoriteSlugs, normalizedSearch]
  );

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
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>Recipe library</Text>
            <Text style={[styles.title, { color: palette.text }]}>My Recipes</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              This page now reflects the actual recipe notes in your `Cooking` Obsidian vault. It
              gives the app a real recipe shelf to build from instead of placeholders.
            </Text>

            <ReferenceNav />
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Vault snapshot</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>{filteredRecipes.length} recipes shown</Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Filter by recipe type here on the page, or tap one of the folder cards below for the
              same result. Later we can go deeper and pull ingredients, directions, times, and
              servings too.
            </Text>

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search recipes, categories, or tags"
              placeholderTextColor={palette.searchPlaceholder}
              style={[
                styles.searchInput,
                { backgroundColor: palette.elevated, borderColor: palette.borderAlt, color: palette.text },
              ]}
            />

            <View style={styles.servingsRow}>
              {categoryFilters.map((category) => {
                const isActive = activeCategory === category.name;

                return (
                  <Pressable
                    key={category.name}
                    onPress={() => setActiveCategory(category.name)}
                    style={[
                      styles.servingsButton,
                      { borderColor: palette.borderAlt },
                      !isActive && { backgroundColor: palette.surface },
                      isActive && styles.servingsButtonActive,
                      isActive && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.servingsButtonText,
                        { color: isActive ? palette.inverseText : palette.text },
                        isActive && styles.servingsButtonTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.primaryColumn}>
            <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Current library</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Recipes from Obsidian</Text>
              <View style={styles.listStack}>
                {filteredRecipes.map((recipe) => (
                  <Pressable
                    key={recipe.slug}
                    onPress={() => router.push(`/recipes/${recipe.slug}`)}
                    style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{recipe.category}</Text>
                    <View style={styles.detailCardHeader}>
                      <Text style={[styles.detailCardTitle, { color: palette.text }]}>{recipe.title}</Text>
                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          toggleFavorite(recipe.slug);
                        }}
                        style={[
                          styles.starButton,
                          { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                          isFavorite(recipe.slug) && styles.starButtonActive,
                        ]}
                      >
                        <Text style={[styles.starButtonText, { color: palette.accentText }]}>
                          {isFavorite(recipe.slug) ? '★' : '☆'}
                        </Text>
                      </Pressable>
                    </View>
                    {recipe.allergyFriendlyTags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {recipe.allergyFriendlyTags.map((tag) => (
                          <View key={tag} style={styles.allergyFriendlyTag}>
                            <Text style={styles.allergyFriendlyTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {recipe.allergenTags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {recipe.allergenTags.map((tag) => (
                          <View key={tag} style={styles.allergenTag}>
                            <Text style={styles.allergenTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {recipe.prepTime || recipe.cookTime ? (
                      <View style={styles.tagRow}>
                        {recipe.prepTime ? (
                          <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                            <Text style={[styles.tagText, { color: palette.tagText }]}>Prep: {recipe.prepTime}</Text>
                          </View>
                        ) : null}
                        {recipe.cookTime ? (
                          <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                            <Text style={[styles.tagText, { color: palette.tagText }]}>Cook: {recipe.cookTime}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                    <Text style={[styles.menuCardLink, { color: palette.accent }]}>Open recipe</Text>
                  </Pressable>
                ))}
                {filteredRecipes.length === 0 ? (
                  <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                    <Text style={[styles.detailCardTitle, { color: palette.text }]}>No recipes in this filter</Text>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                      Try another search term, another category, or switch back to `All`.
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.secondaryColumn}>
            <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Recipe folders</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Organized from your vault</Text>
              <View style={styles.listStack}>
                {recipeCategories.map((category) => (
                  <Pressable
                    key={category.name}
                    onPress={() => setActiveCategory(category.name)}
                    style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.detailCardTitle, { color: palette.text }]}>{category.name}</Text>
                    <Text style={[styles.infoCardMeta, { color: palette.accentText }]}>{category.count} recipes</Text>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                      {activeCategory === category.name ? 'Current filter' : 'Tap to filter recipes'}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setActiveCategory('All')}
                  style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                >
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>All recipes</Text>
                  <Text style={[styles.infoCardMeta, { color: palette.accentText }]}>{obsidianRecipes.length} recipes</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                    {activeCategory === 'All' ? 'Current filter' : 'Tap to clear filters'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.panelDark, { backgroundColor: palette.elevatedDark }]}>
              <Text style={[styles.panelDarkEyebrow, { color: palette.accentSoft }]}>Next integration step</Text>
              <Text style={[styles.panelDarkTitle, { color: palette.inverseText }]}>
                Use the note contents themselves
              </Text>
              <Text style={[styles.panelDarkText, { color: palette.inverseMuted }]}>
                Your recipe library is now backed by the actual Obsidian notes in `Cooking/`, so
                titles, ingredients, directions, and much of the metadata are already flowing into
                the app.
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => router.push('/recipe')}
                  style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                >
                  <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>
                    Open recipe preview
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
