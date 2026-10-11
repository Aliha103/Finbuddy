import { cn } from '../lib/cn';

/** The label every sample figure wears. Quiet, but always present. */
export function SampleChip({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-[12px] font-semibold tracking-[0.01em]',
        onDark ? 'border-[#B9AFBE] text-[#E4DEE6]' : 'border-label-3 text-label-2',
        className,
      )}
    >
      Sample
    </span>
  );
}
