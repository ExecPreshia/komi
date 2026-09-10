import Svg, { Circle, Path } from 'react-native-svg';

import {
  KomiIcon,
  KomiIconAssets,
  KomiIconIntrinsic,
  sizeByHeight,
} from '@/components/icons/KomiIcon';
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

export function ClockIcon({ size = 20 }: IconProps) {
  return <KomiIcon source={KomiIconAssets.time} width={size} height={size} />;
}

export function CostIcon({ size = 20 }: IconProps) {
  const dims = sizeByHeight(KomiIconIntrinsic.price, size);
  return <KomiIcon source={KomiIconAssets.price} width={dims.width} height={dims.height} />;
}

export function ChefHatIcon({ size = 20 }: IconProps) {
  const dims = sizeByHeight(KomiIconIntrinsic.cook, size);
  return <KomiIcon source={KomiIconAssets.cook} width={dims.width} height={dims.height} />;
}

/** Shopping CTA — Courses SVG, tinted for dark/light buttons. */
export function CartGlyphIcon({ color = Colors.white, size = 18 }: IconProps) {
  const dims = sizeByHeight(KomiIconIntrinsic.courses, size);
  return (
    <KomiIcon
      source={KomiIconAssets.courses}
      width={dims.width}
      height={dims.height}
      tintColor={color}
    />
  );
}

export function LightbulbIcon({ color = Colors.accent, size = 20 }: IconProps) {
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
