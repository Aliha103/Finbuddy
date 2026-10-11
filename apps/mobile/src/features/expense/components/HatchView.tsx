// apps/mobile/src/features/expense/components/HatchView.tsx
// The remainder without Skia (the web preview before CanvasKit has loaded): the same ground with a
// dashed outline, so "not yet assigned" still reads as different from a share.
import { View } from 'react-native';

import type { HatchProps } from './hatchTypes';

export function HatchView({ width, height, stripe, ground }: HatchProps) {
  return <View pointerEvents="none" style={{ width, height, backgroundColor: ground, borderWidth: 1.5, borderStyle: 'dashed', borderColor: stripe }} />;
}
