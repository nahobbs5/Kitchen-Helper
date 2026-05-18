import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function FryingPanIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="6 11 27 24" fill="none">
      <Path d="M17 22.3L26.2 28.8" stroke="#4a2d63" strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M24.3 27.5L29 30.8" stroke="#4a2d63" strokeWidth={4.4} strokeLinecap="round" />
      <Circle cx={15.1} cy={20.4} r={7.2} fill="#4a2d63" />
      <Circle cx={15.1} cy={20.4} r={3.9} fill="#fff8ef" />
      <Circle cx={15.1} cy={20.4} r={1.8} fill="#d3a64f" />
      <Path
        d="M11.3 17.3C12.3 16.4 13.6 15.9 15.1 15.9"
        stroke="#7d6293"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MultiSelectIcon({ active, size }: { active: boolean; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x={5} y={4} width={16} height={16} rx={4} stroke="#4a2d63" strokeWidth={2.4} />
      <Rect
        x={11}
        y={11}
        width={16}
        height={16}
        rx={4}
        fill={active ? '#4a2d63' : '#fff8ef'}
        stroke="#4a2d63"
        strokeWidth={2.4}
      />
      {active ? (
        <Path
          d="M15.2 19.1L18.1 22L23 16.7"
          stroke="#fff8ef"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
}
