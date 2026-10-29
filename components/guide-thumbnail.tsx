import { Image, View } from 'react-native';
import {
  Bean,
  Candy,
  Carrot,
  ChefHat,
  Droplet,
  Egg,
  Leaf,
  Milk,
  Nut,
  Pizza,
  Wheat,
  type LucideIcon,
} from 'lucide-react-native';

import { useAppSettings } from '../contexts/settings-context';
import { getGuideImage } from '../data/guide-images';

// First match wins, so more specific words come before general ones ("peanut butter" → Nut).
const guideIconKeywords: { match: RegExp; icon: LucideIcon }[] = [
  { match: /egg/, icon: Egg },
  { match: /peanut|nut/, icon: Nut },
  { match: /soy|tofu/, icon: Bean },
  { match: /cheese|parmesan/, icon: Pizza },
  { match: /milk|cream/, icon: Milk },
  { match: /butter|oil/, icon: Droplet },
  { match: /flour|starch|baking powder|baking soda|rice/, icon: Wheat },
  { match: /sugar|chocolate|honey|syrup/, icon: Candy },
  { match: /spinach|greens|herb|kale/, icon: Leaf },
  { match: /potato/, icon: Carrot },
];

export function getGuideIcon(name: string): LucideIcon {
  const normalized = name.toLowerCase();
  return guideIconKeywords.find((entry) => entry.match.test(normalized))?.icon ?? ChefHat;
}

type GuideThumbnailProps = {
  /** Ingredient name or tip title, used to pick the photo or icon. */
  name: string;
  /** Text used for icon matching when it differs from the photo key (e.g. a tip's category). */
  iconHint?: string;
  size?: number;
};

export function GuideThumbnail({ name, iconHint, size = 56 }: GuideThumbnailProps) {
  const { palette } = useAppSettings();
  const image = getGuideImage(name);

  if (image) {
    return (
      <Image
        source={image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: 14 }}
      />
    );
  }

  const Icon = getGuideIcon(iconHint ? `${iconHint} ${name}` : name);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.tag,
      }}
    >
      <Icon size={Math.round(size / 2)} color={palette.accentText} strokeWidth={1.8} />
    </View>
  );
}
