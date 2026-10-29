import { Clock, Flame, Timer, Users, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { AppPalette } from './app-theme';
import { kitchenStyles as styles } from './kitchen-styles';

const icons: Record<RecipeMetaKind, LucideIcon> = {
  prep: Clock,
  cook: Flame,
  total: Timer,
  serves: Users,
};

export type RecipeMetaKind = 'prep' | 'cook' | 'total' | 'serves';

// Time/servings pill on recipe pages, with an icon in front of the label.
export function RecipeMetaPill({ kind, label, palette }: { kind: RecipeMetaKind; label: string; palette: AppPalette }) {
  const Icon = icons[kind];

  return (
    <View style={[styles.tag, pillStyles.pill, { backgroundColor: palette.tag }]}>
      <Icon size={15} color={palette.tagText} strokeWidth={2.2} />
      <Text style={[styles.tagText, { color: palette.tagText }]}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
});
