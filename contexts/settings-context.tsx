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
  loaded: boolean;
  palette: AppPalette;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleDarkMode: (value?: boolean) => void;
  toggleKeepScreenAwake: (value?: boolean) => void;
};

const SETTINGS_KEY = 'kitchen-helper.app-settings';

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

type StoredSettings = {
  darkModeEnabled?: boolean;
  keepScreenAwake?: boolean;
};

export function SettingsProvider({ children }: PropsWithChildren) {
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [keepScreenAwake, setKeepScreenAwake] = useState(false);
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
          setDarkModeEnabled(Boolean(parsed.darkModeEnabled));
          setKeepScreenAwake(Boolean(parsed.keepScreenAwake));
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
      } satisfies StoredSettings)
    ).catch(() => {});
  }, [darkModeEnabled, keepScreenAwake, loaded]);

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
      loaded,
      palette: darkModeEnabled ? darkPalette : lightPalette,
      isSettingsOpen,
      openSettings: () => setIsSettingsOpen(true),
      closeSettings: () => setIsSettingsOpen(false),
      toggleDarkMode: (value?: boolean) =>
        setDarkModeEnabled((current) => (typeof value === 'boolean' ? value : !current)),
      toggleKeepScreenAwake: (value?: boolean) =>
        setKeepScreenAwake((current) => (typeof value === 'boolean' ? value : !current)),
    }),
    [darkModeEnabled, keepScreenAwake, loaded, isSettingsOpen]
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
