import Svg, { Path } from 'react-native-svg';

type Props = { color: string; size?: number };

export function EditIcon({ color, size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20l4.3-1 10.4-10.4a2.6 2.6 0 10-3.7-3.7L4.6 15.3 4 20z"
        stroke={color}
        strokeWidth={2.3}
        strokeLinejoin="round"
      />
      <Path d="M13.8 6.2l4 4" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
    </Svg>
  );
}
