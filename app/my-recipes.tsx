import { useRouter } from 'expo-router';
import { Ellipsis, Share2, SquareCheck, Star, Tag, Trash2, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { kitchenStyles as styles } from '../components/kitchen-styles';
import { ClearableSearchInput } from '../components/clearable-search-input';
import { DraggableRecipeList } from '../components/draggable-recipe-list';
import { RecipeCard } from '../components/recipe-card';
import { NoticePieTimer } from '../components/notice-pie-timer';
import { FryingPanIcon } from '../components/recipe-action-icons';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useRecipeOrder } from '../contexts/recipe-order-context';
import { useAppSettings } from '../contexts/settings-context';
import { useFavorites } from '../contexts/favorites-context';
import { useRatings } from '../contexts/ratings-context';
import { ActiveFilterBar } from '../components/active-filter-bar';
import { useRecipeFilters } from '../contexts/recipe-filters-context';
import { useLibraryRecipes, type LibraryRecipe } from '../hooks/use-library-recipes';
import { useRecipeShare } from '../hooks/use-recipe-share';
import { allergenTagOptions, allergyFriendlyTagOptions } from '../utils/allergen-tags';
import { triggerReorderHaptic } from '../utils/haptics';
import { RECIPE_CATEGORY_VALUES, formatCategoryLabel } from '../utils/recipe-form-options';
import { applyRecipeFilters, toggleValue } from '../utils/recipe-filters';
import { reorderWithinFilteredView, sortByManualOrder } from '../utils/recipe-order';

const bulkCategoryOptions = ['Keep existing', ...RECIPE_CATEGORY_VALUES] as const;

