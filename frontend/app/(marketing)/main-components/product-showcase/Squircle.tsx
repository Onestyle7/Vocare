import { cn } from '@/lib/utils';

const SQUIRCLE = 'M28 0C46.5 0 56 6.9 56 28S46.5 56 28 56 0 49.1 0 28 9.5 0 28 0Z';

// Concave neck that joins the active tab to the card below it.
export const TAB_NECK =
  'M7 0C7 0 11.6 .9 11.6 7 11.6 13.1 0 14 0 14H32C32 14 20.4 13.1 20.4 7 20.4 .9 25 0 25 0Z';

type Props = {
  className?: string;
  fill: string;
};

export default function Squircle({ className, fill }: Props) {
  return (
    <svg
      viewBox="0 0 56 56"
      aria-hidden="true"
      className={cn('absolute inset-0 size-full', className)}
    >
      <path d={SQUIRCLE} fill={fill} />
    </svg>
  );
}
