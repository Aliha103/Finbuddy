// apps/mobile/src/features/expense/components/hatchTypes.ts
export interface HatchProps {
  width: number;
  height: number;
  /** The stripe colour. */
  stripe: string;
  /** The colour between the stripes. */
  ground: string;
  /** Distance between stripes, in points. */
  gap?: number;
}
