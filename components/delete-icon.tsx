import Svg, { Path } from 'react-native-svg';

type Props = { color: string; size?: number };

export function DeleteIcon({ color, size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 7.25h15" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
      <Path d="M9 5.25h6" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
      <Path d="M10 5.25V4h4v1.25" stroke={color} strokeWidth={2.3} strokeLinejoin="round" />
      <Path
        d="M7.75 9.25l.8 10h6.9l.8-10"
        stroke={color}
        strokeWidth={2.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10.5 11.5v5M13.5 11.5v5" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
    </Svg>
  );
}
