import { Link, useRouter } from 'expo-router';
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
import { useFavorites } from '../contexts/favorites-context';
import { obsidianRecipes } from '../data/obsidian-recipes';

export default function MyRecipesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Recipe library</Text>
            <Text style={styles.title}>My Recipes</Text>
            <Text style={styles.subtitle}>
              This page now reflects the actual recipe notes in your `Cooking` Obsidian vault. It
              gives the app a real recipe shelf to build from instead of placeholders.
            </Text>

            <View style={styles.actionRow}>
              <Link href="/conversions" asChild>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Conversions</Text>
                </Pressable>
              </Link>
              <Link href="/allergy-substitutions" asChild>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Substitutions</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroCardLabel}>Vault snapshot</Text>
            <Text style={styles.heroCardTitle}>
              {filteredRecipes.length} recipes shown
            </Text>
            <Text style={styles.heroCardText}>
              Filter by recipe type here on the page, or tap one of the folder cards below for the
              same result. Later we can go deeper and pull ingredients, directions, times, and
              servings too.
            </Text>

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search recipes, categories, or tags"
              placeholderTextColor="#8f775b"
              style={styles.searchInput}
            />

            <View style={styles.servingsRow}>
              {categoryFilters.map((category) => {
                const isActive = activeCategory === category.name;

                return (
                  <Pressable
                    key={category.name}
                    onPress={() => setActiveCategory(category.name)}
                    style={[styles.servingsButton, isActive && styles.servingsButtonActive]}
                  >
                    <Text
                      style={[
                        styles.servingsButtonText,
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
            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>Current library</Text>
              <Text style={styles.panelTitle}>Recipes from Obsidian</Text>
              <View style={styles.listStack}>
                {filteredRecipes.map((recipe) => (
                    <Pressable
                      key={recipe.slug}
                      onPress={() => router.push(`/recipes/${recipe.slug}`)}
                      style={styles.detailCard}
                    >
                      <View style={styles.detailCardHeader}>
                        <Text style={styles.detailCardTitle}>{recipe.title}</Text>
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();
                            toggleFavorite(recipe.slug);
                          }}
                          style={[
                            styles.starButton,
                            isFavorite(recipe.slug) && styles.starButtonActive,
                          ]}
                        >
                          <Text style={styles.starButtonText}>
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
                            <View style={styles.tag}>
                              <Text style={styles.tagText}>Prep: {recipe.prepTime}</Text>
                            </View>
                          ) : null}
                          {recipe.cookTime ? (
                            <View style={styles.tag}>
                              <Text style={styles.tagText}>Cook: {recipe.cookTime}</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                      <Text style={styles.detailCardBody}>
                        Open this recipe to view ingredients and directions from the Markdown note.
                      </Text>
                      <Text style={styles.menuCardLink}>Open recipe</Text>
                    </Pressable>
                ))}
                {filteredRecipes.length === 0 ? (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>No recipes in this filter</Text>
                    <Text style={styles.detailCardBody}>
                      Try another search term, another category, or switch back to `All`.
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.secondaryColumn}>
            <View style={styles.panelAlt}>
              <Text style={styles.panelEyebrow}>Recipe folders</Text>
              <Text style={styles.panelTitle}>Organized from your vault</Text>
              <View style={styles.listStack}>
                {recipeCategories.map((category) => (
                  <Pressable
                    key={category.name}
                    onPress={() => setActiveCategory(category.name)}
                    style={styles.detailCard}
                  >
                    <Text style={styles.detailCardTitle}>{category.name}</Text>
                    <Text style={styles.infoCardMeta}>{category.count} recipes</Text>
                    <Text style={styles.detailCardBody}>
                      {activeCategory === category.name ? 'Current filter' : 'Tap to filter recipes'}
                    </Text>
                  </Pressable>
                ))}
                <Pressable onPress={() => setActiveCategory('All')} style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>All recipes</Text>
                  <Text style={styles.infoCardMeta}>{obsidianRecipes.length} recipes</Text>
                  <Text style={styles.detailCardBody}>
                    {activeCategory === 'All' ? 'Current filter' : 'Tap to clear filters'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.panelDark}>
              <Text style={styles.panelDarkEyebrow}>Next integration step</Text>
              <Text style={styles.panelDarkTitle}>Use the note contents themselves</Text>
              <Text style={styles.panelDarkText}>
                The app is currently showing recipe titles and categories from your Obsidian vault.
                Next we can parse ingredients and directions from the Markdown so a recipe page uses
                the real note content.
              </Text>

              <View style={styles.actionRow}>
                <Link href="/recipe" asChild>
                  <Pressable style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Open recipe preview</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
