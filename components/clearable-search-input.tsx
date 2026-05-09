import type { ComponentProps } from 'react';
import type { LayoutChangeEvent, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { kitchenStyles as styles } from './kitchen-styles';

type ClearableSearchInputProps = Omit<ComponentProps<typeof TextInput>, 'onLayout' | 'style'> & {
  clearAccessibilityLabel?: string;
  clearTintColor: string;
  inputStyle?: StyleProp<TextStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
  value: string;
};

export function ClearableSearchInput({
  clearAccessibilityLabel = 'Clear search',
  clearTintColor,
  inputStyle,
  onChangeText,
  onLayout,
  style,
  value,
  ...inputProps
}: ClearableSearchInputProps) {
  return (
    <View onLayout={onLayout} style={style}>
      <TextInput
        {...inputProps}
        value={value}
        onChangeText={onChangeText}
        underlineColorAndroid="transparent"
        style={[styles.clearableSearchInputText, inputStyle]}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel={clearAccessibilityLabel}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => onChangeText?.('')}
          style={styles.searchClearButton}
        >
          <Svg width={16} height={16} viewBox="0 0 16 16" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Path d="M4 4L12 12M12 4L4 12" stroke={clearTintColor} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}
