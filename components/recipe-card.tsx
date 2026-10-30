import { useState } from 'react';
import { Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { Check, Clock, Star, Utensils } from 'lucide-react-native';

import { useAppSettings } from '../contexts/settings-context';
import type { DragRenderInfo } from './draggable-recipe-list';
import { kitchenStyles as styles } from './kitchen-styles';
import { OvenIcon } from './oven-icon';
import { ShareIcon } from './share-icon';
import { StarRating } from './star-rating';
import type { RecipeSection } from '../data/obsidian-recipes';
import { formatCategoryLabel } from '../utils/recipe-form-options';
import { resolveCookVerb } from '../utils/recipe-metadata';

export type RecipeCardRecipe = {
  slug: string;
  title: string;
  category: string;
  cuisineRegion?: string | null;
  allergyFriendlyTags: string[];
  allergenTags: string[];
  prepTime: string | null;
  cookTime: string | null;
  servings: string | null;
  directions: RecipeSection[];
};

type Props = {
  recipe: RecipeCardRecipe;
  rating: number;
  onRate: (value: number) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onTagPress?: (tag: string) => void;
  onCuisinePress?: (cuisine: string) => void;
  dragProps?: DragRenderInfo['dragProps'];
  selectionMode?: boolean;
  selected?: boolean;
  onSelectPress?: (event: GestureResponderEvent) => void;
};

/** "15 minutes" → "15 min"; "Serves 4" → "4". Keeps the strip compact. */
function shortTime(value: string) {
  return value.replace(/\bmins?\b\.?|\bminutes?\b/gi, 'min').replace(/\s+/g, ' ').trim();
}
function shortServings(value: string) {
  return value.replace(/^serves\s*:?\s*/i, '').trim();
}

const STRIP_SIDE_PADDING = 28; // metaStrip paddingHorizontal × 2
const STRIP_GAP = 12; // metaStripRow gap
const STRIP_DIVIDER = 13; // metaStripSegmentDivided: 1px border + 12px padding

/** Width of one row of segments, with dividers between them. */
function rowWidth(keys: string[], widths: Record<string, number>) {
  return (
    STRIP_SIDE_PADDING +
    keys.reduce((total, key) => total + (widths[key] ?? 0), 0) +
    (keys.length - 1) * (STRIP_GAP + STRIP_DIVIDER)
  );
}

/**
 * Rows for the Prep | Bake/Cook | Serves strip. One row when it all fits; otherwise Prep and Bake/Cook
 * stay together and Serves moves to its own row, flush left under the first segment; if even that
 * doesn't fit, one segment per row. Based on content widths only, so the layout can't flip back and forth.
 */
function chooseStripLayout(keys: string[], widths: Record<string, number>, available: number): string[][] {
  const measured = available > 0 && keys.every((key) => widths[key] !== undefined);
  if (!measured || rowWidth(keys, widths) <= available) return [keys];
  const times = keys.filter((key) => key !== 'serves');
  const rest = keys.filter((key) => key === 'serves');
  if (times.length > 1 && rowWidth(times, widths) <= available) return [times, ...rest.map((key) => [key])];
  return keys.map((key) => [key]);
}

/** Stops a chip or button tap from also opening the recipe. */
function stop(event: GestureResponderEvent, action: () => void) {
  event.stopPropagation();
  action();
}

/** Recipe list card used by My Recipes and Sample Recipes. */
export function RecipeCard({
  recipe,
  rating,
  onRate,
  isFavorite,
  onToggleFavorite,
  onShare,
  onTagPress,
  onCuisinePress,
  dragProps,
  selectionMode = false,
  selected = false,
  onSelectPress,
}: Props) {
  const { palette } = useAppSettings();
  // Natural widths of each strip segment's content, and the width the strip can use.
  const [contentWidths, setContentWidths] = useState<Record<string, number>>({});
  const [availableWidth, setAvailableWidth] = useState(0);
  const cookVerb = resolveCookVerb(recipe);
  const meta = [
    recipe.prepTime ? { key: 'prep', label: 'Prep', value: shortTime(recipe.prepTime), full: recipe.prepTime } : null,
    recipe.cookTime ? { key: 'cook', label: cookVerb, value: shortTime(recipe.cookTime), full: recipe.cookTime } : null,
    recipe.servings ? { key: 'serves', label: 'Serves', value: shortServings(recipe.servings), full: shortServings(recipe.servings) } : null,
  ].filter((item): item is { key: string; label: string; value: string; full: string } => item !== null);

  const metaIcon = (key: string, size = 22) =>
    key === 'prep' ? (
      <Clock size={size} color={palette.tagText} strokeWidth={2} />
    ) : key === 'cook' ? (
      <OvenIcon size={size} color={palette.tagText} />
    ) : (
      <Utensils size={size} color={palette.tagText} strokeWidth={2} />
    );

  const chip = (label: string, chipStyle: object, textStyle: object, onPress?: () => void) => (
    <Pressable
      key={label}
      disabled={!onPress || selectionMode}
      onPress={onPress ? (event) => stop(event, onPress) : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Filter by ${label}` : undefined}
      style={[chipStyle, styles.recipeCardChip]}
    >
      <Text style={[textStyle, styles.recipeCardChipText]}>{label}</Text>
    </Pressable>
  );

  const cuisine = recipe.cuisineRegion?.trim();

  return (
    <Pressable
      style={[
        styles.detailCard,
        styles.recipeCard,
        { backgroundColor: palette.surface, borderColor: palette.borderAlt },
        selectionMode && selected && { backgroundColor: palette.elevatedAlt, borderColor: palette.accent, borderWidth: 2 },
      ]}
      {...dragProps}
    >
      <View style={styles.recipeCardHeader}>
        <View style={styles.recipeCardHeading}>
          <Text style={[styles.recipeCardEyebrow, { color: palette.accentText }]}>
            {formatCategoryLabel(recipe.category)}
          </Text>
          <Text style={[styles.recipeCardTitle, { color: palette.text }]}>{recipe.title}</Text>
        </View>
        {selectionMode ? (
          <View style={styles.detailCardActionRow}>
            {isFavorite ? <Star size={18} color={palette.accent} fill={palette.accent} accessibilityLabel="Favorited" /> : null}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`Select ${recipe.title}`}
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation();
                onSelectPress?.(event);
              }}
              style={[
                styles.selectCheckCircle,
                selected
                  ? { backgroundColor: palette.accent, borderColor: palette.accent }
                  : { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
              ]}
            >
              {selected ? <Check size={16} strokeWidth={3} color={palette.accentContrastText} /> : null}
            </Pressable>
          </View>
        ) : null}
      </View>

      {cuisine || recipe.allergyFriendlyTags.length > 0 || recipe.allergenTags.length > 0 ? (
        <View style={styles.recipeCardChipRow}>
          {cuisine
            ? chip(cuisine, styles.cuisineTag, styles.cuisineTagText, onCuisinePress ? () => onCuisinePress(cuisine) : undefined)
            : null}
          {recipe.allergyFriendlyTags.map((tag) =>
            chip(tag, styles.allergyFriendlyTag, styles.allergyFriendlyTagText, onTagPress ? () => onTagPress(tag) : undefined)
          )}
          {recipe.allergenTags.map((tag) =>
            chip(tag, styles.allergenTag, styles.allergenTagText, onTagPress ? () => onTagPress(tag) : undefined)
          )}
        </View>
      ) : null}

      {meta.length === 1 ? (
        <View style={[styles.metaStrip, styles.metaStripSingle, { backgroundColor: palette.tag }]}>
          {metaIcon(meta[0].key, 20)}
          <Text style={[styles.metaStripSingleText, { color: palette.tagText }]}>
            {`${meta[0].label}: ${meta[0].full}`}
          </Text>
        </View>
      ) : meta.length > 1 ? (
        <View
          style={styles.metaStripWrapper}
          onLayout={(event) => {
            const width = Math.round(event.nativeEvent.layout.width);
            setAvailableWidth((current) => (current === width ? current : width));
          }}
        >
          {(() => {
            const layout = chooseStripLayout(meta.map((item) => item.key), contentWidths, availableWidth);
            const renderSegment = (key: string, divided: boolean) => {
              const item = meta.find((entry) => entry.key === key)!;
              return (
                <View
                  key={key}
                  style={[
                    styles.metaStripSegment,
                    divided && [styles.metaStripSegmentDivided, { borderLeftColor: palette.borderAlt }],
                  ]}
                  accessible
                  accessibilityLabel={`${item.label} ${item.full}`}
                >
                  <View
                    style={styles.metaStripContent}
                    onLayout={(event) => {
                      const width = Math.ceil(event.nativeEvent.layout.width);
                      setContentWidths((current) => (current[key] === width ? current : { ...current, [key]: width }));
                    }}
                  >
                    {metaIcon(item.key)}
                    <View>
                      <Text style={[styles.metaStripLabel, { color: palette.tagText }]}>{item.label}</Text>
                      <Text numberOfLines={1} style={[styles.metaStripValue, { color: palette.tagText }]}>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            };
            return (
              <View style={[styles.metaStrip, { backgroundColor: palette.tag }]}>
                {layout.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.metaStripRow}>
                    {row.map((key, index) => renderSegment(key, index > 0))}
                  </View>
                ))}
              </View>
            );
          })()}
        </View>
      ) : null}

      <View style={styles.recipeCardFooter}>
        <StarRating value={rating} onRate={onRate} size={26} />
        {selectionMode ? null : (
          <View style={styles.recipeCardFooterActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Share ${recipe.title}`}
              hitSlop={6}
              onPress={(event) => stop(event, onShare)}
              style={[styles.recipeCardRoundButton, { borderColor: palette.borderAlt, backgroundColor: palette.elevated }]}
            >
              <ShareIcon color={palette.accentText} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? `Remove ${recipe.title} from favorites` : `Add ${recipe.title} to favorites`}
              accessibilityState={{ selected: isFavorite }}
              hitSlop={6}
              onPress={(event) => stop(event, onToggleFavorite)}
              style={[styles.recipeCardRoundButton, { borderColor: palette.borderAlt, backgroundColor: palette.elevated }]}
            >
              <Star size={22} color={palette.accent} fill={isFavorite ? palette.accent : 'transparent'} strokeWidth={2} />
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}
