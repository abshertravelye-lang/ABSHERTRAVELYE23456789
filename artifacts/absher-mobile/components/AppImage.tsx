/**
 * AppImage — unified mobile image component.
 *
 * - expo-image with disk+memory caching (cachePolicy="memory-disk")
 * - Smooth transition placeholder while loading
 * - Automatic fallback to a bundled local asset when loading fails,
 *   so users never see broken images or empty boxes.
 *
 * Usage:
 *   <AppImage source={{ uri }} style={...} contentFit="cover" />
 *   <AppImage source={getImageSource(path)} fallback={require('@/assets/images/hero.jpg')} />
 */
import React, { useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, type ImageProps } from 'expo-image';

const DEFAULT_FALLBACK = require('@/assets/images/hero.jpg');

/** Tiny neutral blurhash shown while the image loads. */
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export interface AppImageProps extends Omit<ImageProps, 'source'> {
  source?: ImageSourcePropType | { uri: string } | null;
  /** Local asset (require(...)) or remote source shown when loading fails. */
  fallback?: ImageSourcePropType;
}

export function AppImage({ source, fallback = DEFAULT_FALLBACK, ...rest }: AppImageProps) {
  const [errored, setErrored] = useState(false);

  // Reset error state if the source changes (e.g. admin replaced the image).
  const sourceKey = JSON.stringify(source ?? null);
  useEffect(() => {
    setErrored(false);
  }, [sourceKey]);

  const finalSource = errored || !source ? fallback : source;

  return (
    <Image
      source={finalSource as ImageProps['source']}
      cachePolicy="memory-disk"
      transition={200}
      placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}

export default AppImage;
