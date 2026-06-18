import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import type { AppPalette } from './app-theme';

type Props = {
  palette: AppPalette;
  accessibilityLabel?: string;
};

// Width of the moving highlight as a fraction of the track.
const SEGMENT_FRACTION = 0.35;
const CYCLE_MS = 1100;

// Indeterminate progress bar: a highlight segment loops left-to-right to signal
// that a long-running operation (PDF export, OCR, AI/website import) is working.
// It does not represent measured progress.
export function ProgressBar({ palette, accessibilityLabel }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: CYCLE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    animation.start();

    return () => {
      animation.stop();
      progress.setValue(0);
    };
  }, [progress]);

  const segmentWidth = trackWidth * SEGMENT_FRACTION;
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-segmentWidth, trackWidth],
  });

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleLayout}
      style={[styles.track, { backgroundColor: palette.borderAlt }]}
    >
      {trackWidth > 0 ? (
        <Animated.View
          style={[
            styles.segment,
            { width: segmentWidth, backgroundColor: palette.accent, transform: [{ translateX }] },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
    borderRadius: 999,
  },
});
