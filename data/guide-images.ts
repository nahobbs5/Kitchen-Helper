import type { ImageSourcePropType } from 'react-native';

/**
 * Optional photos for Kitchen Guides rows (Substitutions and Tips).
 * Keys are the lowercased ingredient name or tip title. Rows without a photo show a food icon.
 *
 * To add one: drop a square PNG (~256px) into assets/guides/ and add a line, e.g.
 *   butter: require('../assets/guides/butter.png'),
 */
export const guideImages: Record<string, ImageSourcePropType> = {};

export function getGuideImage(name: string): ImageSourcePropType | undefined {
  return guideImages[name.trim().toLowerCase()];
}
