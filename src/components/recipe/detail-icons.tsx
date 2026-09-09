import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type IconProps = {
  color?: string;
  size?: number;
};

export function BackArrowIcon({ color = Colors.text, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MoreIcon({ color = Colors.text, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={6} cy={12} r={1.6} fill={color} />
      <Circle cx={12} cy={12} r={1.6} fill={color} />
      <Circle cx={18} cy={12} r={1.6} fill={color} />
    </Svg>
  );
}

export function ClockIcon({ color = Colors.accent, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={1.8} />
      <Path d="M12 8V12.5L15 14.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CostIcon({ color = Colors.accent, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 8.5C7 6.6 9.2 5 12 5C14.8 5 17 6.6 17 8.5C17 10.1 15.4 11.4 13.2 11.9L12 12.2L10.8 11.9C8.6 11.4 7 10.1 7 8.5Z"
        stroke={color}
        strokeWidth={1.6}
      />
      <Path d="M8 12.5V17.5C8 18.9 9.8 20 12 20C14.2 20 16 18.9 16 17.5V12.5" stroke={color} strokeWidth={1.6} />
      <Path d="M12 9V11" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ChefHatIcon({ color = Colors.white, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 14V18.5C6 19.3 6.7 20 7.5 20H16.5C17.3 20 18 19.3 18 18.5V14"
        stroke={color}
        strokeWidth={1.7}
      />
      <Path
        d="M5.5 14C4.1 14 3 12.9 3 11.5C3 10.2 4 9.1 5.3 9C5.6 7 7.6 5.5 10 5.5C10.7 5.5 11.4 5.6 12 5.9C12.6 4.8 13.8 4 15.2 4C17.1 4 18.7 5.4 19 7.2C20.4 7.5 21.5 8.7 21.5 10.2C21.5 11.9 20.1 13.3 18.4 13.5H5.5Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CartGlyphIcon({ color = Colors.white, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 5H5.5L7.2 14.2C7.35 15 8.05 15.6 8.85 15.6H17.4C18.15 15.6 18.85 15.1 19.05 14.35L20.5 8.2H6.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={19} r={1.4} fill={color} />
      <Circle cx={17.2} cy={19} r={1.4} fill={color} />
    </Svg>
  );
}

export function LightbulbIcon({ color = Colors.accent, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18H15M10 21H14M7.5 10.5C7.5 7.5 9.5 5.5 12 5.5C14.5 5.5 16.5 7.5 16.5 10.5C16.5 12.5 15.4 13.8 14.2 14.8C13.4 15.5 13 16.2 13 17H11C11 15.8 10.4 14.9 9.6 14.2C8.5 13.3 7.5 12.2 7.5 10.5Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DifficultyMetaDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <Svg width={32} height={10} viewBox="0 0 32 10" fill="none">
      {[0, 1, 2].map((index) => (
        <Circle
          key={index}
          cx={5 + index * 11}
          cy={5}
          r={index === level - 1 ? 4.2 : 3.2}
          fill={index < level ? Colors.accent : Colors.line}
        />
      ))}
    </Svg>
  );
}
