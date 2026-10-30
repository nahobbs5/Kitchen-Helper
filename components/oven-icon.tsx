import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Props = { color: string; size?: number };

/** Oven, drawn in Lucide's line style (Lucide has no oven icon): control strip with dials over a door window. */
export function OvenIcon({ color, size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={2.5} stroke={color} strokeWidth={2} />
      <Path d="M3 8h18" stroke={color} strokeWidth={2} />
      <Circle cx={7} cy={5.5} r={0.9} fill={color} />
      <Circle cx={10.5} cy={5.5} r={0.9} fill={color} />
      <Path d="M14.5 5.5h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x={6.5} y={11.5} width={11} height={6} rx={1.5} stroke={color} strokeWidth={2} />
    </Svg>
  );
}
