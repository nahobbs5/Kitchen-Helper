import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { deactivateKeepAwake, activateKeepAwakeAsync } from 'expo-keep-awake';

import { AppPalette, darkPalette, lightPalette } from '../components/app-theme';

export const TIMER_SOUND_OPTIONS = [
  { id: 'beep-beep', label: 'Beep Beep' },
  { id: 'soft-chime', label: 'Soft Chime' },
  { id: 'classic-bell', label: 'Classic Bell' },
  { id: 'urgent-alarm', label: 'Urgent Alarm' },
] as const;

export type TimerSoundId = (typeof TIMER_SOUND_OPTIONS)[number]['id'];

export const REFERENCE_TAB_OPTIONS = [
  { id: 'conversions', label: 'Conversions' },
  { id: 'substitutions', label: 'Substitutions' },
  { id: 'dictionary', label: 'Dictionary' },
  { id: 'tips', label: 'Tips' },
] as const;

export type ReferenceTabId = (typeof REFERENCE_TAB_OPTIONS)[number]['id'];

/** Minutes pre-filled into empty cook timer slots. 0 means no default. */
export const DEFAULT_TIMER_OPTIONS = [0, 1, 3, 5, 10, 15, 20, 30, 45, 60] as const;

export type SettingsSection = 'appearance' | 'cooking' | 'recipes' | 'guides' | 'data';

type SettingsContextValue = {
  darkModeEnabled: boolean;
  keepScreenAwake: boolean;
  allowVibration: boolean;
  reorderHapticsEnabled: boolean;
  confirmDeleteEnabled: boolean;
  showRatingsInCardExports: boolean;
  timerCount: number;
  timerSound: TimerSoundId;
  defaultReferenceTab: ReferenceTabId;
  defaultTimerMinutes: number;
  loaded: boolean;
  palette: AppPalette;
  toggleDarkMode: (value?: boolean) => void;
  toggleKeepScreenAwake: (value?: boolean) => void;
  toggleAllowVibration: (value?: boolean) => void;
  toggleReorderHaptics: (value?: boolean) => void;
  toggleConfirmDelete: (value?: boolean) => void;
  toggleShowRatingsInCardExports: (value?: boolean) => void;
  setTimerCount: (value: number) => void;
  setTimerSound: (value: TimerSoundId) => void;
  setDefaultReferenceTab: (value: ReferenceTabId) => void;
  setDefaultTimerMinutes: (value: number) => void;
  resetToDefaults: () => void;
  resetSection: (section: SettingsSection) => void;
};

const SETTINGS_KEY = 'kitchen-helper.app-settings';
export const MIN_TIMER_COUNT = 1;
export const MAX_TIMER_COUNT = 6;

const DEFAULT_SETTINGS: {
  darkModeEnabled: boolean;
  keepScreenAwake: boolean;
  allowVibration: boolean;
  reorderHapticsEnabled: boolean;
  confirmDeleteEnabled: boolean;
  showRatingsInCardExports: boolean;
  timerCount: number;
  timerSound: TimerSoundId;
  defaultReferenceTab: ReferenceTabId;
  defaultTimerMinutes: number;
} = {
  darkModeEnabled: false,
  keepScreenAwake: false,
  allowVibration: true,
  reorderHapticsEnabled: true,
  confirmDeleteEnabled: true,
  showRatingsInCardExports: false,
  timerCount: 3,
  timerSound: 'beep-beep',
  defaultReferenceTab: 'conversions',
  defaultTimerMinutes: 0,
};

function clampTimerCount(value: number) {
  return Math.max(MIN_TIMER_COUNT, Math.min(MAX_TIMER_COUNT, value));
}

function isTimerSoundId(value: unknown): value is TimerSoundId {
  return TIMER_SOUND_OPTIONS.some((option) => option.id === value);
}

function isReferenceTabId(value: unknown): value is ReferenceTabId {
  return REFERENCE_TAB_OPTIONS.some((option) => option.id === value);
}

function isDefaultTimerMinutes(value: unknown): value is number {
  return DEFAULT_TIMER_OPTIONS.some((option) => option === value);
}

const ALL_SETTINGS_SECTIONS: SettingsSection[] = ['appearance', 'cooking', 'recipes', 'guides', 'data'];

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

