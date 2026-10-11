// apps/mobile/src/app/dev/gallery.tsx
// The design gallery route (development and the web preview only; see features/dev/Gallery.tsx).
import { Redirect } from 'expo-router';

import { GALLERY_ENABLED, Gallery } from '@/features/dev/Gallery';

export default function GalleryRoute() {
  if (!GALLERY_ENABLED) return <Redirect href="/" />;
  return <Gallery />;
}
