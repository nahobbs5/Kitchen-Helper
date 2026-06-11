import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { MAX_RATING } from '../contexts/ratings-context';

type Props = {
  value: number;
  onRate?: (next: number) => void;
  color?: string;
  emptyColor?: string;
  size?: number;
};

const FILLED = '★';
const EMPTY = '☆';

export function StarRating({ value, onRate, color = '#f0a500', emptyColor = '#c9bca6', size = 22 }: Props) {
  const stars = Array.from({ length: MAX_RATING }, (_, index) => index + 1);
  const readOnly = !onRate;

  return (
    <View
      accessibilityRole={readOnly ? 'image' : 'adjustable'}
      accessibilityLabel={`Rating: ${value} of ${MAX_RATING} stars`}
      style={styles.row}
    >
      {stars.map((star) => {
        const filled = star <= value;
        const glyph = (
          <Text style={[styles.star, { color: filled ? color : emptyColor, fontSize: size }]}>
            {filled ? FILLED : EMPTY}
          </Text>
        );

        if (readOnly) {
          return (
            <View key={star} style={styles.starWrap}>
              {glyph}
            </View>
          );
        }

        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} star${star === 1 ? '' : 's'}`}
            hitSlop={6}
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              onRate(star === value ? 0 : star);
            }}
            style={styles.starWrap}
          >
            {glyph}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  starWrap: {
    paddingHorizontal: 1,
  },
  star: {
    fontWeight: '600',
  },
});