type StoredSettings = {
  darkModeEnabled?: boolean;
  keepScreenAwake?: boolean;
  allowVibration?: boolean;
  reorderHapticsEnabled?: boolean;
  confirmDeleteEnabled?: boolean;
  showRatingsInCardExports?: boolean;
  timerCount?: number;
  timerSound?: string;
  defaultReferenceTab?: string;
  defaultTimerMinutes?: number;
};

export function SettingsProvider({ children }: PropsWithChildren) {
  const [darkModeEnabled, setDarkModeEnabled] = useState(DEFAULT_SETTINGS.darkModeEnabled);
  const [keepScreenAwake, setKeepScreenAwake] = useState(DEFAULT_SETTINGS.keepScreenAwake);
  const [allowVibration, setAllowVibration] = useState(DEFAULT_SETTINGS.allowVibration);
  const [reorderHapticsEnabled, setReorderHapticsEnabled] = useState(DEFAULT_SETTINGS.reorderHapticsEnabled);
  const [confirmDeleteEnabled, setConfirmDeleteEnabled] = useState(DEFAULT_SETTINGS.confirmDeleteEnabled);
  const [showRatingsInCardExports, setShowRatingsInCardExports] = useState(
    DEFAULT_SETTINGS.showRatingsInCardExports
  );
  const [timerCount, setTimerCount] = useState(DEFAULT_SETTINGS.timerCount);
  const [timerSound, setTimerSound] = useState<TimerSoundId>(DEFAULT_SETTINGS.timerSound);
  const [defaultReferenceTab, setDefaultReferenceTab] = useState<ReferenceTabId>(
    DEFAULT_SETTINGS.defaultReferenceTab
  );
  const [defaultTimerMinutes, setDefaultTimerMinutes] = useState(DEFAULT_SETTINGS.defaultTimerMinutes);
  const [loaded, setLoaded] = useState(false);
  const wakeLockActiveRef = useRef(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(SETTINGS_KEY)
      .then((value) => {
        if (!active) {
          return;
        }

        if (!value) {
          setLoaded(true);
          return;
        }

        try {
          const parsed = JSON.parse(value) as StoredSettings;
          setDarkModeEnabled(parsed.darkModeEnabled ?? DEFAULT_SETTINGS.darkModeEnabled);
          setKeepScreenAwake(parsed.keepScreenAwake ?? DEFAULT_SETTINGS.keepScreenAwake);
          setAllowVibration(parsed.allowVibration ?? DEFAULT_SETTINGS.allowVibration);
          setReorderHapticsEnabled(parsed.reorderHapticsEnabled ?? DEFAULT_SETTINGS.reorderHapticsEnabled);
          setConfirmDeleteEnabled(parsed.confirmDeleteEnabled ?? DEFAULT_SETTINGS.confirmDeleteEnabled);
          setShowRatingsInCardExports(
            parsed.showRatingsInCardExports ?? DEFAULT_SETTINGS.showRatingsInCardExports
          );
          setTimerSound(isTimerSoundId(parsed.timerSound) ? parsed.timerSound : DEFAULT_SETTINGS.timerSound);
          setDefaultReferenceTab(
            isReferenceTabId(parsed.defaultReferenceTab)
              ? parsed.defaultReferenceTab
              : DEFAULT_SETTINGS.defaultReferenceTab
          );
          setDefaultTimerMinutes(
            isDefaultTimerMinutes(parsed.defaultTimerMinutes)
              ? parsed.defaultTimerMinutes
              : DEFAULT_SETTINGS.defaultTimerMinutes
          );
          if (typeof parsed.timerCount === 'number' && parsed.timerCount >= MIN_TIMER_COUNT) {
            setTimerCount(clampTimerCount(parsed.timerCount));
          } else {
            setTimerCount(DEFAULT_SETTINGS.timerCount);
          }
        } finally {
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        darkModeEnabled,
        keepScreenAwake,
        allowVibration,
        reorderHapticsEnabled,
        confirmDeleteEnabled,
        showRatingsInCardExports,
        timerCount,
        timerSound,
        defaultReferenceTab,
        defaultTimerMinutes,
      } satisfies StoredSettings)
    ).catch(() => {});
  }, [
    allowVibration,
    reorderHapticsEnabled,
    confirmDeleteEnabled,
    showRatingsInCardExports,
    darkModeEnabled,
    keepScreenAwake,
    timerCount,
    timerSound,
    defaultReferenceTab,
    defaultTimerMinutes,
    loaded,
  ]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (!keepScreenAwake) {
      if (wakeLockActiveRef.current) {
        deactivateKeepAwake();
        wakeLockActiveRef.current = false;
      }

      return;
    }

    activateKeepAwakeAsync()
      .then(() => {
        wakeLockActiveRef.current = true;
      })
      .catch(() => {});

    return () => {
      if (wakeLockActiveRef.current) {
        deactivateKeepAwake();
        wakeLockActiveRef.current = false;
      }
    };
  }, [keepScreenAwake, loaded]);

  // Each Settings page resets only the values shown on it.
  function resetSettingsSection(section: SettingsSection) {
    switch (section) {
      case 'appearance':
        setDarkModeEnabled(DEFAULT_SETTINGS.darkModeEnabled);
        break;
      case 'cooking':
        setAllowVibration(DEFAULT_SETTINGS.allowVibration);
        setTimerSound(DEFAULT_SETTINGS.timerSound);
        setTimerCount(DEFAULT_SETTINGS.timerCount);
        setReorderHapticsEnabled(DEFAULT_SETTINGS.reorderHapticsEnabled);
        setDefaultTimerMinutes(DEFAULT_SETTINGS.defaultTimerMinutes);
        setKeepScreenAwake(DEFAULT_SETTINGS.keepScreenAwake);
        break;
      case 'recipes':
        setConfirmDeleteEnabled(DEFAULT_SETTINGS.confirmDeleteEnabled);
        break;
      case 'guides':
        setDefaultReferenceTab(DEFAULT_SETTINGS.defaultReferenceTab);
        break;
      case 'data':
        setShowRatingsInCardExports(DEFAULT_SETTINGS.showRatingsInCardExports);
        break;
    }
  }

  const value = useMemo<SettingsContextValue>(
    () => ({
      darkModeEnabled,
      keepScreenAwake,
      allowVibration,
      reorderHapticsEnabled,
      confirmDeleteEnabled,
      showRatingsInCardExports,
      timerCount,
      timerSound,
      defaultReferenceTab,
      defaultTimerMinutes,
      loaded,
      palette: darkModeEnabled ? darkPalette : lightPalette,
      toggleDarkMode: (value?: boolean) =>
        setDarkModeEnabled((current) => (typeof value === 'boolean' ? value : !current)),
      toggleKeepScreenAwake: (value?: boolean) =>
        setKeepScreenAwake((current) => (typeof value === 'boolean' ? value : !current)),
      toggleAllowVibration: (value?: boolean) =>
        setAllowVibration((current) => (typeof value === 'boolean' ? value : !current)),
      toggleReorderHaptics: (value?: boolean) =>
        setReorderHapticsEnabled((current) => (typeof value === 'boolean' ? value : !current)),
      toggleConfirmDelete: (value?: boolean) =>
        setConfirmDeleteEnabled((current) => (typeof value === 'boolean' ? value : !current)),
      toggleShowRatingsInCardExports: (value?: boolean) =>
        setShowRatingsInCardExports((current) => (typeof value === 'boolean' ? value : !current)),
      setTimerCount: (value: number) => setTimerCount(clampTimerCount(value)),
      setTimerSound,
      setDefaultReferenceTab,
      setDefaultTimerMinutes: (value: number) =>
        setDefaultTimerMinutes(isDefaultTimerMinutes(value) ? value : DEFAULT_SETTINGS.defaultTimerMinutes),
      resetSection: (section: SettingsSection) => resetSettingsSection(section),
      resetToDefaults: () => {
        for (const section of ALL_SETTINGS_SECTIONS) {
          resetSettingsSection(section);
        }
      },
    }),
    [
      allowVibration,
      reorderHapticsEnabled,
      confirmDeleteEnabled,
      showRatingsInCardExports,
      darkModeEnabled,
      keepScreenAwake,
      timerCount,
      timerSound,
      defaultReferenceTab,
      defaultTimerMinutes,
      loaded,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used inside SettingsProvider');
  }

  return context;
}
