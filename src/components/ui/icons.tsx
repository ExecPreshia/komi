import { KomiIcon, KomiIconAssets, KomiIconIntrinsic, sizeByHeight } from '@/components/icons/KomiIcon';

type IconProps = {
  color?: string;
  size?: number;
  filled?: boolean;
};

/** Recettes tab — height-normalized to match Courses visually. */
export function BookIcon({ size = 20, filled = false }: IconProps) {
  const dims = sizeByHeight(KomiIconIntrinsic.recettes, size);
  return (
    <KomiIcon
      source={filled ? KomiIconAssets.recettesSelected : KomiIconAssets.recettes}
      width={dims.width}
      height={dims.height}
    />
  );
}

/** Courses tab — height-normalized to match Recettes visually. */
export function CartIcon({ size = 20, filled = false }: IconProps) {
  const dims = sizeByHeight(KomiIconIntrinsic.courses, size);
  return (
    <KomiIcon
      source={filled ? KomiIconAssets.coursesSelected : KomiIconAssets.courses}
      width={dims.width}
      height={dims.height}
    />
  );
}

export function GearIcon({ size = 20 }: IconProps) {
  return <KomiIcon source={KomiIconAssets.parameters} width={size} height={size} />;
}
