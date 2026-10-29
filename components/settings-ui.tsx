import { Children, Fragment, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, ChevronDown, ChevronRight, Minus, Plus, type LucideIcon } from 'lucide-react-native';

import { useAppSettings } from '../contexts/settings-context';
import { kitchenStyles as styles } from './kitchen-styles';

export function SettingsIconTile({ icon: Icon, size = 44 }: { icon: LucideIcon; size?: number }) {
  const { palette } = useAppSettings();
  return (
    <View
      style={[
        styles.settingsIconTile,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: palette.tag },
      ]}
    >
      <Icon size={Math.round(size * 0.5)} color={palette.accent} strokeWidth={2.2} />
    </View>
  );
}

/** A titled group of setting rows, separated by thin dividers. */
export function SettingsCard({ icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  const { palette } = useAppSettings();
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.settingsCard, { backgroundColor: palette.elevated, borderColor: palette.borderAlt }]}>
      <View style={styles.settingsCardHeader}>
        <SettingsIconTile icon={icon} />
        <Text style={[styles.settingsCardTitle, { color: palette.text }]}>{title}</Text>
      </View>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <View style={[styles.settingsDivider, { backgroundColor: palette.border }]} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

type SettingsRowProps = {
  label: string;
  hint?: string;
  children?: ReactNode;
  /** Shown full-width under the row (used by the dropdown's option list). */
  below?: ReactNode;
};

export function SettingsRow({ label, hint, children, below }: SettingsRowProps) {
  const { palette } = useAppSettings();
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.settingsPageRow}>
        <View style={styles.settingsPageRowCopy}>
          <Text style={[styles.settingsPageRowLabel, { color: palette.text }]}>{label}</Text>
          {hint ? <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>{hint}</Text> : null}
        </View>
        {children}
      </View>
      {below}
    </View>
  );
}

export function SettingsToggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  const { palette } = useAppSettings();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={6}
      onPress={() => onChange(!value)}
      style={[
        styles.settingsToggle,
        { backgroundColor: value ? palette.accentSoft : palette.border },
        value ? styles.settingsToggleOn : null,
      ]}
    >
      <View style={styles.settingsToggleKnob} />
    </Pressable>
  );
}

export function SettingsStepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const { palette } = useAppSettings();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={[styles.settingsStepper, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        disabled={!canDecrease}
        onPress={() => onChange(value - 1)}
        style={[styles.settingsStepperButton, !canDecrease && { opacity: 0.35 }]}
      >
        <Minus size={18} color={palette.text} strokeWidth={2.4} />
      </Pressable>
      <Text
        accessibilityLabel={`${label}: ${value}`}
        style={[styles.settingsStepperValue, { color: palette.text, borderColor: palette.borderAlt }]}
      >
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        disabled={!canIncrease}
        onPress={() => onChange(value + 1)}
        style={[styles.settingsStepperButton, !canIncrease && { opacity: 0.35 }]}
      >
        <Plus size={18} color={palette.text} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

type SelectOption<T> = { value: T; label: string };

/** A dropdown pill. The option list opens inline under the row so it never gets clipped inside a ScrollView. */
export function SettingsSelectRow<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
}) {
  const { palette } = useAppSettings();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <SettingsRow
      label={label}
      hint={hint}
      below={
        open ? (
          <View style={[styles.settingsOptionList, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={String(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={[styles.settingsOption, isSelected && { backgroundColor: palette.tag }]}
                >
                  <Text style={[styles.settingsOptionText, { color: palette.text }]}>{option.label}</Text>
                  {isSelected ? <Check size={16} color={palette.accent} strokeWidth={2.6} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected.label}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={[
          styles.settingsSelectPill,
          { backgroundColor: palette.elevatedAlt, borderColor: open ? palette.accentSoft : palette.borderAlt },
        ]}
      >
        <Text numberOfLines={1} style={[styles.settingsSelectText, { color: palette.text }]}>
          {selected.label}
        </Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={16} color={palette.text} strokeWidth={2.4} />
        </View>
      </Pressable>
    </SettingsRow>
  );
}

export function SettingsActionButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { palette } = useAppSettings();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.settingsActionButton,
        { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={[styles.settingsActionButtonText, { color: palette.accent }]}>{label}</Text>
    </Pressable>
  );
}

/** A tappable row with an optional icon, label, hint and a trailing chevron. */
export function SettingsNavRow({
  icon: Icon,
  label,
  hint,
  onPress,
  destructive = false,
  disabled = false,
}: {
  icon?: LucideIcon;
  label: string;
  hint?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const { palette } = useAppSettings();
  const labelColor = destructive ? palette.warningText : palette.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.settingsNavRow, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}
    >
      {Icon ? <Icon size={22} color={destructive ? palette.warningText : palette.accent} strokeWidth={2.2} /> : null}
      <View style={styles.settingsPageRowCopy}>
        <Text style={[styles.settingsPageRowLabel, { color: labelColor }]}>{label}</Text>
        {hint ? <Text style={[styles.settingsPageRowHint, { color: palette.textMuted }]}>{hint}</Text> : null}
      </View>
      <ChevronRight size={20} color={palette.accent} strokeWidth={2.4} />
    </Pressable>
  );
}

/** Full-width pill button: burgundy "primary" or tan-outline "secondary". */
export function PillButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const { palette } = useAppSettings();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pillButton,
        isPrimary
          ? { backgroundColor: disabled ? palette.borderAlt : palette.accent, borderColor: 'transparent' }
          : { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt },
        { opacity: disabled && !isPrimary ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text
        style={[
          styles.pillButtonText,
          { color: isPrimary ? palette.accentContrastText : palette.accentText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
