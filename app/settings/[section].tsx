import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { Bell, BookOpen, ChefHat, Moon, NotebookText, Pointer, RotateCcw, Share2 } from 'lucide-react-native';

import { kitchenStyles as styles } from '../../components/kitchen-styles';
import {
  SettingsActionButton,
  SettingsCard,
  SettingsRow,
  SettingsSelectRow,
  SettingsStepper,
  SettingsToggle,
} from '../../components/settings-ui';
import { useCustomRecipes } from '../../contexts/custom-recipes-context';
import { useRecipeOrder } from '../../contexts/recipe-order-context';
import {
  DEFAULT_TIMER_OPTIONS,
  MAX_TIMER_COUNT,
  MIN_TIMER_COUNT,
  REFERENCE_TAB_OPTIONS,
  TIMER_SOUND_OPTIONS,
  useAppSettings,
  type SettingsSection,
} from '../../contexts/settings-context';
import { sortByManualOrder } from '../../utils/recipe-order';
import { buildSampleRecipes } from '../../utils/sample-recipes';

const SECTION_INFO: Record<SettingsSection, { title: string; subtitle: string; resetLabel: string }> = {
  appearance: { title: 'Appearance', subtitle: 'Theme and visual preferences.', resetLabel: 'Reset appearance settings' },
  cooking: { title: 'Cooking', subtitle: 'Timers, sounds, and cooking experience.', resetLabel: 'Reset cooking settings' },
  recipes: { title: 'Recipe Management', subtitle: 'Saved recipes and list behavior.', resetLabel: 'Reset recipe settings' },
  guides: { title: 'Kitchen Guides', subtitle: 'Default view and content.', resetLabel: 'Reset Kitchen Guides settings' },
  data: { title: 'Data & Exports', subtitle: 'Sharing and export options.', resetLabel: 'Reset export settings' },
};

const isPhone = Platform.OS === 'ios' || Platform.OS === 'android';

const timerSoundOptions = TIMER_SOUND_OPTIONS.map((option) => ({ value: option.id, label: option.label }));
const referenceTabOptions = REFERENCE_TAB_OPTIONS.map((option) => ({ value: option.id, label: option.label }));
const defaultTimerOptions = DEFAULT_TIMER_OPTIONS.map((minutes) => ({
  value: minutes,
  label: minutes === 0 ? 'None' : `${minutes} minute${minutes === 1 ? '' : 's'}`,
}));

function isSettingsSection(value: unknown): value is SettingsSection {
  return typeof value === 'string' && value in SECTION_INFO;
}

export default function SettingsSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const settings = useAppSettings();
  const { palette, resetSection } = settings;
  const [justReset, setJustReset] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
  }, []);

  if (!isSettingsSection(section)) {
    return <Redirect href="/settings" />;
  }

  const info = SECTION_INFO[section];

  function handleReset() {
    resetSection(section as SettingsSection);
    setJustReset(true);
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => setJustReset(false), 1500);
  }

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.settingsPageContent}>
      <View style={styles.settingsPageHeader}>
        <Text style={[styles.settingsPageTitle, { color: palette.accent }]}>{`${info.title} Settings`}</Text>
        <Text style={[styles.settingsPageSubtitle, { color: palette.textMuted }]}>{info.subtitle}</Text>
      </View>

      {section === 'appearance' ? <AppearanceSection /> : null}
      {section === 'cooking' ? <CookingSection /> : null}
      {section === 'recipes' ? <RecipesSection /> : null}
      {section === 'guides' ? <GuidesSection /> : null}
      {section === 'data' ? <DataSection /> : null}

      <SettingsCard icon={RotateCcw} title="Restore defaults">
        <SettingsRow label={info.resetLabel} hint="Restore the settings on this page to their default values.">
          <SettingsActionButton label={justReset ? 'Done ✓' : 'Reset'} onPress={handleReset} />
        </SettingsRow>
      </SettingsCard>
    </ScrollView>
  );
}

function AppearanceSection() {
  const { darkModeEnabled, toggleDarkMode } = useAppSettings();
  return (
    <SettingsCard icon={Moon} title="Theme">
      <SettingsRow label="Dark mode" hint="Switch the app to a darker reading palette.">
        <SettingsToggle label="Dark mode" value={darkModeEnabled} onChange={toggleDarkMode} />
      </SettingsRow>
    </SettingsCard>
  );
}

