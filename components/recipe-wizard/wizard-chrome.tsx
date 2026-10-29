import { Fragment, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Minus, Plus, type LucideIcon } from 'lucide-react-native';

import { useAppSettings } from '../../contexts/settings-context';
import { WIZARD_STEPS, type WizardStep } from '../../hooks/use-recipe-form';
import { kitchenStyles as styles } from '../kitchen-styles';

/** Save buttons use the same green as the original Edit screen's "Save Changes". */
export const SAVE_GREEN = '#2c8030';
const SAVE_GREEN_TEXT = '#ffffff';

/** ① Details — ② Ingredients — ③ Directions — ④ Finish */
export function WizardStepper({
  current,
  completed,
  onSelect,
}: {
  current: WizardStep;
  completed: (step: WizardStep) => boolean;
  /** When set, every step is tappable (Edit recipe). */
  onSelect?: (step: WizardStep) => void;
}) {
  const { palette } = useAppSettings();
  const currentIndex = WIZARD_STEPS.findIndex((step) => step.key === current);

  return (
    <View style={[styles.wizardStepper, { borderBottomColor: palette.border }]}>
      {WIZARD_STEPS.map((step, index) => {
        const isCurrent = step.key === current;
        const isDone = !isCurrent && completed(step.key) && (onSelect ? true : index < currentIndex);
        const circle = (
          <View style={styles.wizardStep}>
            <View
              style={[
                styles.wizardStepCircle,
                { borderColor: palette.borderAlt, backgroundColor: palette.elevated },
                (isCurrent || isDone) && { backgroundColor: palette.accent, borderColor: palette.accent },
              ]}
            >
              {isDone ? (
                <Check size={16} color={palette.accentContrastText} strokeWidth={3} />
              ) : (
                <Text
                  style={[
                    styles.wizardStepNumber,
                    { color: isCurrent ? palette.accentContrastText : palette.text },
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.wizardStepLabel,
                { color: isCurrent ? palette.text : palette.textMuted, fontWeight: isCurrent ? '800' : '500' },
              ]}
            >
              {step.label}
            </Text>
          </View>
        );

        return (
          <Fragment key={step.key}>
            {index > 0 ? <View style={[styles.wizardStepLine, { backgroundColor: palette.borderAlt }]} /> : null}
            {onSelect ? (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: isCurrent }}
                accessibilityLabel={`Step ${index + 1}: ${step.label}`}
                onPress={() => onSelect(step.key)}
              >
                {circle}
              </Pressable>
            ) : (
              circle
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

/** Back (outline) + primary pill. */
export function WizardFooter({
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryIcon = 'arrow',
  primaryTone = 'accent',
}: {
  onBack?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryIcon?: 'arrow' | 'none';
  /** 'save' makes the primary button green. */
  primaryTone?: 'accent' | 'save';
}) {
  const { palette } = useAppSettings();
  const isSave = primaryTone === 'save';
  const primaryBackground = primaryDisabled ? palette.borderAlt : isSave ? SAVE_GREEN : palette.accent;
  const primaryText = isSave ? SAVE_GREEN_TEXT : palette.accentContrastText;
  return (
    <View style={styles.wizardFooter}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={[styles.wizardBackButton, { borderColor: palette.borderAlt, backgroundColor: palette.elevated }]}
        >
          <ArrowLeft size={18} color={palette.text} />
          <Text style={[styles.pillButtonText, styles.wizardButtonText, { color: palette.text }]}>Back</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: primaryDisabled }}
        disabled={primaryDisabled}
        onPress={onPrimary}
        style={[
          styles.wizardNextButton,
          primaryIcon === 'arrow' && styles.wizardNextButtonWithIcon,
          { backgroundColor: primaryBackground },
        ]}
      >
        {/* The arrow sits on the right edge so the label itself is centered in the button. */}
        <Text numberOfLines={1} style={[styles.pillButtonText, styles.wizardButtonText, { color: primaryText }]}>
          {primaryLabel}
        </Text>
        {primaryIcon === 'arrow' ? (
          <View style={styles.wizardNextIcon} pointerEvents="none">
            <ArrowRight size={18} color={primaryText} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

export function ChoiceCard({
  icon: Icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useAppSettings();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.choiceCard,
        { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
        selected && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
      ]}
    >
      <Icon size={26} color={selected ? palette.accentContrastText : palette.accent} strokeWidth={2.2} />
      <Text style={[styles.choiceCardTitle, { color: selected ? palette.accentContrastText : palette.text }]}>
        {title}
      </Text>
      <Text style={[styles.choiceCardSubtitle, { color: selected ? palette.accentContrastText : palette.textMuted }]}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export function FormLabel({ children, required = false }: { children: ReactNode; required?: boolean }) {
  const { palette } = useAppSettings();
  return (
    <Text style={[styles.wizardLabel, { color: palette.text }]}>
      {children}
      {required ? <Text style={{ color: palette.accent }}> *</Text> : null}
    </Text>
  );
}

export function FormInput(props: ComponentProps<typeof TextInput>) {
  const { palette } = useAppSettings();
  return (
    <TextInput
      placeholderTextColor={palette.searchPlaceholder}
      {...props}
      style={[
        styles.wizardInput,
        { backgroundColor: palette.elevated, borderColor: palette.borderAlt, color: palette.text },
        props.style,
      ]}
    />
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { palette } = useAppSettings();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.wizardChip,
        { backgroundColor: palette.elevated, borderColor: palette.borderAlt },
        selected && { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft },
      ]}
    >
      <Text style={[styles.wizardChipText, { color: selected ? palette.accentContrastText : palette.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A form-field dropdown. Options open inline below it. `allowCustom` adds "Other…" with a text box. */
export function SelectField({
  value,
  options,
  onChange,
  placeholder,
  allowCustom = false,
  accessibilityLabel,
}: {
  value: string;
  options: readonly { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder: string;
  allowCustom?: boolean;
  accessibilityLabel: string;
}) {
  const { palette } = useAppSettings();
  const [open, setOpen] = useState(false);
  const isKnown = !value || options.some((option) => option.value === value);
  const [customMode, setCustomMode] = useState(allowCustom && !isKnown);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  if (customMode) {
    return (
      <View style={{ gap: 6 }}>
        <FormInput
          value={value}
          onChangeText={onChange}
          placeholder="Type a cuisine"
          accessibilityLabel={accessibilityLabel}
          autoFocus={!value}
        />
        <Pressable onPress={() => setCustomMode(false)} style={{ alignSelf: 'flex-start' }}>
          <Text style={[styles.settingsPageRowHint, { color: palette.accentText, fontWeight: '700' }]}>
            Choose from list
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}: ${selectedLabel || placeholder}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={[
          styles.wizardInput,
          styles.wizardSelect,
          { backgroundColor: palette.elevated, borderColor: open ? palette.accentSoft : palette.borderAlt },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[styles.wizardSelectText, { color: selectedLabel ? palette.text : palette.searchPlaceholder }]}
        >
          {selectedLabel || placeholder}
        </Text>
        <ChevronDown size={18} color={palette.text} />
      </Pressable>
      {open ? (
        <View style={[styles.settingsOptionList, { backgroundColor: palette.elevatedAlt, borderColor: palette.borderAlt }]}>
          {[...(allowCustom ? [{ label: 'None', value: '' }] : []), ...options].map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value || 'none'}
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
          {allowCustom ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                setCustomMode(true);
                onChange('');
              }}
              style={styles.settingsOption}
            >
              <Text style={[styles.settingsOptionText, { color: palette.accentText }]}>Other…</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** − n + stepper sized for form rows. */
export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  const { palette } = useAppSettings();
  return (
    <View style={[styles.wizardStepperControl, { borderColor: palette.borderAlt, backgroundColor: palette.elevated }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        disabled={value <= min}
        onPress={() => onChange(value - 1)}
        style={[styles.wizardStepperButton, value <= min && { opacity: 0.35 }]}
      >
        <Minus size={18} color={palette.accent} strokeWidth={2.6} />
      </Pressable>
      <Text style={[styles.wizardStepperValue, { color: palette.text, borderColor: palette.borderAlt }]}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
        style={[styles.wizardStepperButton, value >= max && { opacity: 0.35 }]}
      >
        <Plus size={18} color={palette.accent} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}
