import { StyleSheet, Text, View } from 'react-native';

import type { RatingThreshold } from '../utils/recipe-filters';

const STAR = '★';

// Star layout per threshold: 3 → triangle (1 over 2), 4 → square (2 over 2),
// 5 → Olympic rings (3 over 2).
const PATTERN_ROWS: Record<RatingThreshold, number[]> = {
  3: [1, 2],
  4: [2, 2],
  5: [3, 2],
};

export function StarPattern({
  threshold,
  color,
  starSize = 8,
}: {
  threshold: RatingThreshold;
  color: string;
  starSize?: number;
}) {
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

const patternStyles = StyleSheet.create({
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
});
