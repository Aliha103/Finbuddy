// The card fan in three.js through React Three Fiber: five ID-1 cards (1.586:1) whose faces are
// CanvasTextures drawn by lib/fan's drawCard in Mona Sans. frameloop="demand": nothing renders
// until the scroll scene writes a new progress and calls invalidate(), so the GPU idles between
// scroll events. Loaded with React.lazy only when the section is near the viewport, and disposed
// on unmount.
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';

import { CARD_THEMES, CARD_UNITS, FONT_STACK, drawCard, pose, type FanCard, type FanLayout } from '../lib/fan';

const TEXTURE_SCALE = 3.2; // 320 units -> 1024 px

function makeTexture(card: FanCard, theme: 'light' | 'dark'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(CARD_UNITS.w * TEXTURE_SCALE);
  canvas.height = Math.round(CARD_UNITS.h * TEXTURE_SCALE);
  const g = canvas.getContext('2d');
  if (g) drawCard(g, card, CARD_THEMES[theme], TEXTURE_SCALE);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Hands the scene's invalidate() to the scroll scene that lives outside the Canvas. */
function Invalidator({ target }: { target: RefObject<(() => void) | null> }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    target.current = invalidate;
    invalidate();
    return () => {
      target.current = null;
    };
  }, [invalidate, target]);
  return null;
}

/** Keeps the camera at the distance the layout solved for the stage's aspect. */
function CameraRig({ layout }: { layout: FanLayout }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.position.set(0, 0, layout.cameraZ);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = layout.fov;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [camera, layout.cameraZ, layout.fov, invalidate]);
  return null;
}

function Fan({ cards, theme, progress, layout }: { cards: readonly FanCard[]; theme: 'light' | 'dark'; progress: { value: number }; layout: FanLayout }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(layout.cardW, layout.cardH), [layout.cardW, layout.cardH]);
  const textures = useMemo(() => cards.map((c) => makeTexture(c, theme)), [cards, theme]);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    invalidate();
    return () => textures.forEach((t) => t.dispose());
  }, [textures, invalidate]);

  useFrame(() => {
    const p = progress.value;
    const g = group.current;
    if (!g) return;
    // Stacked, the wallet leans back a little; fanned, the cards face the viewer.
    g.rotation.x = -0.55 * (1 - p);
    g.children.forEach((mesh, i) => {
      const q = pose(i, cards.length, p, layout);
      mesh.position.set(q.x, q.y, q.z);
      mesh.rotation.set(0, 0, q.rotZ);
    });
  });

  return (
    <group ref={group}>
      {cards.map((card, i) => (
        <mesh key={card.key} geometry={geometry} renderOrder={i}>
          <meshStandardMaterial map={textures[i]} transparent alphaTest={0.5} roughness={0.6} metalness={0} emissive="#ffffff" emissiveMap={textures[i]} emissiveIntensity={0.62} />
        </mesh>
      ))}
    </group>
  );
}

export interface CardFanProps {
  cards: readonly FanCard[];
  theme: 'light' | 'dark';
  layout: FanLayout;
  progress: { value: number };
  invalidateRef: RefObject<(() => void) | null>;
  onReady: () => void;
}

export default function CardFan({ cards, theme, layout, progress, invalidateRef, onReady }: CardFanProps) {
  // The faces are drawn in Mona Sans; wait for it so the textures are not set in the fallback face.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([document.fonts.load(`700 30px ${FONT_STACK}`), document.fonts.load(`600 13px ${FONT_STACK}`)])
      .catch(() => undefined)
      .then(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, []);
  if (!fontsReady) return null;
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 1.5]}
      flat
      frameloop="demand"
      camera={{ position: [0, 0, layout.cameraZ], fov: layout.fov }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={() => onReady()}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 4, 6]} intensity={0.75} />
      <Invalidator target={invalidateRef} />
      <CameraRig layout={layout} />
      <Fan cards={cards} theme={theme} progress={progress} layout={layout} />
    </Canvas>
  );
}
