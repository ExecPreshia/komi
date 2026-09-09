import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type IconProps = {
  color?: string;
  size?: number;
};

export function CloseIcon({ color = Colors.text, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M18 6L6 18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraIcon({ color = Colors.textMuted, size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8.5C4 7.4 4.9 6.5 6 6.5H8.2L9.4 5H14.6L15.8 6.5H18C19.1 6.5 20 7.4 20 8.5V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V8.5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12.5} r={3.2} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

export function TrashIcon({ color = Colors.textMuted, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 7H19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M9 7V5.5C9 4.7 9.7 4 10.5 4H13.5C14.3 4 15 4.7 15 5.5V7" stroke={color} strokeWidth={1.6} />
      <Path
        d="M8 7L8.7 18.2C8.8 19.2 9.6 20 10.6 20H13.4C14.4 20 15.2 19.2 15.3 18.2L16 7"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DragHandleIcon({ color = Colors.accent, size = 18 }: IconProps) {
  const dots = [0, 1, 2];
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      {dots.map((row) =>
        [0, 1].map((col) => (
          <Circle
            key={`${row}-${col}`}
            cx={5 + col * 8}
            cy={4 + row * 5}
            r={1.5}
            fill={color}
          />
        )),
      )}
    </Svg>
  );
}

export function PlusIcon({ color = Colors.white, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M5 12H19" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function DifficultyDots({ level, size = 10 }: { level: 1 | 2 | 3; size?: number }) {
  return (
    <Svg width={size * 3 + 12} height={size} viewBox={`0 0 ${size * 3 + 12} ${size}`} fill="none">
      {[0, 1, 2].map((index) => (
        <Circle
          key={index}
          cx={size / 2 + index * (size + 6)}
          cy={size / 2}
          r={size / 2}
          fill={index < level ? Colors.accent : '#F0C8C6'}
        />
      ))}
    </Svg>
  );
}
