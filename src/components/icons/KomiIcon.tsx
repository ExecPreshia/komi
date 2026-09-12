import { Image } from 'expo-image';
import { StyleSheet, type StyleProp, type ImageStyle } from 'react-native';

/**
 * Renders an exported Figma SVG from assets/icons/.
 * Prefer selected/unselected asset pairs over recreating paths.
 *
 * `width` / `height` control the render box; use intrinsic aspect ratios so
 * icons with different viewBoxes share the same visible graphic size.
 */
export function KomiIcon({
  source,
  width,
  height,
  tintColor,
  style,
}: {
  source: number;
  width: number;
  height: number;
  tintColor?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={source}
      style={[styles.base, { width, height }, style]}
      contentFit="contain"
      tintColor={tintColor}
      accessibilityIgnoresInvertColors
    />
  );
}

export const KomiIconAssets = {
  pin: require('../../../assets/icons/pin.svg'),
  pinSelected: require('../../../assets/icons/pin-selected.svg'),
  recettes: require('../../../assets/icons/recettes.svg'),
  recettesSelected: require('../../../assets/icons/recettes-selected.svg'),
  courses: require('../../../assets/icons/courses.svg'),
  coursesSelected: require('../../../assets/icons/courses-selected.svg'),
  parameters: require('../../../assets/icons/parameters.svg'),
  trash: require('../../../assets/icons/trash.svg'),
  drag: require('../../../assets/icons/drag.svg'),
  time: require('../../../assets/icons/time.svg'),
  price: require('../../../assets/icons/price.svg'),
  cook: require('../../../assets/icons/cook.svg'),
  microphone: require('../../../assets/icons/microphone.svg'),
  microphoneSelected: require('../../../assets/icons/microphone-selected.svg'),
} as const;

/** Intrinsic SVG sizes from Figma exports (width × height). */
export const KomiIconIntrinsic = {
  pin: { width: 17, height: 23 },
  recettes: { width: 17, height: 22 },
  courses: { width: 23, height: 21 },
  parameters: { width: 24, height: 24 },
  trash: { width: 14, height: 19 },
  drag: { width: 8, height: 13 },
  time: { width: 24, height: 24 },
  price: { width: 19, height: 24 },
  cook: { width: 21, height: 21 },
  microphone: { width: 15, height: 24 },
  microphoneSelected: { width: 16, height: 24 },
} as const;

/** Scale so the graphic’s height matches `visualHeight` (preserves aspect ratio). */
export function sizeByHeight(
  intrinsic: { width: number; height: number },
  visualHeight: number,
): { width: number; height: number } {
  const scale = visualHeight / intrinsic.height;
  return {
    width: intrinsic.width * scale,
    height: visualHeight,
  };
}

const styles = StyleSheet.create({
  base: {
    flexShrink: 0,
  },
});
