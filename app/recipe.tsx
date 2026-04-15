import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useAppSettings } from '../contexts/settings-context';
import { obsidianRecipes } from '../data/obsidian-recipes';

const sampleRecipeCategories = ['Appetizers', 'Dessert', 'Entree', 'Breakfast'] as const;

export default function SampleRecipesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const { recipeOverrideMap } = useCustomRecipes();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchText, setSearchText] = useState('');

  const sampleRecipes = useMemo(
    () =>
      obsidianRecipes
        .filter((recipe) => sampleRecipeCategories.includes(recipe.category as (typeof sampleRecipeCategories)[number]))
        .filter((recipe) => !recipeOverrideMap[recipe.slug]?.deleted)
        .map((recipe) => {
          const override = recipeOverrideMap[recipe.slug];

          return override
            ? {
                ...recipe,
                title: override.title,
                category: override.category,
                allergyFriendlyTags: override.allergyFriendlyTags,
                allergenTags: override.allergenTags,
                ingredients: override.ingredients,
                directions: override.directions,
                cuisineRegion: override.cuisineRegion,
                notes: override.notes,
                sourceInfo: override.sourceInfo,
              }
            : {
                ...recipe,
                cuisineRegion: null,
                notes: null,
                sourceInfo: null,
              };
        })
        .sort((left, right) => left.title.localeCompare(right.title)),
    [recipeOverrideMap]
  );

  const categoryCounts = sampleRecipeCategories.map((category) => ({
    name: category,
    count: sampleRecipes.filter((recipe) => recipe.category === category).length,
  }));

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return sampleRecipes.filter((recipe) => {
      const matchesCategory = activeCategory === 'All' ? true : recipe.category === activeCategory;
      const cuisine = (recipe as { cuisineRegion?: string | null }).cuisineRegion ?? '';
      const tagText = [...recipe.allergyFriendlyTags, ...recipe.allergenTags].join(' ');
      const matchesSearch = normalizedSearch
        ? `${recipe.title} ${recipe.category} ${cuisine} ${tagText}`.toLowerCase().includes(normalizedSearch)
        : true;

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, sampleRecipes, searchText]);

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
            <Text style={[styles.eyebrow, { color: palette.accentText }]}>Imported recipe library</Text>
            <Text style={[styles.title, { color: palette.text }]}>Sample Recipes</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              A curated listing of tested favorites from the developer.
            </Text>
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Imported sample set</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>
              {filteredRecipes.length} recipes shown
            </Text>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search sample recipes"
              placeholderTextColor={palette.searchPlaceholder}
              style={[
                styles.searchInput,
                { backgroundColor: palette.elevated, borderColor: palette.borderAlt, color: palette.text },
              ]}
            />

            <View style={styles.servingsRow}>
              {['All', ...sampleRecipeCategories].map((category) => {
                const isActive = activeCategory === category;

                return (
                  <Pressable
                    key={category}
                    onPress={() => setActiveCategory(category)}
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
                      {category}
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
              <Text style={[styles.panelTitle, { color: palette.text }]}>Imported Samples</Text>
              <View style={styles.listStack}>
                {filteredRecipes.map((recipe) => (
                  <Pressable
                    key={recipe.slug}
                    onPress={() =>
                      router.push({
                        pathname: '/recipes/[slug]',
                        params: { slug: recipe.slug, origin: 'sample-recipes' },
                      })
                    }
                    style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{recipe.category}</Text>
                    <Text style={[styles.detailCardTitle, { color: palette.text }]}>{recipe.title}</Text>

                    {(recipe as { cuisineRegion?: string | null }).cuisineRegion ? (
                      <View style={styles.tagRow}>
                        <View style={styles.cuisineTag}>
                          <Text style={styles.cuisineTagText}>
                            {(recipe as { cuisineRegion?: string | null }).cuisineRegion}
                          </Text>
                        </View>
                      </View>
                    ) : null}
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
                    {recipe.prepTime || recipe.cookTime || recipe.servings ? (
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
                        {recipe.servings ? (
                          <View style={[styles.tag, { backgroundColor: palette.tag }]}>
                            <Text style={[styles.tagText, { color: palette.tagText }]}>Serves: {recipe.servings}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </Pressable>
                ))}
                {filteredRecipes.length === 0 ? (
                  <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}>
                    <Text style={[styles.detailCardTitle, { color: palette.text }]}>No sample recipes found</Text>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                      Try another category or search term.
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {isWide ? (
            <View style={styles.secondaryColumn}>
              <View
                style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}
              >
                <Text style={[styles.panelTitle, { color: palette.text }]}>Sample Categories</Text>
                <View style={styles.listStack}>
                  {categoryCounts.map((category) => (
                    <Pressable
                      key={category.name}
                      onPress={() => setActiveCategory(category.name)}
                      style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                    >
                      <Text style={[styles.detailCardTitle, { color: palette.text }]}>{category.name}</Text>
                      <Text style={[styles.infoCardMeta, { color: palette.accentText }]}>
                        {category.count} recipes
                      </Text>
                      <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                        {activeCategory === category.name ? 'Current filter' : 'Tap to filter this sample group'}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => setActiveCategory('All')}
                    style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.detailCardTitle, { color: palette.text }]}>All sample recipes</Text>
                    <Text style={[styles.infoCardMeta, { color: palette.accentText }]}>
                      {sampleRecipes.length} recipes
                    </Text>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                      {activeCategory === 'All' ? 'Current filter' : 'Tap to show the full sample set'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