function CookingSection() {
  const {
    allowVibration,
    defaultTimerMinutes,
    keepScreenAwake,
    reorderHapticsEnabled,
    setDefaultTimerMinutes,
    setTimerCount,
    setTimerSound,
    timerCount,
    timerSound,
    toggleAllowVibration,
    toggleKeepScreenAwake,
    toggleReorderHaptics,
  } = useAppSettings();

  return (
    <>
      <SettingsCard icon={Bell} title="Timer notifications">
        {isPhone ? (
          <SettingsRow label="Allow vibration" hint="Allow phone vibration when a cook timer ends.">
            <SettingsToggle label="Allow vibration" value={allowVibration} onChange={toggleAllowVibration} />
          </SettingsRow>
        ) : null}
        <SettingsSelectRow
          label="Timer sound"
          hint="Choose the alert sound for completed cook timers."
          value={timerSound}
          options={timerSoundOptions}
          onChange={setTimerSound}
        />
        <SettingsRow
          label="Number of timers"
          hint={`How many timer slots to show in the cook timer (${MIN_TIMER_COUNT}–${MAX_TIMER_COUNT}).`}
        >
          <SettingsStepper
            label="Number of timers"
            value={timerCount}
            min={MIN_TIMER_COUNT}
            max={MAX_TIMER_COUNT}
            onChange={setTimerCount}
          />
        </SettingsRow>
      </SettingsCard>

      {isPhone ? (
        <SettingsCard icon={Pointer} title="Recipe interaction">
          <SettingsRow label="Reorder haptics" hint="Short vibration when you pick up a recipe to move it.">
            <SettingsToggle label="Reorder haptics" value={reorderHapticsEnabled} onChange={toggleReorderHaptics} />
          </SettingsRow>
        </SettingsCard>
      ) : null}

      <SettingsCard icon={ChefHat} title="General cooking">
        <SettingsSelectRow
          label="Default timer duration"
          hint="Starting time for new timers."
          value={defaultTimerMinutes}
          options={defaultTimerOptions}
          onChange={setDefaultTimerMinutes}
        />
        <SettingsRow label="Keep screen awake" hint="Prevent the screen from turning off while the app stays open.">
          <SettingsToggle label="Keep screen awake" value={keepScreenAwake} onChange={toggleKeepScreenAwake} />
        </SettingsRow>
      </SettingsCard>
    </>
  );
}

function RecipesSection() {
  const { confirmDeleteEnabled, toggleConfirmDelete } = useAppSettings();
  const { recipeOverrideMap } = useCustomRecipes();
  const { applyOrder, getOrder } = useRecipeOrder();

  const sampleOrderIsDefault = useMemo(() => {
    const defaultSlugs = buildSampleRecipes(recipeOverrideMap).map((recipe) => recipe.slug);
    const currentSlugs = sortByManualOrder(defaultSlugs, (slug) => slug, getOrder('sample-recipes'));
    return defaultSlugs.every((slug, index) => slug === currentSlugs[index]);
  }, [recipeOverrideMap, getOrder]);

  return (
    <SettingsCard icon={NotebookText} title="Recipe list">
      <SettingsRow
        label="Confirm delete"
        hint="Ask before deleting a saved app recipe. Turn this off for faster cleanup. Does not apply to bulk deletes."
      >
        <SettingsToggle label="Confirm delete" value={confirmDeleteEnabled} onChange={toggleConfirmDelete} />
      </SettingsRow>
      <SettingsRow
        label="Reset sample recipe order"
        hint="Restore the Sample Recipes list to the default alphabetical order."
      >
        <SettingsActionButton
          label="Reset"
          disabled={sampleOrderIsDefault}
          onPress={() => applyOrder('sample-recipes', [])}
        />
      </SettingsRow>
    </SettingsCard>
  );
}

function GuidesSection() {
  const { defaultReferenceTab, setDefaultReferenceTab } = useAppSettings();
  return (
    <SettingsCard icon={BookOpen} title="Kitchen Guides">
      <SettingsSelectRow
        label="Default view"
        hint="Choose which tab opens first in Kitchen Guides."
        value={defaultReferenceTab}
        options={referenceTabOptions}
        onChange={setDefaultReferenceTab}
      />
    </SettingsCard>
  );
}

function DataSection() {
  const { showRatingsInCardExports, toggleShowRatingsInCardExports } = useAppSettings();
  return (
    <SettingsCard icon={Share2} title="Sharing & exports">
      <SettingsRow
        label="Show ratings in exports"
        hint="Include your star ratings on shared recipe cards and PDF exports. Off by default."
      >
        <SettingsToggle
          label="Show ratings in exports"
          value={showRatingsInCardExports}
          onChange={toggleShowRatingsInCardExports}
        />
      </SettingsRow>
    </SettingsCard>
  );
}
