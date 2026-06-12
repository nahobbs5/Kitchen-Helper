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

type SettingsContextValue = {
  darkModeEnabled: boolean;
  keepScreenAwake: boolean;
  allowVibration: boolean;
  confirmDeleteEnabled: boolean;
  showRatingsInCardExports: boolean;
  timerCount: number;
  timerSound: TimerSoundId;
  defaultReferenceTab: ReferenceTabId;
  loaded: boolean;
  palette: AppPalette;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleDarkMode: (value?: boolean) => void;
  toggleKeepScreenAwake: (value?: boolean) => void;
  toggleAllowVibration: (value?: boolean) => void;
  toggleConfirmDelete: (value?: boolean) => void;
  toggleShowRatingsInCardExports: (value?: boolean) => void;
  setTimerCount: (value: number) => void;
  setTimerSound: (value: TimerSoundId) => void;
  setDefaultReferenceTab: (value: ReferenceTabId) => void;
  resetToDefaults: () => void;
};

const SETTINGS_KEY = 'kitchen-helper.app-settings';
export const MIN_TIMER_COUNT = 1;
export const MAX_TIMER_COUNT = 6;

const DEFAULT_SETTINGS: {
  darkModeEnabled: boolean;
  keepScreenAwake: boolean;
  allowVibration: boolean;
  confirmDeleteEnabled: boolean;
  showRatingsInCardExports: boolean;
  timerCount: number;
  timerSound: TimerSoundId;
  defaultReferenceTab: ReferenceTabId;
} = {
  darkModeEnabled: false,
  keepScreenAwake: false,
  allowVibration: true,
  confirmDeleteEnabled: true,
  showRatingsInCardExports: false,
  timerCount: 3,
  timerSound: 'beep-beep',
  defaultReferenceTab: 'conversions',
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

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

type StoredSettings = {
  darkModeEnabled?: boolean;
  keepScreenAwake?: boolean;
  allowVibration?: boolean;
  confirmDeleteEnabled?: boolean;
  showRatingsInCardExports?: boolean;
  timerCount?: number;
  timerSound?: string;
  defaultReferenceTab?: string;
};

export function SettingsProvider({ children }: PropsWithChildren) {
  const [darkModeEnabled, setDarkModeEnabled] = useState(DEFAULT_SETTINGS.darkModeEnabled);
  const [keepScreenAwake, setKeepScreenAwake] = useState(DEFAULT_SETTINGS.keepScreenAwake);
  const [allowVibration, setAllowVibration] = useState(DEFAULT_SETTINGS.allowVibration);
  const [confirmDeleteEnabled, setConfirmDeleteEnabled] = useState(DEFAULT_SETTINGS.confirmDeleteEnabled);
  const [showRatingsInCardExports, setShowRatingsInCardExports] = useState(
    DEFAULT_SETTINGS.showRatingsInCardExports
  );
  const [timerCount, setTimerCount] = useState(DEFAULT_SETTINGS.timerCount);
  const [timerSound, setTimerSound] = useState<TimerSoundId>(DEFAULT_SETTINGS.timerSound);
  const [defaultReferenceTab, setDefaultReferenceTab] = useState<ReferenceTabId>(
    DEFAULT_SETTINGS.defaultReferenceTab
  );
  const [loaded, setLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
        confirmDeleteEnabled,
        showRatingsInCardExports,
        timerCount,
        timerSound,
        defaultReferenceTab,
      } satisfies StoredSettings)
    ).catch(() => {});
  }, [
    allowVibration,
    confirmDeleteEnabled,
    showRatingsInCardExports,
    darkModeEnabled,
    keepScreenAwake,
    timerCount,
    timerSound,
    defaultReferenceTab,
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

  const value = useMemo<SettingsContextValue>(
    () => ({
      darkModeEnabled,
      keepScreenAwake,
      allowVibration,
      confirmDeleteEnabled,
      showRatingsInCardExports,
      timerCount,
      timerSound,
      defaultReferenceTab,
      loaded,
      palette: darkModeEnabled ? darkPalette : lightPalette,
      isSettingsOpen,
      openSettings: () => setIsSettingsOpen(true),
      closeSettings: () => setIsSettingsOpen(false),
      toggleDarkMode: (value?: boolean) =>
        setDarkModeEnabled((current) => (typeof value === 'boolean' ? value : !current)),
      toggleKeepScreenAwake: (value?: boolean) =>
        setKeepScreenAwake((current) => (typeof value === 'boolean' ? value : !current)),
      toggleAllowVibration: (value?: boolean) =>
        setAllowVibration((current) => (typeof value === 'boolean' ? value : !current)),
      toggleConfirmDelete: (value?: boolean) =>
        setConfirmDeleteEnabled((current) => (typeof value === 'boolean' ? value : !current)),
      toggleShowRatingsInCardExports: (value?: boolean) =>
        setShowRatingsInCardExports((current) => (typeof value === 'boolean' ? value : !current)),
      setTimerCount: (value: number) => setTimerCount(clampTimerCount(value)),
      setTimerSound,
      setDefaultReferenceTab,
      resetToDefaults: () => {
        setDarkModeEnabled(DEFAULT_SETTINGS.darkModeEnabled);
        setKeepScreenAwake(DEFAULT_SETTINGS.keepScreenAwake);
        setAllowVibration(DEFAULT_SETTINGS.allowVibration);
        setConfirmDeleteEnabled(DEFAULT_SETTINGS.confirmDeleteEnabled);
        setShowRatingsInCardExports(DEFAULT_SETTINGS.showRatingsInCardExports);
        setTimerCount(DEFAULT_SETTINGS.timerCount);
        setTimerSound(DEFAULT_SETTINGS.timerSound);
        setDefaultReferenceTab(DEFAULT_SETTINGS.defaultReferenceTab);
      },
    }),
    [
      allowVibration,
      confirmDeleteEnabled,
      showRatingsInCardExports,
      darkModeEnabled,
      keepScreenAwake,
      timerCount,
      timerSound,
      defaultReferenceTab,
      loaded,
      isSettingsOpen,
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
