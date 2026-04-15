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

type SettingsContextValue = {
  darkModeEnabled: boolean;
  keepScreenAwake: boolean;
  confirmDeleteEnabled: boolean;
  timerCount: number;
  loaded: boolean;
  palette: AppPalette;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleDarkMode: (value?: boolean) => void;
  toggleKeepScreenAwake: (value?: boolean) => void;
  toggleConfirmDelete: (value?: boolean) => void;
  setTimerCount: (value: number) => void;
  resetToDefaults: () => void;
};

const SETTINGS_KEY = 'kitchen-helper.app-settings';

const DEFAULT_SETTINGS = {
  darkModeEnabled: false,
  keepScreenAwake: false,
  confirmDeleteEnabled: true,
  timerCount: 3,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

type StoredSettings = {
  darkModeEnabled?: boolean;
  keepScreenAwake?: boolean;
  confirmDeleteEnabled?: boolean;
  timerCount?: number;
};

export function SettingsProvider({ children }: PropsWithChildren) {
  const [darkModeEnabled, setDarkModeEnabled] = useState(DEFAULT_SETTINGS.darkModeEnabled);
  const [keepScreenAwake, setKeepScreenAwake] = useState(DEFAULT_SETTINGS.keepScreenAwake);
  const [confirmDeleteEnabled, setConfirmDeleteEnabled] = useState(DEFAULT_SETTINGS.confirmDeleteEnabled);
  const [timerCount, setTimerCount] = useState(DEFAULT_SETTINGS.timerCount);
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
          setConfirmDeleteEnabled(parsed.confirmDeleteEnabled ?? DEFAULT_SETTINGS.confirmDeleteEnabled);
          if (typeof parsed.timerCount === 'number' && parsed.timerCount >= 1) {
            setTimerCount(parsed.timerCount);
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
        confirmDeleteEnabled,
        timerCount,
      } satisfies StoredSettings)
    ).catch(() => {});
  }, [confirmDeleteEnabled, darkModeEnabled, keepScreenAwake, timerCount, loaded]);

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
      confirmDeleteEnabled,
      timerCount,
      loaded,
      palette: darkModeEnabled ? darkPalette : lightPalette,
      isSettingsOpen,
      openSettings: () => setIsSettingsOpen(true),
      closeSettings: () => setIsSettingsOpen(false),
      toggleDarkMode: (value?: boolean) =>
        setDarkModeEnabled((current) => (typeof value === 'boolean' ? value : !current)),
      toggleKeepScreenAwake: (value?: boolean) =>
        setKeepScreenAwake((current) => (typeof value === 'boolean' ? value : !current)),
      toggleConfirmDelete: (value?: boolean) =>
        setConfirmDeleteEnabled((current) => (typeof value === 'boolean' ? value : !current)),
      setTimerCount: (value: number) => setTimerCount(Math.max(1, Math.min(6, value))),
      resetToDefaults: () => {
        setDarkModeEnabled(DEFAULT_SETTINGS.darkModeEnabled);
        setKeepScreenAwake(DEFAULT_SETTINGS.keepScreenAwake);
        setConfirmDeleteEnabled(DEFAULT_SETTINGS.confirmDeleteEnabled);
        setTimerCount(DEFAULT_SETTINGS.timerCount);
      },
    }),
    [confirmDeleteEnabled, darkModeEnabled, keepScreenAwake, timerCount, loaded, isSettingsOpen]
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
