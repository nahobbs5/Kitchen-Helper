import { useLocalSearchParams, useRouter } from 'expo-router';
import { Globe, type LucideIcon } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { AppPalette } from '../components/app-theme';
import { getCategoryIcon, getDietaryIcon, shortCategoryLabel } from '../components/filter-icons';
import { StarPattern } from '../components/star-pattern';
import { useCustomRecipes } from '../contexts/custom-recipes-context';
import { useFavorites } from '../contexts/favorites-context';
import { useRatings } from '../contexts/ratings-context';
import { useRecipeFilters } from '../contexts/recipe-filters-context';
import { useAppSettings } from '../contexts/settings-context';
import { useLibraryRecipes } from '../hooks/use-library-recipes';
import {
  applyRecipeFilters,
  buildFilterOptions,
  emptyRecipeFilters,
  FAVORITES_FILTER,
  formatRatingLabel,
  RATING_THRESHOLDS,
  toggleValue,
  type FilterableRecipe,
  type RecipeFilterScope,
  type RecipeFilterState,
} from '../utils/recipe-filters';
import { buildSampleRecipes } from '../utils/sample-recipes';

export default function FiltersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope: RecipeFilterScope = params.scope === 'sample-recipes' ? 'sample-recipes' : 'my-recipes';
  const { width } = useWindowDimensions();
  const { palette } = useAppSettings();
  const { filters, setFilters, searchText } = useRecipeFilters(scope);
  const { favoriteSlugs } = useFavorites();
  const { getRating } = useRatings();
  const { recipeOverrideMap } = useCustomRecipes();
  const libraryRecipes = useLibraryRecipes();
  const recipes: FilterableRecipe[] = useMemo(
    () => (scope === 'sample-recipes' ? buildSampleRecipes(recipeOverrideMap) : libraryRecipes),
    [scope, recipeOverrideMap, libraryRecipes]
  );
  const options = useMemo(() => buildFilterOptions(recipes), [recipes]);

  // Changes stay in this draft until "Show N recipes" is pressed; leaving the page discards them.
  const [draft, setDraft] = useState<RecipeFilterState>(filters);

  const matchCount = useMemo(
    () => applyRecipeFilters(recipes, draft, { favoriteSlugs, getRating, searchText }).length,
    [recipes, draft, favoriteSlugs, getRating, searchText]
  );

  const columns = width >= 700 ? 4 : 3;
  const categoryNames = [
    ...(scope === 'my-recipes' ? [FAVORITES_FILTER] : []),
    ...options.categories.map((category) => category.name),
  ];

  function applyAndClose() {
    setFilters(draft);
    router.back();
  }

  return (
    <SafeAreaView style={[local.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={local.page}>
        <View style={local.headerRow}>
          <Text style={[local.title, { color: palette.text }]}>Filters</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDraft((current) => ({ ...emptyRecipeFilters, ratingThreshold: current.ratingThreshold }))}
            hitSlop={8}
          >
            <Text style={[local.clearLink, { color: palette.accentText }]}>Clear all</Text>
          </Pressable>
        </View>

        {categoryNames.length > 0 ? (
          <FilterSection title="Categories" palette={palette}>
            <TileGrid columns={columns}>
              {categoryNames.map((name) => (
                <FilterTile
                  key={name}
                  label={shortCategoryLabel(name)}
                  accessibilityLabel={name}
                  Icon={getCategoryIcon(name)}
                  active={draft.categories.includes(name)}
                  onPress={() => setDraft((current) => ({ ...current, categories: toggleValue(current.categories, name) }))}
                  palette={palette}
                />
              ))}
            </TileGrid>
          </FilterSection>
        ) : null}

        <FilterSection title="Rating" palette={palette}>
          <TileGrid columns={columns}>
            {RATING_THRESHOLDS.map((threshold) => {
              const active = draft.ratingActive && draft.ratingThreshold === threshold;

              return (
                <FilterTile
                  key={threshold}
                  label={formatRatingLabel(threshold)}
                  icon={
                    <StarPattern
                      threshold={threshold}
                      color={active ? palette.accentContrastText : palette.accentText}
                      starSize={10}
                    />
                  }
                  active={active}
                  onPress={() =>
                    setDraft((current) =>
                      active
                        ? { ...current, ratingActive: false }
                        : { ...current, ratingActive: true, ratingThreshold: threshold }
                    )
                  }
                  palette={palette}
                />
              );
            })}
          </TileGrid>
        </FilterSection>

        {options.cuisines.length > 0 ? (
          <FilterSection title="Cuisine region" palette={palette}>
            <View style={local.pillRow}>
              {options.cuisines.map((cuisine) => {
                const active = draft.cuisines.includes(cuisine.name);
                const color = active ? palette.accentContrastText : palette.text;

                return (
                  <Pressable
                    key={cuisine.name}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() =>
                      setDraft((current) => ({ ...current, cuisines: toggleValue(current.cuisines, cuisine.name) }))
                    }
                    style={[
                      local.pill,
                      active
                        ? { backgroundColor: palette.accent, borderColor: palette.accent }
                        : { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
                    ]}
                  >
                    <Globe size={16} color={active ? palette.accentContrastText : palette.accentText} />
                    <Text style={[local.pillText, { color }]}>{cuisine.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </FilterSection>
        ) : null}

        {options.dietaryFree.length > 0 ? (
          <FilterSection title="Dietary needs" palette={palette}>
            <TileGrid columns={columns}>
              {options.dietaryFree.map((tag) => (
                <FilterTile
                  key={tag.name}
                  label={tag.name}
                  Icon={getDietaryIcon(tag.name)}
                  active={draft.dietaryTags.includes(tag.name)}
                  onPress={() =>
                    setDraft((current) => ({ ...current, dietaryTags: toggleValue(current.dietaryTags, tag.name) }))
                  }
                  palette={palette}
                />
              ))}
            </TileGrid>
          </FilterSection>
        ) : null}

        {options.dietaryContains.length > 0 ? (
          <FilterSection title="Contains" palette={palette}>
            <TileGrid columns={columns}>
              {options.dietaryContains.map((tag) => (
                <FilterTile
                  key={tag.name}
                  label={tag.name.replace(/^Contains\s+/i, '')}
                  accessibilityLabel={tag.name}
                  Icon={getDietaryIcon(tag.name)}
                  active={draft.dietaryTags.includes(tag.name)}
                  onPress={() =>
                    setDraft((current) => ({ ...current, dietaryTags: toggleValue(current.dietaryTags, tag.name) }))
                  }
                  palette={palette}
                  compact
                />
              ))}
            </TileGrid>
          </FilterSection>
        ) : null}
      </ScrollView>

      <View style={[local.footer, { backgroundColor: palette.background, borderColor: palette.borderAlt }]}>
        <Pressable
          accessibilityRole="button"
          onPress={applyAndClose}
          style={[local.applyButton, { backgroundColor: palette.accent }]}
        >
          <Text style={[local.applyButtonText, { color: palette.accentContrastText }]}>
            Show {matchCount} {matchCount === 1 ? 'recipe' : 'recipes'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function FilterSection({ title, palette, children }: { title: string; palette: AppPalette; children: ReactNode }) {
  return (
    <View style={local.section}>
      <Text style={[local.sectionTitle, { color: palette.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function TileGrid({ columns, children }: { columns: number; children: ReactNode }) {
  // Every tile gets the same width so a short last row doesn't stretch.
  const basis = `${100 / columns - 2.5}%` as const;
  const items = Array.isArray(children) ? children : [children];

  return (
    <View style={local.grid}>
      {items.map((child, index) => (
        <View key={index} style={{ flexGrow: 0, flexShrink: 0, width: basis }}>
          {child}
        </View>
      ))}
    </View>
  );
}

type FilterTileProps = {
  label: string;
  accessibilityLabel?: string;
  Icon?: LucideIcon;
  icon?: ReactNode;
  active: boolean;
  onPress: () => void;
  palette: AppPalette;
  compact?: boolean;
};

function FilterTile({ label, accessibilityLabel, Icon, icon, active, onPress, palette, compact }: FilterTileProps) {
  const contentColor = active ? palette.accentContrastText : palette.text;
  const iconColor = active ? palette.accentContrastText : palette.accentText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        local.tile,
        compact && local.tileCompact,
        active
          ? { backgroundColor: palette.accent, borderColor: palette.accent }
          : { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
      ]}
    >
      {Icon ? <Icon size={compact ? 20 : 26} color={iconColor} strokeWidth={1.8} /> : icon}
      <Text numberOfLines={2} style={[local.tileLabel, { color: contentColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const local = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  page: {
    alignSelf: 'center',
    maxWidth: 760,
    paddingBottom: 120,
    paddingHorizontal: 18,
    paddingTop: 18,
    width: '100%',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  clearLink: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  section: {
    gap: 10,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  grid: {
    columnGap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  tile: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    justifyContent: 'center',
    minHeight: 82,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  tileCompact: {
    minHeight: 64,
    paddingVertical: 8,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
  },
  applyButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    maxWidth: 724,
    paddingVertical: 15,
    width: '100%',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
