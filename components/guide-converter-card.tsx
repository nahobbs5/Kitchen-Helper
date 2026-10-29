import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowLeftRight } from 'lucide-react-native';

import { useAppSettings } from '../contexts/settings-context';
import { kitchenStyles as styles } from './kitchen-styles';

type GuideConverterCardProps = {
  fromLabel: string;
  fromValue: string;
  toLabel: string;
  toValue: string;
  /** Slider, range labels and preset chips. */
  children?: ReactNode;
};

/** Two-sided converter readout. The swap button only flips which unit is shown on the left. */
export function GuideConverterCard({ fromLabel, fromValue, toLabel, toValue, children }: GuideConverterCardProps) {
  const { palette } = useAppSettings();
  const [swapped, setSwapped] = useState(false);

  const left = swapped ? { label: toLabel, value: toValue } : { label: fromLabel, value: fromValue };
  const right = swapped ? { label: fromLabel, value: fromValue } : { label: toLabel, value: toValue };

  return (
    <View style={[styles.ovenConverterCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
      <View style={styles.guideConverterValueRow}>
        <View style={styles.guideConverterValueBlock}>
          <Text style={[styles.guideConverterLabel, { color: palette.accentText }]}>{left.label}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.guideConverterValue, { color: palette.text }]}>
            {left.value}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Swap ${fromLabel} and ${toLabel}`}
          hitSlop={8}
          onPress={() => setSwapped((current) => !current)}
          style={[styles.guideSwapButton, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}
        >
          <ArrowLeftRight size={18} color={palette.accent} strokeWidth={2.2} />
        </Pressable>
        <View style={[styles.guideConverterValueBlock, styles.guideConverterValueBlockEnd]}>
          <Text style={[styles.guideConverterLabel, { color: palette.accentText }]}>{right.label}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.guideConverterValue, { color: palette.text }]}>
            {right.value}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}
