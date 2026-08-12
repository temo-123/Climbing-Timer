import { useEffect, useState } from 'react';
import { Image } from 'react-native';

// Admin-authored training photos have no guaranteed aspect ratio (see
// TopAlignedImage) — this reads the real pixel dimensions of a remote image
// so the crop math can be based on its actual shape instead of assumed.
export function useImageNaturalSize(uri?: string): { width: number; height: number } | null {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setSize(null);
    if (!uri) return;
    let cancelled = false;
    Image.getSize(
      uri,
      (width, height) => { if (!cancelled) setSize({ width, height }); },
      () => { if (!cancelled) setSize(null); }
    );
    return () => { cancelled = true; };
  }, [uri]);

  return size;
}
