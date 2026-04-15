import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { ShareIcon } from '../components/share-icon';
import { NoticePieTimer } from '../components/notice-pie-timer';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useAppSettings } from '../contexts/settings-context';
import { useFavorites } from '../contexts/favorites-context';
import { obsidianRecipes } from '../data/obsidian-recipes';
import { allergenTagOptions, allergyFriendlyTagOptions } from '../utils/allergen-tags';

const bulkCategoryOptions = ['Keep existing', 'Appetizers', 'Breakfast', 'Side', 'Entree', 'Dessert'] as const;

export default function MyRecipesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const { openSettings, palette } = useAppSettings();
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [activeCuisineFilters, setActiveCuisineFilters] = useState<string[]>([]);
  const [activeAllergenTags, setActiveAllergenTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecipeSlugs, setSelectedRecipeSlugs] = useState<string[]>([]);
  const [selectionAnchorSlug, setSelectionAnchorSlug] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkMetadataEditor, setShowBulkMetadataEditor] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<(typeof bulkCategoryOptions)[number]>('Keep existing');
  const [bulkCuisineRegion, setBulkCuisineRegion] = useState('');
  const [bulkApplyCuisineRegion, setBulkApplyCuisineRegion] = useState(false);
  const [bulkAllergenTagsToAdd, setBulkAllergenTagsToAdd] = useState<string[]>([]);
  const [bulkFriendlyTagsToAdd, setBulkFriendlyTagsToAdd] = useState<string[]>([]);
  const [dismissProgress, setDismissProgress] = useState(0);
  const {
    bulkUpdateRecipeMetadata,
    clearDeletedRecipes,
    customRecipes,
    deleteRecipes,
    lastDeletedRecipes,
    recipeOverrideMap,
    restoreDeletedRecipes,
    syncBusy,
    syncConfigured,
    syncEnabled,
    syncError,
  } = useCustomRecipes();
  const { favoriteRecipes, favoriteSlugs, isFavorite, toggleFavorite } = useFavorites();
  const allRecipes = useMemo(
    () => [
      ...customRecipes,
      ...obsidianRecipes.filter((recipe) => !recipeOverrideMap[recipe.slug]?.deleted).map((recipe) => {
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

  function toggleSelectionMode() {
    setSelectionMode((current) => !current);
    setSelectedRecipeSlugs([]);
    setSelectionAnchorSlug(null);
    setShowBulkDeleteConfirm(false);
  }

  function toggleRecipeSelection(slug: string) {
    setSelectedRecipeSlugs((current) =>
      current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug]
    );
    setSelectionAnchorSlug(slug);
  }

  function handleSelectionPress(slug: string, shiftKey?: boolean) {
    if (shiftKey && selectionAnchorSlug) {
      const anchorIndex = filteredRecipes.findIndex((recipe) => recipe.slug === selectionAnchorSlug);
      const targetIndex = filteredRecipes.findIndex((recipe) => recipe.slug === slug);

      if (anchorIndex >= 0 && targetIndex >= 0) {
        const start = Math.min(anchorIndex, targetIndex);
        const end = Math.max(anchorIndex, targetIndex);
        const rangeSlugs = filteredRecipes.slice(start, end + 1).map((recipe) => recipe.slug);

        setSelectedRecipeSlugs((current) => [...new Set([...current, ...rangeSlugs])]);
        setSelectionAnchorSlug(slug);
        return;
      }
    }

    toggleRecipeSelection(slug);
  }

  function selectAllVisibleRecipes() {
    setSelectedRecipeSlugs(filteredRecipes.map((recipe) => recipe.slug));
    setSelectionAnchorSlug(filteredRecipes.at(-1)?.slug ?? null);
  }

  function clearSelectedRecipes() {
    setSelectedRecipeSlugs([]);
    setSelectionAnchorSlug(null);
    setShowBulkDeleteConfirm(false);
    setShowBulkMetadataEditor(false);
  }

  const canApplyBulkMetadata =
    bulkCategory !== 'Keep existing' ||
    bulkApplyCuisineRegion ||
    bulkAllergenTagsToAdd.length > 0 ||
    bulkFriendlyTagsToAdd.length > 0;

  async function handleBulkDelete() {
    if (selectedRecipeSlugs.length === 0) {
      return;
    }

    await deleteRecipes(selectedRecipeSlugs);
    setSelectedRecipeSlugs([]);
    setShowBulkDeleteConfirm(false);
    setSelectionMode(false);
  }

  function handleBulkDeletePress() {
    if (selectedRecipeSlugs.length === 0) {
      return;
    }

    setShowBulkDeleteConfirm(true);
  }

  function handleFavoriteSelected() {
    if (selectedRecipeSlugs.length === 0) {
      return;
    }

    favoriteRecipes(selectedRecipeSlugs);
  }

  function toggleBulkAllergenTag(tag: string) {
    setBulkAllergenTagsToAdd((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  }

  function toggleBulkFriendlyTag(tag: string) {
    setBulkFriendlyTagsToAdd((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  }

  async function handleApplyBulkMetadata() {
    if (!canApplyBulkMetadata || selectedRecipeSlugs.length === 0) {
      return;
    }

    await bulkUpdateRecipeMetadata({
      slugs: selectedRecipeSlugs,
      category: bulkCategory === 'Keep existing' ? null : bulkCategory,
      cuisineRegion: bulkCuisineRegion,
      applyCuisineRegion: bulkApplyCuisineRegion,
      allergenTagsToAdd: bulkAllergenTagsToAdd,
      allergyFriendlyTagsToAdd: bulkFriendlyTagsToAdd,
    });

    setShowBulkMetadataEditor(false);
    setBulkCategory('Keep existing');
    setBulkCuisineRegion('');
    setBulkApplyCuisineRegion(false);
    setBulkAllergenTagsToAdd([]);
    setBulkFriendlyTagsToAdd([]);
  }

  useEffect(() => {
    if (lastDeletedRecipes.length === 0) {
      setDismissProgress(0);
      return;
    }

    const startedAt = Date.now();
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setDismissProgress(Math.min(elapsed / 10000, 1));
    }, 33);

    const timeoutId = setTimeout(() => {
      clearDeletedRecipes();
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [clearDeletedRecipes, lastDeletedRecipes]);

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
            {!syncEnabled ? (
              <View
                style={[
                  styles.noticeCard,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                ]}
              >
                <Text style={[styles.noticeCardTitle, { color: palette.text }]}>
                  {syncConfigured ? 'Sign in to sync recipes' : 'Finish sync setup'}
                </Text>
                <Text style={[styles.noticeCardBody, { color: palette.textMuted }]}>
                  {syncConfigured
                    ? 'Open Settings to sign in. New recipes and imported recipe overrides will sync across devices once an account is active.'
                    : 'Set the Supabase environment variables, then sign in from Settings to share one recipe library across devices.'}
                </Text>
                <Pressable
                  onPress={openSettings}
                  style={[
                    styles.secondaryButton,
                    { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                  ]}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Open Settings</Text>
                </Pressable>
              </View>
            ) : null}
            {syncEnabled && (syncBusy || syncError) ? (
              <View
                style={[
                  styles.noticeCard,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                ]}
              >
                <Text style={[styles.noticeCardTitle, { color: palette.text }]}>
                  {syncBusy ? 'Syncing recipe changes' : 'Sync issue'}
                </Text>
                <Text style={[styles.noticeCardBody, { color: palette.textMuted }]}>
                  {syncBusy
                    ? 'Changes are being written to your shared recipe library now.'
                    : syncError}
                </Text>
              </View>
            ) : null}
            {lastDeletedRecipes.length > 0 ? (
              <View
                style={[
                  styles.noticeCard,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                ]}
              >
                <Text style={[styles.noticeCardTitle, { color: palette.text }]}>
                  {lastDeletedRecipes.length === 1
                    ? `Deleted ${lastDeletedRecipes[0].title}`
                    : `Deleted ${lastDeletedRecipes.length} recipes`}
                </Text>
                <Text style={[styles.noticeCardBody, { color: palette.textMuted }]}>
                  You can undo this and restore the recipe to app storage.
                </Text>
                <View style={styles.noticeTimerRow}>
                  <View style={styles.noticeTimerGlyph}>
                    <NoticePieTimer
                      progress={dismissProgress}
                      color={palette.accent}
                      backgroundColor={palette.borderAlt}
                    />
                  </View>
                  <Text style={[styles.noticeTimerText, { color: palette.accentText }]}>
                    Auto dismissing
                  </Text>
                </View>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => {
                      void restoreDeletedRecipes();
                    }}
                    style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>Undo Delete</Text>
                  </Pressable>
                  <Pressable
                    onPress={clearDeletedRecipes}
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
                onPress={() => {
                  if (!syncEnabled) {
                    openSettings();
                    return;
                  }

                  router.push('/add-recipe');
                }}
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>+ Add Recipe</Text>
              </Pressable>
              <Pressable
                onPress={toggleSelectionMode}
                style={[
                  styles.secondaryButton,
                  { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                ]}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>
                  {selectionMode ? 'Done Selecting' : 'Select Recipes'}
                </Text>
              </Pressable>
            </View>

            {selectionMode ? (
              <View
                style={[
                  styles.noticeCard,
                  { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                ]}
              >
                <Text style={[styles.noticeCardTitle, { color: palette.text }]}>
                  {selectedRecipeSlugs.length} selected
                </Text>
                <Text style={[styles.noticeCardBody, { color: palette.textMuted }]}>
                  Tap individual recipes or their checkboxes to build a selection for bulk actions.
                </Text>
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={handleFavoriteSelected}
                    style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Favorite Selected</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowBulkMetadataEditor((current) => !current)}
                    style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Edit Metadata</Text>
                  </Pressable>
                  <Pressable
                    onPress={selectAllVisibleRecipes}
                    style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Select All</Text>
                  </Pressable>
                  <Pressable
                    onPress={clearSelectedRecipes}
                    style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Clear</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleBulkDeletePress}
                    style={[
                      styles.dangerButton,
                      selectedRecipeSlugs.length === 0 && { backgroundColor: palette.borderAlt },
                    ]}
                  >
                    <Text style={styles.dangerButtonText}>
                      🗑 Delete {selectedRecipeSlugs.length} Recipe{selectedRecipeSlugs.length === 1 ? '' : 's'}
                    </Text>
                  </Pressable>
                </View>
                {showBulkMetadataEditor ? (
                  <View
                    style={[
                      styles.noticeCard,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                    ]}
                  >
                    <Text style={[styles.noticeCardTitle, { color: palette.text }]}>Bulk metadata</Text>
                    <View style={styles.formField}>
                      <Text style={[styles.formLabel, { color: palette.accentText }]}>Category</Text>
                      <View style={styles.servingsRow}>
                        {bulkCategoryOptions.map((option) => {
                          const isActive = bulkCategory === option;

                          return (
                            <Pressable
                              key={option}
                              onPress={() => setBulkCategory(option)}
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
                                {option}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                    <View style={styles.formField}>
                      <Text style={[styles.formLabel, { color: palette.accentText }]}>Cuisine region</Text>
                      <TextInput
                        value={bulkCuisineRegion}
                        onChangeText={setBulkCuisineRegion}
                        placeholder="Optional cuisine region to apply"
                        placeholderTextColor={palette.searchPlaceholder}
                        style={[
                          styles.formInput,
                          { backgroundColor: palette.surface, borderColor: palette.borderAlt, color: palette.text },
                        ]}
                      />
                      <Pressable
                        onPress={() => setBulkApplyCuisineRegion((current) => !current)}
                        style={[
                          styles.secondaryButton,
                          { backgroundColor: bulkApplyCuisineRegion ? palette.accentSoft : palette.surface, borderColor: palette.borderAlt },
                        ]}
                      >
                        <Text
                          style={[
                            styles.secondaryButtonText,
                            { color: bulkApplyCuisineRegion ? palette.inverseText : palette.accentText },
                          ]}
                        >
                          {bulkApplyCuisineRegion ? 'Cuisine Will Be Applied' : 'Apply Cuisine Region'}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.formField}>
                      <Text style={[styles.formLabel, { color: palette.accentText }]}>Add allergy-friendly tags</Text>
                      <View style={styles.tagRow}>
                        {allergyFriendlyTagOptions.map((tag) => {
                          const isActive = bulkFriendlyTagsToAdd.includes(tag);

                          return (
                            <Pressable
                              key={tag}
                              onPress={() => toggleBulkFriendlyTag(tag)}
                              style={[
                                styles.servingsButton,
                                { borderColor: palette.borderAlt, backgroundColor: palette.surface },
                                isActive && styles.allergyFriendlyTag,
                                isActive && { borderColor: '#97bf72' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.servingsButtonText,
                                  { color: palette.text },
                                  isActive && styles.allergyFriendlyTagText,
                                ]}
                              >
                                {tag}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                    <View style={styles.formField}>
                      <Text style={[styles.formLabel, { color: palette.accentText }]}>Add allergen tags</Text>
                      <View style={styles.tagRow}>
                        {allergenTagOptions.map((tag) => {
                          const isActive = bulkAllergenTagsToAdd.includes(tag);

                          return (
                            <Pressable
                              key={tag}
                              onPress={() => toggleBulkAllergenTag(tag)}
                              style={[
                                styles.servingsButton,
                                { borderColor: palette.borderAlt, backgroundColor: palette.surface },
                                isActive && styles.allergenTag,
                                isActive && { borderColor: '#e98d34' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.servingsButtonText,
                                  { color: palette.text },
                                  isActive && styles.allergenTagText,
                                ]}
                              >
                                {tag}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={handleApplyBulkMetadata}
                        style={[
                          styles.primaryButton,
                          { backgroundColor: canApplyBulkMetadata ? palette.accent : palette.borderAlt },
                        ]}
                      >
                        <Text style={[styles.primaryButtonText, { color: palette.accentContrastText }]}>Apply Metadata</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
                {showBulkDeleteConfirm ? (
                  <View
                    style={[
                      styles.dangerCard,
                      { backgroundColor: palette.surface, borderColor: '#d47a5b' },
                    ]}
                  >
                    <Text style={[styles.dangerCardTitle, { color: palette.text }]}>
                      Delete {selectedRecipeSlugs.length} recipe{selectedRecipeSlugs.length === 1 ? '' : 's'}?
                    </Text>
                    <Text style={[styles.dangerCardBody, { color: palette.textMuted }]}>
                      This removes the selected recipes from the library. Imported recipes are hidden locally, and app-saved recipes can still be undone right after.
                    </Text>
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => setShowBulkDeleteConfirm(false)}
                        style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.borderAlt }]}
                      >
                        <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={handleBulkDelete} style={styles.dangerButton}>
                        <Text style={styles.dangerButtonText}>Delete Selected</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

          </View>

          <View style={[styles.heroCard, { backgroundColor: palette.elevatedDark }]}>
            <Text style={[styles.heroCardLabel, { color: palette.accentSoft }]}>Vault snapshot</Text>
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>{filteredRecipes.length} recipes shown</Text>
            <Text style={[styles.heroCardText, { color: palette.inverseMuted }]}>
              Search or filter your recipes.
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
              <Text style={[styles.panelTitle, { color: palette.text }]}>Your Library</Text>
              <View style={styles.listStack}>
                {filteredRecipes.map((recipe) => (
                  <Pressable
                    key={recipe.slug}
                    onPress={(event) => {
                      if (selectionMode) {
                        handleSelectionPress(recipe.slug, Boolean((event.nativeEvent as { shiftKey?: boolean }).shiftKey));
                        return;
                      }

                      router.push(
                        recipe.source === 'App Storage'
                          ? { pathname: '/user-recipes/[slug]', params: { slug: recipe.slug } }
                          : {
                              pathname: '/recipes/[slug]',
                              params: { slug: recipe.slug, origin: 'my-recipes' },
                            }
                      );
                    }}
                    style={[
                      styles.detailCard,
                      { backgroundColor: palette.surface, borderColor: palette.borderAlt },
                      selectionMode && selectedRecipeSlugs.includes(recipe.slug) && {
                        borderColor: palette.accent,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>{recipe.category}</Text>
                    <View style={styles.detailCardHeader}>
                      <View style={{ flex: 1, gap: 6 }}>
                        {selectionMode ? (
                          <Text style={[styles.detailCardMeta, { color: palette.accentText }]}>
                            {selectedRecipeSlugs.includes(recipe.slug) ? 'Selected' : 'Tap to select'}
                          </Text>
                        ) : null}
                        <Text style={[styles.detailCardTitle, { color: palette.text }]}>{recipe.title}</Text>
                      </View>
                      {selectionMode ? (
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation();
                            handleSelectionPress(
                              recipe.slug,
                              Boolean((event.nativeEvent as { shiftKey?: boolean }).shiftKey)
                            );
                          }}
                          style={[
                            styles.starButton,
                            { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
                            selectedRecipeSlugs.includes(recipe.slug) && {
                              backgroundColor: palette.accentSoft,
                              borderColor: palette.accentSoft,
                            },
                          ]}
                        >
                          <Text style={[styles.starButtonText, { color: palette.accentText }]}>
                            {selectedRecipeSlugs.includes(recipe.slug) ? '☑' : '☐'}
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Pressable
                            onPress={(event) => {
                              event.stopPropagation();
                              const lines: string[] = [`🍽️ ${recipe.title}`];
                              const ingredientLines = recipe.ingredients.flatMap((section) =>
                                section.title ? [section.title, ...section.items] : section.items
                              );
                              const directionLines = recipe.directions.flatMap((section) =>
                                section.title
                                  ? [section.title, ...section.items]
                                  : section.items
                              );
                              const notes =
                                'notes' in recipe && typeof recipe.notes === 'string' ? recipe.notes : null;
                              if (recipe.servings) lines.push(`Serves: ${recipe.servings}`);
                              if (recipe.prepTime) lines.push(`Prep: ${recipe.prepTime}`);
                              if (recipe.cookTime) lines.push(`Cook: ${recipe.cookTime}`);
                              if (ingredientLines.length > 0) {
                                lines.push('', 'Ingredients:', ...ingredientLines.map((item) => `• ${item}`));
                              }
                              if (directionLines.length > 0) {
                                lines.push(
                                  '',
                                  'Directions:',
                                  ...directionLines.map((item, idx) => `${idx + 1}. ${item}`)
                                );
                              }
                              if (notes) lines.push('', `Notes: ${notes}`);
                              Share.share({ title: recipe.title, message: lines.join('\n') });
                            }}
                            style={[styles.starButton, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}
                          >
                            <ShareIcon color={palette.accentText} />
                          </Pressable>
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
                      )}
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

          {isWide ? <View style={styles.secondaryColumn}>
            <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Recipe Stats</Text>
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
          </View> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
