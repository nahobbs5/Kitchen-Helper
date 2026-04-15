import Svg, { Circle, Path } from 'react-native-svg';

type Props = { color: string; size?: number };

export function ShareIcon({ color, size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Circle cx={6}  cy={12} r={3.5} fill={color} />
      <Circle cx={18} cy={5}  r={2.5} fill={color} />
      <Circle cx={18} cy={19} r={2.5} fill={color} />
    </Svg>
  );
}
