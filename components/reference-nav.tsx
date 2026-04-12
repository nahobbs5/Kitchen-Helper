import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { kitchenStyles as styles } from './kitchen-styles';
import { useCookTimer } from '../contexts/cook-timer-context';
import { useAppSettings } from '../contexts/settings-context';

const referenceLinks = [
  { href: '/', label: 'Main Menu' },
  { href: '/conversions', label: 'Conversions' },
  { href: '/allergy-substitutions', label: 'Substitutions' },
  { href: '/cooking-dictionary', label: 'Cooking Dictionary' },
] as const;

export function ReferenceNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { openCookTimer } = useCookTimer();
  const { palette } = useAppSettings();

  return (
    <View style={styles.actionRow}>
      <Pressable
        onPress={openCookTimer}
        style={[styles.secondaryButton, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
      >
        <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>Cook Timer</Text>
      </Pressable>
      {referenceLinks
        .filter((link) => link.href !== pathname)
        .map((link) => (
          <Pressable
            key={link.href}
            onPress={() => router.push(link.href)}
            style={[styles.secondaryButton, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}
          >
            <Text style={[styles.secondaryButtonText, { color: palette.accentText }]}>{link.label}</Text>
          </Pressable>
        ))}
    </View>
  );
}
