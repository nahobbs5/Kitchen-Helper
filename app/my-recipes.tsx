import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useAppSettings } from '../contexts/settings-context';
import { useFavorites } from '../contexts/favorites-context';
import { obsidianRecipes } from '../data/obsidian-recipes';

export default function MyRecipesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette } = useAppSettings();
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [activeCuisineFilters, setActiveCuisineFilters] = useState<string[]>([]);
  const [activeAllergenTags, setActiveAllergenTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const { clearDeletedRecipe, customRecipes, lastDeletedRecipe, recipeOverrideMap, restoreDeletedRecipe } =
    useCustomRecipes();
  const { favoriteSlugs, isFavorite, toggleFavorite } = useFavorites();
  const allRecipes = useMemo(
    () => [
      ...customRecipes,
      ...obsidianRecipes.map((recipe) => {
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
              notes: override.notes,
              cuisineRegion: override.cuisineRegion,
            }
          : recipe;
      }),
    ],
    [customRecipes, recipeOverrideMap]
  );
  const recipeCategories = Object.entries(
    allRecipes.reduce<Record<string, number>>((groups, recipe) => {
      groups[recipe.category] = (groups[recipe.category] ?? 0) + 1;
      return groups;
    }, {})
  ).map(([name, count]) => ({ name, count }));
  const categoryFilters = [
    { name: 'All', count: allRecipes.length },
    { name: 'Favorites', count: favoriteSlugs.length },
    ...recipeCategories,
  ];
  const cuisineFilters = [
    { name: 'All', count: allRecipes.length },
    ...Object.entries(
      allRecipes.reduce<Record<string, number>>((groups, recipe) => {
        const cuisine = (recipe as { cuisineRegion?: string | null }).cuisineRegion;

        if (!cuisine) {
          return groups;
        }

        groups[cuisine] = (groups[cuisine] ?? 0) + 1;
        return groups;
      }, {})
    )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, count]) => ({ name, count })),
  ];
  const allergenFilters = [
    { name: 'All', count: allRecipes.length },
    ...Object.entries(
      allRecipes.reduce<Record<string, number>>((groups, recipe) => {
        [...recipe.allergyFriendlyTags, ...recipe.allergenTags].forEach((tag) => {
          groups[tag] = (groups[tag] ?? 0) + 1;
        });
        return groups;
      }, {})
    )
      .sort(([left], [right]) => {
        const leftFriendly = left.toLowerCase().includes('free');
        const rightFriendly = right.toLowerCase().includes('free');

        if (leftFriendly !== rightFriendly) {
          return leftFriendly ? -1 : 1;
        }

        return left.localeCompare(right);
      })
      .map(([name, count]) => ({ name, count })),
  ];
  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredRecipes = useMemo(
    () =>
      allRecipes
        .filter((recipe) =>
          activeCategoryFilters.includes('Favorites') ? favoriteSlugs.includes(recipe.slug) : true
        )
        .filter((recipe) => {
          const selectedCategories = activeCategoryFilters.filter((value) => value !== 'Favorites');
          return selectedCategories.length === 0 ? true : selectedCategories.includes(recipe.category);
        })
        .filter((recipe) =>
          activeCuisineFilters.length === 0
            ? true
            : activeCuisineFilters.includes((recipe as { cuisineRegion?: string | null }).cuisineRegion ?? '')
        )
        .filter((recipe) =>
          activeAllergenTags.length === 0
            ? true
            : activeAllergenTags.every((tag) =>
                [...recipe.allergenTags, ...recipe.allergyFriendlyTags].includes(tag)
              )
        )
        .filter((recipe) =>
          normalizedSearch
            ? `${recipe.title} ${recipe.category} ${(recipe as { cuisineRegion?: string | null }).cuisineRegion ?? ''} ${recipe.allergyFriendlyTags.join(' ')} ${recipe.allergenTags.join(' ')}`
                .toLowerCase()
                .includes(normalizedSearch)
            : true
        ),
    [activeAllergenTags, activeCategoryFilters, activeCuisineFilters, allRecipes, favoriteSlugs, normalizedSearch]
  );

  function toggleCategoryFilter(tag: string) {
    if (tag === 'All') {
      setActiveCategoryFilters([]);
      return;
    }

    setActiveCategoryFilters((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  }

  function toggleCuisineFilter(tag: string) {
    if (tag === 'All') {
      setActiveCuisineFilters([]);
      return;
    }

    setActiveCuisineFilters((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  }

  function toggleAllergenFilter(tag: string) {
    if (tag === 'All') {
      setActiveAllergenTags([]);
      return;
    }

    setActiveAllergenTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  }

  useEffect(() => {
    if (!lastDeletedRecipe) {
      return;
    }

    const timeoutId = setTimeout(() => {
      clearDeletedRecipe();
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [clearDeletedRecipe, lastDeletedRecipe]);

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
              This page now combines the recipe notes from your `Cooking` Obsidian vault with
              recipes saved directly inside the app, so your library can grow from both places.
            </Text>
            {lastDeletedRecipe ? (
              <View
                style={[
                  styles.noticeCard,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                ]}
              >
                <Text style={[styles.noticeCardTitle, { color: palette.text }]}>
                  Deleted {lastDeletedRecipe.title}
                </Text>
                <Text style={[styles.noticeCardBody, { color: palette.textMuted }]}>
                  You can undo this and restore the recipe to app storage.
                </Text>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={restoreDeletedRecipe}
                    style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>Undo Delete</Text>
                  </Pressable>
                  <Pressable
                    onPress={clearDeletedRecipe}
                    style={[
                      styles.secondaryButton,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                    ]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Dismiss</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => router.push('/add-recipe')}
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>+ Add Recipe</Text>
              </Pressable>
            </View>

            <ReferenceNav />
          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Vault snapshot</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>{filteredRecipes.length} recipes shown</Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Filter by recipe type here on the page, or tap one of the folder cards below for the
              same result. Favorites and newly added app recipes show up in the same library view.
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
                const isActive =
                  category.name === 'All'
                    ? activeCategoryFilters.length === 0
                    : activeCategoryFilters.includes(category.name);

                return (
                  <Pressable
                    key={category.name}
                    onPress={() => toggleCategoryFilter(category.name)}
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

            {cuisineFilters.length > 1 ? (
              <>
                <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Cuisine region</Text>
                <View style={styles.servingsRow}>
                  {cuisineFilters.map((cuisine) => {
                    const isActive =
                      cuisine.name === 'All'
                        ? activeCuisineFilters.length === 0
                        : activeCuisineFilters.includes(cuisine.name);

                    return (
                      <Pressable
                        key={cuisine.name}
                        onPress={() => toggleCuisineFilter(cuisine.name)}
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
                          {cuisine.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            {allergenFilters.length > 1 ? (
              <>
                <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Allergen tags</Text>
                <View style={styles.servingsRow}>
                  {allergenFilters.map((filter) => {
                    const isActive =
                      filter.name === 'All'
                        ? activeAllergenTags.length === 0
                        : activeAllergenTags.includes(filter.name);

                    return (
                      <Pressable
                        key={filter.name}
                        onPress={() => toggleAllergenFilter(filter.name)}
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
                          {filter.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>
        </View>

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          <View style={styles.primaryColumn}>
            <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
              <Text style={[styles.panelEyebrow, { color: palette.accentText }]}>Current library</Text>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Recipes from vault and app storage</Text>
              <View style={styles.listStack}>
                {filteredRecipes.map((recipe) => (
                  <Pressable
                    key={recipe.slug}
                    onPress={() =>
                      router.push(
                        recipe.source === 'App Storage'
                          ? { pathname: '/user-recipes/[slug]', params: { slug: recipe.slug } }
                          : { pathname: '/recipes/[slug]', params: { slug: recipe.slug } }
                      )
                    }
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
                    {(recipe as { cuisineRegion?: string | null }).cuisineRegion ? (
                      <View style={styles.tagRow}>
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();
                            toggleCuisineFilter((recipe as { cuisineRegion?: string | null }).cuisineRegion ?? 'All');
                          }}
                          style={styles.cuisineTag}
                        >
                          <Text style={styles.cuisineTagText}>
                            {(recipe as { cuisineRegion?: string | null }).cuisineRegion}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                    {recipe.allergyFriendlyTags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {recipe.allergyFriendlyTags.map((tag) => (
                          <Pressable
                            key={tag}
                            onPress={(event) => {
                            event.stopPropagation();
                              toggleAllergenFilter(tag);
                            }}
                            style={styles.allergyFriendlyTag}
                          >
                            <Text style={styles.allergyFriendlyTagText}>{tag}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                    {recipe.allergenTags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {recipe.allergenTags.map((tag) => (
                          <Pressable
                            key={tag}
                            onPress={(event) => {
                            event.stopPropagation();
                              toggleAllergenFilter(tag);
                            }}
                            style={styles.allergenTag}
                          >
                            <Text style={styles.allergenTagText}>{tag}</Text>
                          </Pressable>
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
                    onPress={() => toggleCategoryFilter(category.name)}
                    style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.detailCardTitle, { color: palette.text }]}>{category.name}</Text>
                    <Text style={[styles.infoCardMeta, { color: palette.accentText }]}>{category.count} recipes</Text>
                    <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                      {activeCategoryFilters.includes(category.name) ? 'Current filter' : 'Tap to filter recipes'}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => toggleCategoryFilter('All')}
                  style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                >
                  <Text style={[styles.detailCardTitle, { color: palette.text }]}>All recipes</Text>
                  <Text style={[styles.infoCardMeta, { color: palette.accentText }]}>{allRecipes.length} recipes</Text>
                  <Text style={[styles.detailCardBody, { color: palette.textMuted }]}>
                    {activeCategoryFilters.length === 0 ? 'Current filter' : 'Tap to clear filters'}
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
