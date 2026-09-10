import { KomiIcon, KomiIconAssets, KomiIconIntrinsic, sizeByHeight } from '@/components/icons/KomiIcon';

type PinIconProps = {
  active?: boolean;
  /** Visual height of the pin graphic (aspect ratio preserved). */
  size?: number;
};

export function PinIcon({ active = false, size = 16 }: PinIconProps) {
  const dims = sizeByHeight(KomiIconIntrinsic.pin, size);
  return (
    <KomiIcon
      source={active ? KomiIconAssets.pinSelected : KomiIconAssets.pin}
      width={dims.width}
      height={dims.height}
    />
  );
}
