import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = {
  color: string;
  size?: number;
  filled?: boolean;
};

export function BookIcon({ color, size = 22, filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H11V20H5.5C4.67 20 4 19.33 4 18.5V5.5Z"
        stroke={color}
        strokeWidth={1.8}
        fill={filled ? color : 'none'}
      />
      <Path
        d="M20 5.5C20 4.67 19.33 4 18.5 4H13V20H18.5C19.33 20 20 19.33 20 18.5V5.5Z"
        stroke={color}
        strokeWidth={1.8}
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}

export function CartIcon({ color, size = 22, filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 5H5.5L7.2 14.2C7.35 15 8.05 15.6 8.85 15.6H17.4C18.15 15.6 18.85 15.1 19.05 14.35L20.5 8.2H6.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.15 : 0}
      />
      <Circle cx={9} cy={19} r={1.4} fill={color} />
      <Circle cx={17.2} cy={19} r={1.4} fill={color} />
    </Svg>
  );
}

export function GearIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={1.8} />
      <Path
        d="M19.4 13.2C19.5 12.8 19.5 12.4 19.5 12C19.5 11.6 19.5 11.2 19.4 10.8L21.1 9.5L19.1 6L17.1 7.1C16.5 6.7 15.8 6.3 15.1 6.1L14.7 4H9.3L8.9 6.1C8.2 6.3 7.5 6.7 6.9 7.1L4.9 6L2.9 9.5L4.6 10.8C4.5 11.2 4.5 11.6 4.5 12C4.5 12.4 4.5 12.8 4.6 13.2L2.9 14.5L4.9 18L6.9 16.9C7.5 17.3 8.2 17.7 8.9 17.9L9.3 20H14.7L15.1 17.9C15.8 17.7 16.5 17.3 17.1 16.9L19.1 18L21.1 14.5L19.4 13.2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
