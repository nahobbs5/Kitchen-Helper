import Svg, { Circle, Line } from 'react-native-svg';

type Props = { color: string; size?: number };

export function ShareIcon({ color, size = 20 }: Props) {
  // Left node (larger) connects to upper-right and lower-right (smaller)
  // No line between the two right nodes
  const left =  { cx: 6,  cy: 12, r: 3.5 };
  const upper = { cx: 18, cy: 5,  r: 2.5 };
  const lower = { cx: 18, cy: 19, r: 2.5 };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1={left.cx} y1={left.cy}
        x2={upper.cx} y2={upper.cy}
        stroke={color} strokeWidth={2} strokeLinecap="round"
      />
      <Line
        x1={left.cx} y1={left.cy}
        x2={lower.cx} y2={lower.cy}
        stroke={color} strokeWidth={2} strokeLinecap="round"
      />
      <Circle cx={left.cx}  cy={left.cy}  r={left.r}  stroke={color} strokeWidth={2} />
      <Circle cx={upper.cx} cy={upper.cy} r={upper.r} stroke={color} strokeWidth={2} />
      <Circle cx={lower.cx} cy={lower.cy} r={lower.r} stroke={color} strokeWidth={2} />
    </Svg>
  );
}
