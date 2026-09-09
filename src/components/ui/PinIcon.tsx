import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type PinIconProps = {
  active?: boolean;
  size?: number;
};

export function PinIcon({ active = false, size = 20 }: PinIconProps) {
  const color = active ? Colors.accent : Colors.textMuted;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21L8.5 14.5C6.5 13.5 5.2 11.4 5.2 9.1C5.2 5.7 8 3 11.5 3C15 3 17.8 5.7 17.8 9.1C17.8 11.4 16.5 13.5 14.5 14.5L12 21Z"
        stroke={color}
        strokeWidth={1.8}
        fill={active ? color : 'none'}
        strokeLinejoin="round"
      />
      <Path d="M12 10.2A1.4 1.4 0 1 0 12 7.4A1.4 1.4 0 0 0 12 10.2Z" fill={color} />
    </Svg>
  );
}
