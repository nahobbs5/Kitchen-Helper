import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { AppPalette } from './app-theme';

export function FryingPanIcon({ size, palette }: { size: number; palette: AppPalette }) {
  return (
    <Svg width={size} height={size} viewBox="6 11 27 24" fill="none">
      <Path d="M17 22.3L26.2 28.8" stroke={palette.addButtonText} strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M24.3 27.5L29 30.8" stroke={palette.addButtonText} strokeWidth={4.4} strokeLinecap="round" />
      <Circle cx={15.1} cy={20.4} r={7.2} fill={palette.addButtonText} />
      <Circle cx={15.1} cy={20.4} r={3.9} fill={palette.addButtonBg} />
      <Circle cx={15.1} cy={20.4} r={1.8} fill={palette.accentSoft} />
      <Path
        d="M11.3 17.3C12.3 16.4 13.6 15.9 15.1 15.9"
        stroke={palette.addButtonText}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeOpacity={0.5}
      />
    </Svg>
  );
}

export function MultiSelectIcon({ active, size, palette }: { active: boolean; size: number; palette: AppPalette }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Layered cards peeking out behind the front card */}
      <Path
        d="M13 28.6H24.6C26.8 28.6 28.6 26.8 28.6 24.6V13"
        stroke={palette.addButtonText}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path
        d="M9 24.6H20.6C22.8 24.6 24.6 22.8 24.6 20.6V9"
        stroke={palette.addButtonText}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      {/* Front card with checkmark */}
      <Rect
        x={4}
        y={4}
        width={16.6}
        height={16.6}
        rx={4}
        fill={active ? palette.addButtonText : palette.addButtonBg}
        stroke={palette.addButtonText}
        strokeWidth={2.4}
      />
      <Path
        d="M8.2 12.4L11.3 15.5L16.6 9.4"
        stroke={active ? palette.addButtonBg : palette.addButtonText}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
