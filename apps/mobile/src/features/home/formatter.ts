// apps/mobile/src/features/home/formatter.ts
// The Formatter from features/common/format with sample names cleaned: "Casey (sample)" reads as
// "Casey" in sentences because every sample row already wears the Sample chip, so the suffix would
// only repeat what the chip says. Everything else (locale, spoken forms, "You") is the common one.
import { useMemo } from 'react';

import { useDeviceLocale, usePeople, useProfile } from '@/data';
import { createFormatter, type Formatter } from '@/features/common/format';

const SAMPLE_SUFFIX = / \(sample\)$/;

/** "Trip to Japan (sample)" -> "Trip to Japan". */
export function cleanName(name: string): string {
  return name.replace(SAMPLE_SUFFIX, '');
}

export function useFormatter(): Formatter {
  const locale = useDeviceLocale();
  const profile = useProfile();
  const people = usePeople();
  const me = profile?.personId ?? null;
  return useMemo(() => {
    const names = new Map([...people].map(([id, p]) => [id, { displayName: cleanName(p.displayName) }] as const));
    return createFormatter(locale, me, names);
  }, [locale, me, people]);
}