export default function MyRecipesScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isWide = width >= 960;
  const { palette, reorderHapticsEnabled } = useAppSettings();
  const scrollOffsetRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const heroLayoutYRef = useRef(0);
  const heroCardLayoutYRef = useRef(0);
  const recipeListTopRef = useRef(0);
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { filters, setFilters, searchText, setSearchText } = useRecipeFilters('my-recipes');
  const [searchStickyThreshold, setSearchStickyThreshold] = useState<number | null>(null);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecipeSlugs, setSelectedRecipeSlugs] = useState<string[]>([]);
  const [selectionAnchorSlug, setSelectionAnchorSlug] = useState<string | null>(null);
  const [favoritedFeedbackCount, setFavoritedFeedbackCount] = useState<number | null>(null);
  const favoritedFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkMetadataEditor, setShowBulkMetadataEditor] = useState(false);
  const [showSelectionMoreMenu, setShowSelectionMoreMenu] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<(typeof bulkCategoryOptions)[number]>('Keep existing');
  const [bulkCuisineRegion, setBulkCuisineRegion] = useState('');
  const [bulkApplyCuisineRegion, setBulkApplyCuisineRegion] = useState(false);
  const [bulkAllergenTagsToAdd, setBulkAllergenTagsToAdd] = useState<string[]>([]);
  const [bulkFriendlyTagsToAdd, setBulkFriendlyTagsToAdd] = useState<string[]>([]);
  const [dismissProgress, setDismissProgress] = useState(0);
  const { shareOne, shareMany, sharingMany: sharingSelectedRecipes, hiddenShareCards } = useRecipeShare();
  const {
    bulkUpdateRecipeMetadata,
    clearDeletedRecipes,
    deleteRecipes,
    lastDeletedRecipes,
    restoreDeletedRecipes,
  } = useCustomRecipes();
  const { favoriteRecipes, favoriteSlugs, isFavorite, toggleFavorite } = useFavorites();
  const { getRating, setRating } = useRatings();
  const { applyOrder, getOrder } = useRecipeOrder();
  const allRecipes = useLibraryRecipes();
  const orderedRecipes = useMemo(
    () => sortByManualOrder(allRecipes, (recipe) => recipe.slug, getOrder('my-recipes')),
    [allRecipes, getOrder]
  );
  const recipeCategories = Object.entries(
    allRecipes.reduce<Record<string, number>>((groups, recipe) => {
      groups[recipe.category] = (groups[recipe.category] ?? 0) + 1;
      return groups;
    }, {})
  ).map(([name, count]) => ({ name, count }));
  const filteredRecipes = useMemo(
    () => applyRecipeFilters(orderedRecipes, filters, { favoriteSlugs, getRating, searchText }),
    [orderedRecipes, filters, favoriteSlugs, getRating, searchText]
  );
  const recipeBySlug = useMemo(
    () => new Map(allRecipes.map((recipe) => [recipe.slug, recipe])),
    [allRecipes]
  );

  function toggleCategoryFilter(tag: string) {
    setFilters((current) => ({
      ...current,
      categories: tag === 'All' ? [] : toggleValue(current.categories, tag),
    }));
  }

  function toggleCuisineFilter(tag: string) {
    setFilters((current) => ({ ...current, cuisines: toggleValue(current.cuisines, tag) }));
  }

  function toggleDietaryFilter(tag: string) {
    setFilters((current) => ({ ...current, dietaryTags: toggleValue(current.dietaryTags, tag) }));
  }

  function toggleSelectionMode() {
    setSelectionMode((current) => !current);
    setSelectedRecipeSlugs([]);
    setSelectionAnchorSlug(null);
    setShowBulkDeleteConfirm(false);
    setShowBulkMetadataEditor(false);
    setShowSelectionMoreMenu(false);
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
    setShowSelectionMoreMenu(false);
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

    const count = selectedRecipeSlugs.length;
    setFavoritedFeedbackCount(count);
    if (favoritedFeedbackTimeout.current) {
      clearTimeout(favoritedFeedbackTimeout.current);
    }
    favoritedFeedbackTimeout.current = setTimeout(() => setFavoritedFeedbackCount(null), 2000);
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

  async function handleShareSelectedRecipes() {
    await shareMany(
      selectedRecipeSlugs
        .map((slug) => recipeBySlug.get(slug))
        .filter((recipe): recipe is LibraryRecipe => Boolean(recipe))
    );
  }

  useEffect(() => {
    // Hide the "n favorited" confirmation as soon as the selection changes.
    setFavoritedFeedbackCount(null);
    if (selectedRecipeSlugs.length === 0) {
      // The toolbar hides at 0 selected, so close anything opened from it.
      setShowBulkDeleteConfirm(false);
      setShowBulkMetadataEditor(false);
      setShowSelectionMoreMenu(false);
    }
  }, [selectedRecipeSlugs]);

  useEffect(() => () => {
    if (favoritedFeedbackTimeout.current) {
      clearTimeout(favoritedFeedbackTimeout.current);
    }
  }, []);

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

  const allStatsActive = filters.categories.length === 0;
  const allStatsTextColor = allStatsActive ? palette.accentContrastText : palette.text;
  const allStatsBodyColor = allStatsActive ? palette.accentContrastText : palette.textMuted;
  const allStatsCountColor = allStatsActive ? palette.accentContrastText : '#000000';

  function updateStickySearch(offsetY: number, threshold = searchStickyThreshold) {
    if (threshold === null) {
      setShowStickySearch(false);
      return;
    }
    const shouldShow = offsetY >= threshold;
    setShowStickySearch((current) => (current === shouldShow ? current : shouldShow));
  }

  function updateFloatingActions(offsetY: number) {
    const listTop = recipeListTopRef.current;
    // Show once the first recipe scrolls into view (its top crosses ~120px above the bottom edge).
    const threshold = listTop + 120 - height;
    const shouldShow = listTop > 0 && offsetY >= threshold;
    setShowFloatingActions((current) => (current === shouldShow ? current : shouldShow));
  }

  function handleInlineSearchLayout(event: LayoutChangeEvent) {
    const threshold = heroLayoutYRef.current + heroCardLayoutYRef.current + event.nativeEvent.layout.y;
    setSearchStickyThreshold(threshold);
    updateStickySearch(scrollOffsetRef.current, threshold);
  }

  function renderSelectButton() {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select recipes"
        onPress={toggleSelectionMode}
        style={[styles.selectButton, { backgroundColor: palette.accent, borderColor: palette.accentSoft }]}
      >
        <SquareCheck size={18} color={palette.accentContrastText} />
        <Text style={[styles.selectButtonText, { color: palette.accentContrastText }]}>Select</Text>
      </Pressable>
    );
  }

  // Search box (plus Select when sticky), or the "N selected" header while selecting.
  function renderSearchRow(variant: 'inline' | 'sticky') {
    const onLayout = variant === 'inline' ? handleInlineSearchLayout : undefined;

    if (selectionMode) {
      return (
        <View
          onLayout={onLayout}
          style={[
            styles.selectionHeader,
            variant === 'sticky' && styles.referenceStickySearchInput,
            { backgroundColor: palette.accent, borderColor: palette.accent },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit selection"
            onPress={toggleSelectionMode}
            hitSlop={8}
          >
            <X size={22} color={palette.accentContrastText} />
          </Pressable>
          <Text style={[styles.selectionHeaderTitle, { color: palette.accentContrastText }]}>
            {favoritedFeedbackCount !== null
              ? `${favoritedFeedbackCount} favorited`
              : `${selectedRecipeSlugs.length} selected`}
          </Text>
          <Pressable accessibilityRole="button" onPress={selectAllVisibleRecipes} hitSlop={8}>
            <Text style={[styles.selectionHeaderLink, { color: palette.accentContrastText }]}>Select All</Text>
          </Pressable>
        </View>
      );
    }

    const searchInput = (
      <ClearableSearchInput
        value={searchText}
        onChangeText={setSearchText}
        placeholder={isWide ? "Search recipes, categories, or tags" : "Search recipes…"}
        placeholderTextColor={palette.searchPlaceholder}
        clearTintColor={palette.searchPlaceholder}
        onLayout={onLayout}
        style={[
          styles.searchInput,
          variant === 'sticky' && styles.referenceStickySearchInput,
          variant === 'sticky' && styles.searchRowInput,
          { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
        ]}
        inputStyle={{ color: palette.text }}
      />
    );

    if (variant === 'inline') {
      return searchInput;
    }

    return (
      <View style={styles.searchRow}>
        {searchInput}
        {renderSelectButton()}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      {hiddenShareCards}
      <ScrollView
        ref={scrollViewRef}
        scrollEnabled={!isDragging}
        contentContainerStyle={[styles.page, selectionMode && styles.pageWithSelectionBar]}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          scrollOffsetRef.current = offsetY;
          updateStickySearch(offsetY);
          updateFloatingActions(offsetY);
        }}
        scrollEventThrottle={16}
      >
        <View
          onLayout={(event) => {
            heroLayoutYRef.current = event.nativeEvent.layout.y;
          }}
          style={[
            styles.hero,
            isWide && styles.heroWide,
            { backgroundColor: palette.surface, borderColor: palette.borderAlt },
          ]}
        >
          <View style={styles.heroCopy}>
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

          </View>

          <View
            onLayout={(event) => {
              heroCardLayoutYRef.current = event.nativeEvent.layout.y;
            }}
            style={[
              styles.heroCard,
              !isWide && styles.recipeFilterCardMobile,
              { backgroundColor: palette.elevatedDark },
            ]}
          >
            <Text style={[styles.heroCardTitle, { color: palette.inverseText }]}>{filteredRecipes.length} recipes shown</Text>

            {renderSearchRow('inline')}

            <ActiveFilterBar
              scope="my-recipes"
              palette={palette}
              besideFilters={selectionMode ? null : renderSelectButton()}
            />
          </View>
        </View>

        <View
          onLayout={(event) => {
            recipeListTopRef.current = event.nativeEvent.layout.y;
            updateFloatingActions(scrollOffsetRef.current);
          }}
          style={[styles.contentGrid, isWide && styles.contentGridWide]}
        >
          <View style={styles.primaryColumn}>
            <View style={[styles.panel, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
              <DraggableRecipeList
                data={filteredRecipes}
                keyExtractor={(recipe) => recipe.slug}
                enabled={!selectionMode}
                onPickup={() => triggerReorderHaptic(reorderHapticsEnabled)}
                onDragStateChange={setIsDragging}
                scrollRef={scrollViewRef}
                scrollOffsetRef={scrollOffsetRef}
                containerStyle={{ marginTop: 4 }}
                onReorder={(from, to) =>
                  applyOrder(
                    'my-recipes',
                    reorderWithinFilteredView(
                      orderedRecipes.map((recipe) => recipe.slug),
                      filteredRecipes.map((recipe) => recipe.slug),
                      from,
                      to
                    )
                  )
                }
                onItemPress={(recipe, _index, event) => {
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
                renderItem={(recipe, _index, { dragProps }) => (
                  <RecipeCard
                    recipe={recipe}
                    rating={getRating(recipe.slug)}
                    onRate={(next) => setRating(recipe.slug, next)}
                    isFavorite={isFavorite(recipe.slug)}
                    onToggleFavorite={() => toggleFavorite(recipe.slug)}
                    onShare={() => void shareOne(recipe)}
                    onTagPress={toggleDietaryFilter}
                    onCuisinePress={toggleCuisineFilter}
                    dragProps={dragProps}
                    selectionMode={selectionMode}
                    selected={selectedRecipeSlugs.includes(recipe.slug)}
                    onSelectPress={(event) =>
                      handleSelectionPress(recipe.slug, Boolean((event.nativeEvent as { shiftKey?: boolean }).shiftKey))
                    }
                  />
                )}
              />
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

          {isWide ? <View style={styles.secondaryColumn}>
            <View style={[styles.panelAlt, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
              <Text style={[styles.panelTitle, { color: palette.text }]}>Recipe Stats</Text>
              <View style={styles.listStack}>
                {recipeCategories.map((category) => {
                  const isActive = filters.categories.includes(category.name);
                  const statTextColor = isActive ? palette.accentContrastText : palette.text;
                  const statBodyColor = isActive ? palette.accentContrastText : palette.textMuted;
                  const statCountColor = isActive ? palette.accentContrastText : '#000000';

                  return (
                    <Pressable
                      key={category.name}
                      onPress={() => toggleCategoryFilter(category.name)}
                      style={[
                        styles.detailCard,
                        {
                          backgroundColor: isActive ? palette.accent : palette.surface,
                          borderColor: isActive ? palette.accent : palette.borderAlt,
                        },
                      ]}
                    >
                      <Text style={[styles.detailCardTitle, { color: statTextColor }]}>{category.name}</Text>
                      <Text style={[styles.infoCardMeta, { color: statCountColor }]}>{category.count} recipes</Text>
                      <Text style={[styles.detailCardBody, { color: statBodyColor }]}>
                        {isActive ? 'Current filter' : 'Click to filter'}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => toggleCategoryFilter('All')}
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: allStatsActive ? palette.accent : palette.surface,
                      borderColor: allStatsActive ? palette.accent : palette.borderAlt,
                    },
                  ]}
                >
                  <Text style={[styles.detailCardTitle, { color: allStatsTextColor }]}>All recipes</Text>
                  <Text style={[styles.infoCardMeta, { color: allStatsCountColor }]}>{allRecipes.length} recipes</Text>
                  <Text style={[styles.detailCardBody, { color: allStatsBodyColor }]}>
                    {allStatsActive ? 'Current filter' : 'Click to clear filters'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View> : null}
        </View>
      </ScrollView>
      {showStickySearch ? (
        <View
          style={[
            styles.referenceStickySearch,
            isWide && styles.referenceStickySearchWide,
            { backgroundColor: palette.background, borderColor: palette.borderAlt },
          ]}
        >
          {renderSearchRow('sticky')}
        </View>
      ) : null}
      {selectionMode && selectedRecipeSlugs.length > 0 ? (
        <View style={styles.selectionDock} pointerEvents="box-none">
          {showBulkMetadataEditor || showBulkDeleteConfirm ? (
            <View
              style={[
                styles.selectionSheet,
                { maxHeight: height * 0.55, backgroundColor: palette.surface, borderColor: palette.borderAlt },
              ]}
            >
              <ScrollView
                style={styles.selectionSheetScroll}
                contentContainerStyle={styles.selectionSheetContent}
                keyboardShouldPersistTaps="handled"
              >
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
                                {formatCategoryLabel(option)}
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
                                isActive && styles.selectableAllergyFriendlyTag,
                                isActive && { borderColor: '#97bf72' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.servingsButtonText,
                                  { color: palette.text },
                                  isActive && styles.selectableAllergyFriendlyTagText,
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
                                isActive && styles.selectableAllergenTag,
                                isActive && { borderColor: '#e98d34' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.servingsButtonText,
                                  { color: palette.text },
                                  isActive && styles.selectableAllergenTagText,
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
              </ScrollView>
            </View>
          ) : null}
          {showSelectionMoreMenu ? (
            <View
              style={[
                styles.selectionMoreMenu,
                { backgroundColor: palette.surface, borderColor: palette.borderAlt },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: showBulkMetadataEditor }}
                onPress={() => {
                  setShowSelectionMoreMenu(false);
                  setShowBulkDeleteConfirm(false);
                  setShowBulkMetadataEditor((current) => !current);
                }}
                style={styles.selectionMoreMenuItem}
              >
                <Tag size={18} color={palette.accentText} />
                <Text style={[styles.selectionMoreMenuText, { color: palette.text }]}>Add Tag</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={clearSelectedRecipes} style={styles.selectionMoreMenuItem}>
                <X size={18} color={palette.accentText} />
                <Text style={[styles.selectionMoreMenuText, { color: palette.text }]}>Clear selection</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={[styles.selectionToolbar, { backgroundColor: palette.accent }]}>
            <View style={styles.selectionToolbarCount}>
              <Text style={[styles.selectionToolbarCountNumber, { color: palette.accentContrastText }]}>
                {selectedRecipeSlugs.length}
              </Text>
              <Text style={[styles.selectionToolbarLabel, { color: palette.accentContrastText }]}>selected</Text>
            </View>
            {[
              {
                key: 'share',
                label: sharingSelectedRecipes ? 'Sharing' : 'Share',
                Icon: Share2,
                active: false,
                dimmed: sharingSelectedRecipes,
                onPress: () => {
                  setShowSelectionMoreMenu(false);
                  void handleShareSelectedRecipes();
                },
              },
              {
                key: 'favorite',
                label: 'Favorite',
                Icon: Star,
                active: false,
                dimmed: false,
                onPress: () => {
                  setShowSelectionMoreMenu(false);
                  handleFavoriteSelected();
                },
              },
              {
                key: 'delete',
                label: 'Delete',
                Icon: Trash2,
                active: showBulkDeleteConfirm,
                dimmed: false,
                onPress: () => {
                  setShowSelectionMoreMenu(false);
                  setShowBulkMetadataEditor(false);
                  if (showBulkDeleteConfirm) {
                    setShowBulkDeleteConfirm(false);
                  } else {
                    handleBulkDeletePress();
                  }
                },
              },
              {
                key: 'more',
                label: 'More',
                Icon: Ellipsis,
                active: showSelectionMoreMenu,
                dimmed: false,
                onPress: () => setShowSelectionMoreMenu((current) => !current),
              },
            ].map(({ key, label, Icon, active, dimmed, onPress }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === 'delete' ? `Delete ${selectedRecipeSlugs.length} selected` : label}
                accessibilityState={{ selected: active }}
                onPress={onPress}
                style={[
                  styles.selectionToolbarButton,
                  // 15% tint of the contrast colour marks the open panel.
                  active && { backgroundColor: `${palette.accentContrastText}26` },
                  dimmed && { opacity: 0.5 },
                ]}
              >
                <Icon size={20} color={palette.accentContrastText} />
                <Text style={[styles.selectionToolbarLabel, { color: palette.accentContrastText }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {showFloatingActions && !selectionMode ? (
      <View style={styles.floatingActionStack} pointerEvents="box-none">
        <Pressable
          accessibilityLabel="Add recipe"
          onPress={() => router.push('/add-recipe')}
          style={[
            styles.floatingActionButton,
            { backgroundColor: palette.addButtonBg, borderColor: palette.addButtonBorder },
          ]}
        >
          <View style={styles.mobileRecipePanIconWrap}>
            <FryingPanIcon size={30} palette={palette} />
            <View
              style={[
                styles.mobileRecipeActionPlusBadge,
                { backgroundColor: palette.addButtonBg, borderColor: palette.addButtonBorder },
              ]}
            >
              <Text style={[styles.mobileRecipeActionPlusText, { color: palette.addButtonText }]}>+</Text>
            </View>
          </View>
        </Pressable>
      </View>
      ) : null}
    </SafeAreaView>
  );
}
