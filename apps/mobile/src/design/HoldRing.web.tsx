// apps/mobile/src/design/HoldRing.web.tsx
// The Gate's ring for the web preview, where Skia would need CanvasKit: a stroked SVG circle whose
// dash offset follows the hold progress through Reanimated animated props. Same geometry as the
// Skia ring, so the team reviews the same control.
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

export interface HoldRingProps {
  progress: SharedValue<number>;
  size: number;
  stroke: number;
  color: string;
  trackOpacity?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** '#RRGGBB' at an alpha: react-native-svg on the web ignores strokeOpacity, so the track gets an rgba colour. */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function HoldRing({ progress, size, stroke, color, trackOpacity = 0.3 }: HoldRingProps) {
  const r = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * r;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.min(1, Math.max(0, progress.value))),
  }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={styles.rotated}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={withAlpha(color, trackOpacity)} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // SVG arcs start at 3 o'clock; the gate ring starts at 12.
  rotated: { transform: [{ rotate: '-90deg' }] },
});
