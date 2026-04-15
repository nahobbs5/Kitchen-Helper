import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  fetchCurrentUser,
  getSyncConfig,
  refreshSession,
  signInWithPassword,
  signUpWithPassword,
  type SyncSession,
  type SyncUser,
} from '../utils/supabase-sync';

type AuthContextValue = {
  configured: boolean;
  loaded: boolean;
  isAuthenticating: boolean;
  user: SyncUser | null;
  session: SyncSession | null;
  authError: string | null;
  authMessage: string | null;
  clearAuthFeedback: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AUTH_SESSION_KEY = 'kitchen-helper.auth-session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const config = useMemo(() => getSyncConfig(), []);
  const configured = Boolean(config);
  const [loaded, setLoaded] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [session, setSession] = useState<SyncSession | null>(null);
  const [user, setUser] = useState<SyncUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!config) {
      setLoaded(true);
      return;
    }

    AsyncStorage.getItem(AUTH_SESSION_KEY)
      .then(async (stored) => {
        if (!active) {
          return;
        }

        if (!stored) {
          setLoaded(true);
          return;
        }

        try {
          const parsed = JSON.parse(stored) as SyncSession;
          const needsRefresh =
            typeof parsed.expiresAt === 'number' ? parsed.expiresAt - Date.now() < 60_000 : false;
          const nextSession = needsRefresh
            ? await refreshSession(config, parsed.refreshToken)
            : parsed;
          const nextUser = await fetchCurrentUser(config, nextSession.accessToken);

          if (!active) {
            return;
          }

          const hydratedSession = { ...nextSession, user: nextUser };
          setSession(hydratedSession);
          setUser(nextUser);
          await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(hydratedSession));
        } catch {
          if (!active) {
            return;
          }

          await AsyncStorage.removeItem(AUTH_SESSION_KEY);
          setSession(null);
          setUser(null);
        } finally {
          if (active) {
            setLoaded(true);
          }
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
  }, [config]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loaded,
      isAuthenticating,
      user,
      session,
      authError,
      authMessage,
      clearAuthFeedback: () => {
        setAuthError(null);
        setAuthMessage(null);
      },
      signIn: async (email: string, password: string) => {
        if (!config) {
          setAuthError('Sync is not configured yet.');
          return false;
        }

        setIsAuthenticating(true);
        setAuthError(null);
        setAuthMessage(null);

        try {
          const nextSession = await signInWithPassword(config, email.trim(), password);
          const nextUser = await fetchCurrentUser(config, nextSession.accessToken);
          const hydratedSession = { ...nextSession, user: nextUser };

          setSession(hydratedSession);
          setUser(nextUser);
          await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(hydratedSession));
          setAuthMessage('Signed in. Your recipes will sync across devices.');
          return true;
        } catch (error) {
          setAuthError(normalizeError(error, 'Unable to sign in.'));
          return false;
        } finally {
          setIsAuthenticating(false);
          setLoaded(true);
        }
      },
      signUp: async (email: string, password: string) => {
        if (!config) {
          setAuthError('Sync is not configured yet.');
          return false;
        }

        setIsAuthenticating(true);
        setAuthError(null);
        setAuthMessage(null);

        try {
          const result = await signUpWithPassword(config, email.trim(), password);

          if (!result.session) {
            setAuthMessage('Account created. Check your email to confirm it, then sign in.');
            return false;
          }

          const nextUser = await fetchCurrentUser(config, result.session.accessToken);
          const hydratedSession = { ...result.session, user: nextUser };

          setSession(hydratedSession);
          setUser(nextUser);
          await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(hydratedSession));
          setAuthMessage('Account created. Your recipes will now sync across devices.');
          return true;
        } catch (error) {
          setAuthError(normalizeError(error, 'Unable to create an account.'));
          return false;
        } finally {
          setIsAuthenticating(false);
          setLoaded(true);
        }
      },
      signOut: async () => {
        setSession(null);
        setUser(null);
        setAuthError(null);
        setAuthMessage('Signed out.');
        await AsyncStorage.removeItem(AUTH_SESSION_KEY);
      },
    }),
    [authError, authMessage, config, configured, isAuthenticating, loaded, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
