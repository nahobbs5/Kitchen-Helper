import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useAppSettings } from './settings-context';

export type CookTimerSlot = {
  id: number;
  label: string;
  durationInput: string;
  durationMs: number;
  remainingMs: number;
  endAt: number | null;
  active: boolean;
  hasStarted: boolean;
};

type CookTimerContextValue = {
  completedEventCount: number;
  isCookTimerOpen: boolean;
  openCookTimer: () => void;
  closeCookTimer: () => void;
  timers: CookTimerSlot[];
  updateTimerLabel: (id: number, label: string) => void;
  updateTimerDurationInput: (id: number, value: string) => void;
  toggleTimer: (id: number) => void;
  resetTimer: (id: number) => void;
};

function makeTimers(count: number): CookTimerSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    label: '',
    durationInput: '',
    durationMs: 0,
    remainingMs: 0,
    endAt: null,
    active: false,
    hasStarted: false,
  }));
}

const CookTimerContext = createContext<CookTimerContextValue | undefined>(undefined);

function parseDurationInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
  }

  if (trimmed.includes(':')) {
    const parts = trimmed
      .split(':')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => Number(part));

    if (parts.some((part) => Number.isNaN(part))) {
      return 0;
    }

    if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return Math.max(0, ((minutes * 60) + seconds) * 1000);
    }

    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return Math.max(0, (((hours * 60 * 60) + (minutes * 60) + seconds) * 1000));
    }

    return 0;
  }

  const minutes = Number(trimmed);

  if (Number.isNaN(minutes) || minutes <= 0) {
    return 0;
  }

  return Math.round(minutes * 60 * 1000);
}

export function formatTimerRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function CookTimerProvider({ children }: PropsWithChildren) {
  const { timerCount } = useAppSettings();
  const [completedEventCount, setCompletedEventCount] = useState(0);
  const [isCookTimerOpen, setIsCookTimerOpen] = useState(false);
  const [timers, setTimers] = useState<CookTimerSlot[]>(() => makeTimers(timerCount));

  useEffect(() => {
    setTimers((current) => {
      if (current.length === timerCount) {
        return current;
      }

      if (timerCount > current.length) {
        const nextId = current.length > 0 ? Math.max(...current.map((t) => t.id)) + 1 : 1;
        const newSlots: CookTimerSlot[] = Array.from(
          { length: timerCount - current.length },
          (_, i) => ({
            id: nextId + i,
            label: '',
            durationInput: '',
            durationMs: 0,
            remainingMs: 0,
            endAt: null,
            active: false,
            hasStarted: false,
          })
        );
        return [...current, ...newSlots];
      }

      // Trim from the end, preserving active or started slots
      let result = [...current];
      while (result.length > timerCount) {
        const last = result[result.length - 1];
        if (!last.active && !last.hasStarted) {
          result = result.slice(0, -1);
        } else {
          break;
        }
      }
      return result;
    });
  }, [timerCount]);

  useEffect(() => {
    const hasActiveTimers = timers.some((timer) => timer.active);

    if (!hasActiveTimers) {
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      let completedThisTick = 0;

      setTimers((current) =>
        current.map((timer) => {
          if (!timer.active || !timer.endAt) {
            return timer;
          }

          const nextRemaining = Math.max(0, timer.endAt - now);

          if (nextRemaining === 0) {
            completedThisTick += 1;

            return {
              ...timer,
              active: false,
              endAt: null,
              remainingMs: 0,
            };
          }

          return {
            ...timer,
            remainingMs: nextRemaining,
          };
        })
      );

      if (completedThisTick > 0) {
        setCompletedEventCount((current) => current + completedThisTick);
      }
    }, 200);

    return () => clearInterval(intervalId);
  }, [timers]);

  const value = useMemo<CookTimerContextValue>(
    () => ({
      completedEventCount,
      isCookTimerOpen,
      openCookTimer: () => setIsCookTimerOpen(true),
      closeCookTimer: () => setIsCookTimerOpen(false),
      timers,
      updateTimerLabel: (id: number, label: string) => {
        setTimers((current) =>
          current.map((timer) => (timer.id === id ? { ...timer, label } : timer))
        );
      },
      updateTimerDurationInput: (id: number, value: string) => {
        const durationMs = parseDurationInput(value);

        setTimers((current) =>
          current.map((timer) =>
            timer.id === id
              ? {
                  ...timer,
                  durationInput: value,
                  durationMs,
                  remainingMs: timer.active ? timer.remainingMs : durationMs,
                }
              : timer
          )
        );
      },
      toggleTimer: (id: number) => {
        const now = Date.now();

        setTimers((current) =>
          current.map((timer) => {
            if (timer.id !== id) {
              return timer;
            }

            if (timer.active) {
              return {
                ...timer,
                active: false,
                endAt: null,
                remainingMs: Math.max(0, (timer.endAt ?? now) - now),
              };
            }

            const nextRemaining = timer.remainingMs > 0 ? timer.remainingMs : timer.durationMs;

            if (nextRemaining <= 0) {
              return timer;
            }

            return {
              ...timer,
              active: true,
              endAt: now + nextRemaining,
              hasStarted: true,
              remainingMs: nextRemaining,
            };
          })
        );
      },
      resetTimer: (id: number) => {
        setTimers((current) =>
          current.map((timer) =>
            timer.id === id
              ? {
                  ...timer,
                  active: false,
                  hasStarted: false,
                  endAt: null,
                  remainingMs: timer.durationMs,
                }
              : timer
          )
        );
      },
    }),
    [completedEventCount, isCookTimerOpen, timers]
  );

  return <CookTimerContext.Provider value={value}>{children}</CookTimerContext.Provider>;
}

export function useCookTimer() {
  const context = useContext(CookTimerContext);

  if (!context) {
    throw new Error('useCookTimer must be used inside CookTimerProvider');
  }

  return context;
}
