import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MAX_TIMER_COUNT, useAppSettings } from './settings-context';

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

export type CookTimerFinishedAlert = {
  id: string;
  timerId: number;
  timerName: string;
  completedAt: number;
};

type CookTimerContextValue = {
  completedEventCount: number;
  finishedTimerAlerts: CookTimerFinishedAlert[];
  isCookTimerOpen: boolean;
  openCookTimer: () => void;
  closeCookTimer: () => void;
  timers: CookTimerSlot[];
  dismissFinishedTimerAlert: (alertId: string) => void;
  updateTimerLabel: (id: number, label: string) => void;
  updateTimerDurationInput: (id: number, value: string) => void;
  toggleTimer: (id: number) => void;
  resetTimer: (id: number) => void;
  /** Sets an idle timer's duration (used by preset chips and the H/M/S stepper). */
  setTimerDurationMs: (id: number, durationMs: number) => void;
  /** Adds a timer slot by raising the "Number of timers" setting. */
  addTimer: () => void;
  /** Removes an idle or finished timer and lowers the "Number of timers" setting. */
  removeTimer: (id: number) => void;
  loadTimerSlot: (label: string, durationMs: number) => boolean;
};

/** Duration fields for an idle slot, pre-filled from the "Default timer duration" setting (0 = empty). */
function defaultDurationFields(minutes: number) {
  const durationMs = minutes * 60 * 1000;
  return {
    durationInput: minutes > 0 ? msToTimerInput(durationMs) : '',
    durationMs,
    remainingMs: durationMs,
  };
}

function makeTimerSlot(id: number, defaultMinutes: number): CookTimerSlot {
  return {
    id,
    label: '',
    ...defaultDurationFields(defaultMinutes),
    endAt: null,
    active: false,
    hasStarted: false,
  };
}

function makeTimers(count: number, defaultMinutes: number): CookTimerSlot[] {
  return Array.from({ length: count }, (_, i) => makeTimerSlot(i + 1, defaultMinutes));
}

const CookTimerContext = createContext<CookTimerContextValue | undefined>(undefined);

function msToTimerInput(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  if (seconds > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  return String(minutes);
}

function parseDurationInput(value: string) {
  const trimmed = value.trim().replace(/\./g, ':');

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

/** Running or paused mid-way; finished and reset timers are not locked. */
export function isTimerLocked(timer: CookTimerSlot) {
  return timer.active || (timer.hasStarted && timer.remainingMs > 0);
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
  const { timerCount, defaultTimerMinutes, setTimerCount } = useAppSettings();
  const [completedEventCount, setCompletedEventCount] = useState(0);
  const [finishedTimerAlerts, setFinishedTimerAlerts] = useState<CookTimerFinishedAlert[]>([]);
  const [isCookTimerOpen, setIsCookTimerOpen] = useState(false);
  const [timers, setTimers] = useState<CookTimerSlot[]>(() => makeTimers(timerCount, defaultTimerMinutes));
  const previousDefaultMinutesRef = useRef(defaultTimerMinutes);

  useEffect(() => {
    setTimers((current) => {
      if (current.length === timerCount) {
        return current;
      }

      if (timerCount > current.length) {
        const nextId = current.length > 0 ? Math.max(...current.map((t) => t.id)) + 1 : 1;
        const newSlots: CookTimerSlot[] = Array.from({ length: timerCount - current.length }, (_, i) =>
          makeTimerSlot(nextId + i, defaultTimerMinutes)
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
    // Only the count should trigger this; new slots read the current default when created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerCount]);

  // When the default duration changes, update idle slots that are empty or still hold the old default.
  useEffect(() => {
    const previousInput = defaultDurationFields(previousDefaultMinutesRef.current).durationInput;
    previousDefaultMinutesRef.current = defaultTimerMinutes;
    const nextFields = defaultDurationFields(defaultTimerMinutes);

    setTimers((current) =>
      current.map((timer) =>
        !timer.active &&
        !timer.hasStarted &&
        (timer.durationInput === '' || timer.durationInput === previousInput)
          ? { ...timer, ...nextFields }
          : timer
      )
    );
  }, [defaultTimerMinutes]);

  useEffect(() => {
    const hasActiveTimers = timers.some((timer) => timer.active);

    if (!hasActiveTimers) {
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const completedTimers = timers.filter(
        (timer) => timer.active && timer.endAt && Math.max(0, timer.endAt - now) === 0
      );

      setTimers((current) =>
        current.map((timer) => {
          if (!timer.active || !timer.endAt) {
            return timer;
          }

          const nextRemaining = Math.max(0, timer.endAt - now);

          if (nextRemaining === 0) {
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

      if (completedTimers.length > 0) {
        setCompletedEventCount((current) => current + completedTimers.length);
        setFinishedTimerAlerts((current) => [
          ...current,
          ...completedTimers.map((timer, index) => ({
            id: `${timer.id}-${now}-${index}`,
            timerId: timer.id,
            // Fall back to the on-screen position so names stay right after deletes.
            timerName: timer.label.trim() || `Timer ${timers.indexOf(timer) + 1}`,
            completedAt: now,
          })),
        ]);
      }
    }, 200);

    return () => clearInterval(intervalId);
  }, [timers]);

  const value = useMemo<CookTimerContextValue>(
    () => ({
      completedEventCount,
      finishedTimerAlerts,
      isCookTimerOpen,
      openCookTimer: () => setIsCookTimerOpen(true),
      closeCookTimer: () => setIsCookTimerOpen(false),
      timers,
      dismissFinishedTimerAlert: (alertId: string) => {
        setFinishedTimerAlerts((current) => current.filter((alert) => alert.id !== alertId));
      },
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
        setFinishedTimerAlerts((current) => current.filter((alert) => alert.timerId !== id));
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
      setTimerDurationMs: (id: number, durationMs: number) => {
        const nextMs = Math.max(0, Math.round(durationMs));
        setTimers((current) =>
          current.map((timer) =>
            timer.id === id && !timer.active
              ? {
                  ...timer,
                  durationInput: nextMs > 0 ? msToTimerInput(nextMs) : '',
                  durationMs: nextMs,
                  remainingMs: nextMs,
                  hasStarted: false,
                }
              : timer
          )
        );
      },
      addTimer: () => {
        if (timers.length < MAX_TIMER_COUNT) {
          // The [timerCount] effect appends the new slot.
          setTimerCount(timers.length + 1);
        }
      },
      removeTimer: (id: number) => {
        const target = timers.find((timer) => timer.id === id);
        if (!target || timers.length <= 1 || isTimerLocked(target)) {
          return;
        }

        setFinishedTimerAlerts((current) => current.filter((alert) => alert.timerId !== id));
        setTimers((current) => current.filter((timer) => timer.id !== id));
        // Lengths now match, so the [timerCount] effect leaves the list alone.
        setTimerCount(timers.length - 1);
      },
      loadTimerSlot: (label: string, durationMs: number) => {
        const target =
          timers.find((t) => !t.active && !t.hasStarted) ?? timers.find((t) => !t.active);
        if (!target) return false;

        const input = msToTimerInput(durationMs);
        setTimers((current) =>
          current.map((t) =>
            t.id === target.id
              ? { ...t, label, durationInput: input, durationMs, remainingMs: durationMs }
              : t
          )
        );
        return true;
      },
    }),
    [completedEventCount, finishedTimerAlerts, isCookTimerOpen, setTimerCount, timers]
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
