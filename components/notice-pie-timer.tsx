import Svg, { Circle, Path } from 'react-native-svg';

type NoticePieTimerProps = {
  progress: number;
  color: string;
  backgroundColor: string;
  size?: number;
};

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeSector(cx: number, cy: number, radius: number, progress: number) {
  const clampedProgress = Math.max(0, Math.min(progress, 0.9999));

  if (clampedProgress <= 0) {
    return null;
  }

  const endAngle = clampedProgress * 360;
  const start = polarToCartesian(cx, cy, radius, 0);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

export function NoticePieTimer({
  progress,
  color,
  backgroundColor,
  size = 20,
}: NoticePieTimerProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const center = size / 2;
  const radius = center - 1;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={center} cy={center} r={radius} fill={backgroundColor} />
      {clampedProgress >= 0.999 ? (
        <Circle cx={center} cy={center} r={radius} fill={color} />
      ) : null}
      {clampedProgress > 0 && clampedProgress < 0.999 ? (
        <Path d={describeSector(center, center, radius, clampedProgress) ?? ''} fill={color} />
      ) : null}
    </Svg>
  );
}
