import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { kitchenStyles as styles } from './kitchen-styles';
import type { AppPalette } from './app-theme';

export type RatingThreshold = 3 | 4 | 5;

export const RATING_THRESHOLDS: RatingThreshold[] = [3, 4, 5];

type Props = {
  active: boolean;
  threshold: RatingThreshold;
  dropdownOpen: boolean;
  onToggleActive: () => void;
  onToggleDropdown: () => void;
  onSelectThreshold: (threshold: RatingThreshold) => void;
  palette: AppPalette;
  isWide: boolean;
};

const STAR = '★';

// Star layout per threshold: 3 → triangle (1 over 2), 4 → square (2 over 2),
// 5 → Olympic rings (3 over 2). Thresholds 3 and 4 mean "and up" (show a +).
const PATTERN_ROWS: Record<RatingThreshold, number[]> = {
  3: [1, 2],
  4: [2, 2],
  5: [3, 2],
};

function StarPattern({ threshold, color, starSize = 8 }: { threshold: RatingThreshold; color: string; starSize?: number }) {
  return (
    <View style={patternStyles.column}>
      {PATTERN_ROWS[threshold].map((count, rowIndex) => (
        <View key={rowIndex} style={patternStyles.row}>
          {Array.from({ length: count }, (_, starIndex) => (
            <Text key={starIndex} style={[patternStyles.star, { color, fontSize: starSize, lineHeight: starSize + 1 }]}>
              {STAR}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function RatingFilterChip({
  active,
  threshold,
  dropdownOpen,
  onToggleActive,
  onToggleDropdown,
  onSelectThreshold,
  palette,
  isWide,
}: Props) {
  const contentColor = active ? palette.inverseText : palette.text;
  const showPlus = threshold !== 5;

  return (
    <View style={patternStyles.anchor}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Filter by rating ${threshold}${showPlus ? ' or higher' : ' stars only'}${active ? ', active' : ''}`}
        onPress={onToggleActive}
        style={[
          styles.servingsButton,
          !isWide && styles.recipeFilterButtonMobile,
          patternStyles.chip,
          { borderColor: palette.borderAlt },
          !active && { backgroundColor: palette.surface },
          active && styles.servingsButtonActive,
          active && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
        ]}
      >
        <View style={patternStyles.starGroup}>
          <StarPattern threshold={threshold} color={contentColor} />
          {showPlus ? (
            <Text style={[patternStyles.plus, { color: contentColor }]}>+</Text>
          ) : null}
        </View>
        <View style={[patternStyles.divider, { backgroundColor: palette.borderAlt }]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change rating threshold"
          hitSlop={8}
          onPress={(event: GestureResponderEvent) => {
            event.stopPropagation();
            onToggleDropdown();
          }}
          style={patternStyles.caretButton}
        >
          <Text style={[patternStyles.caret, { color: contentColor }]}>{dropdownOpen ? '⌃' : '⌄'}</Text>
        </Pressable>
      </Pressable>

      {dropdownOpen ? (
        <View
          style={[
            patternStyles.menu,
            { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
          ]}
        >
          {RATING_THRESHOLDS.map((option) => {
            const isSelected = option === threshold && active;
            const optionPlus = option !== 5;

            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`Rated ${option}${optionPlus ? ' or higher' : ' stars only'}`}
                onPress={() => onSelectThreshold(option)}
                style={[
                  patternStyles.option,
                  { backgroundColor: isSelected ? palette.accentSoft : palette.elevated },
                ]}
              >
                <StarPattern
                  threshold={option}
                  color={isSelected ? palette.accentContrastText : palette.text}
                  starSize={9}
                />
                <Text
                  style={[
                    patternStyles.optionLabel,
                    { color: isSelected ? palette.accentContrastText : palette.text },
                  ]}
                >
                  {option}
                  {optionPlus ? '+' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const patternStyles = StyleSheet.create({
  anchor: {
    position: 'relative',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontWeight: '600',
  },
  plus: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: -1,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: 2,
  },
  caretButton: {
    paddingLeft: 2,
  },
  caret: {
    fontSize: 14,
    fontWeight: '800',
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 6,
    minWidth: 96,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
});
