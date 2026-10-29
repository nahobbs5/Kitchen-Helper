import { useRouter } from 'expo-router';
import { Globe, SlidersHorizontal, Star, X, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppPalette } from './app-theme';
import { getCategoryIcon, getDietaryIcon } from './filter-icons';
import { useRecipeFilters } from '../contexts/recipe-filters-context';
import {
  countActiveFilters,
  formatRatingLabel,
  type RecipeFilterKind,
  type RecipeFilterScope,
} from '../utils/recipe-filters';

type Chip = { kind: RecipeFilterKind; value?: string; label: string; Icon: LucideIcon };

// Sits under the search box: a Filters button that opens the Filters page, plus removable chips.
// `besideFilters` renders next to the Filters button (e.g. a Select button).
export function ActiveFilterBar({
  scope,
  palette,
  besideFilters,
}: {
  scope: RecipeFilterScope;
  palette: AppPalette;
  besideFilters?: ReactNode;
}) {
  const router = useRouter();
  const { filters, removeFilter, clearAll } = useRecipeFilters(scope);
  const activeCount = countActiveFilters(filters);

  const chips: Chip[] = [
    ...filters.categories.map((value) => ({
      kind: 'category' as const,
      value,
      label: value,
      Icon: getCategoryIcon(value),
    })),
    ...(filters.ratingActive
      ? [{ kind: 'rating' as const, label: formatRatingLabel(filters.ratingThreshold), Icon: Star }]
      : []),
    ...filters.cuisines.map((value) => ({ kind: 'cuisine' as const, value, label: value, Icon: Globe })),
    ...filters.dietaryTags.map((value) => ({
      kind: 'dietary' as const,
      value,
      label: value,
      Icon: getDietaryIcon(value),
    })),
  ];

  return (
    <View style={barStyles.wrapper}>
      <View style={barStyles.topRow}>
        <View style={barStyles.leftGroup}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters'}
          onPress={() => router.push({ pathname: '/filters', params: { scope } })}
          style={[barStyles.filterButton, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
        >
          <SlidersHorizontal size={18} color={palette.accentText} />
          <Text style={[barStyles.filterButtonText, { color: palette.text }]}>Filters</Text>
          {activeCount > 0 ? (
            <View style={[barStyles.countBadge, { backgroundColor: palette.accent }]}>
              <Text style={[barStyles.countBadgeText, { color: palette.accentContrastText }]}>{activeCount}</Text>
            </View>
          ) : null}
        </Pressable>
        {besideFilters}
        </View>
        {activeCount > 0 ? (
          <Pressable accessibilityRole="button" onPress={clearAll} hitSlop={8}>
            <Text style={[barStyles.clearLink, { color: palette.inverseMuted }]}>Clear all</Text>
          </Pressable>
        ) : null}
      </View>

      {chips.length > 0 ? (
        <View style={barStyles.chipRow}>
          {chips.map((chip) => (
            <Pressable
              key={`${chip.kind}-${chip.value ?? ''}`}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${chip.label} filter`}
              onPress={() => removeFilter(chip.kind, chip.value)}
              style={[barStyles.chip, { backgroundColor: palette.tag }]}
            >
              <chip.Icon size={14} color={palette.tagText} />
              <Text style={[barStyles.chipText, { color: palette.tagText }]}>{chip.label}</Text>
              <X size={14} color={palette.tagText} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrapper: {
    gap: 10,
    marginTop: 12,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  countBadge: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  clearLink: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
