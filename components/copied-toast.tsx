import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** Green checkmark used by the "copied" confirmation pill. */
export function CopiedCheckmarkIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#34C759"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Manages the fade in/out lifecycle for a brief confirmation toast.
 * Call `show()` to flash it; render <CopiedToast visible opacity /> in the tree.
 */
export function useCopiedToast(duration = 1500) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    setVisible(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setVisible(false);
        }
      });
    }, duration);
  }, [duration, opacity]);

  useEffect(
    () => () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    },
    [],
  );

  return { show, visible, opacity };
}

export function CopiedToast({
  visible,
  opacity,
  message = 'Copied to clipboard',
}: {
  visible: boolean;
  opacity: Animated.Value;
  message?: string;
}) {
  if (!visible) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { opacity }]}>
      <View style={styles.pill}>
        <CopiedCheckmarkIcon />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    bottom: 48,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(28,28,30,0.94)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
