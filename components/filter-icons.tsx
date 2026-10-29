import {
  Bean,
  BeanOff,
  CakeSlice,
  Croissant,
  Egg,
  EggOff,
  Milk,
  MilkOff,
  Nut,
  NutOff,
  Salad,
  ShieldCheck,
  Soup,
  Star,
  Tag,
  UtensilsCrossed,
  Wheat,
  WheatOff,
  type LucideIcon,
} from 'lucide-react-native';

const categoryIcons: Record<string, LucideIcon> = {
  dessert: CakeSlice,
  breakfast: Croissant,
  appetizers: Soup,
  apps: Soup,
  entree: UtensilsCrossed,
  side: Salad,
  favorites: Star,
};

export function getCategoryIcon(name: string): LucideIcon {
  return categoryIcons[name.trim().toLowerCase()] ?? Tag;
}

// Matched by keyword so "Contains Eggs", "Egg Free" and similar spellings all resolve.
const dietaryKeywords: { match: RegExp; free: LucideIcon; contains: LucideIcon }[] = [
  { match: /dairy|milk|lactose/, free: MilkOff, contains: Milk },
  { match: /egg/, free: EggOff, contains: Egg },
  { match: /gluten|wheat/, free: WheatOff, contains: Wheat },
  { match: /nut|peanut/, free: NutOff, contains: Nut },
  { match: /soy/, free: BeanOff, contains: Bean },
];

export function getDietaryIcon(tag: string): LucideIcon {
  const normalized = tag.toLowerCase();
  const isFree = normalized.includes('free');

  if (normalized.includes('allergy free')) {
    return ShieldCheck;
  }

  const entry = dietaryKeywords.find((item) => item.match.test(normalized));

  if (!entry) {
    return Tag;
  }

  return isFree ? entry.free : entry.contains;
}

export function shortCategoryLabel(name: string) {
  return name === 'Appetizers' ? 'Apps' : name;
}
