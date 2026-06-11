import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

export const MAX_RATING = 5;

type RatingsContextValue = {
  ratings: Record<string, number>;
  getRating: (slug: string) => number;
  setRating: (slug: string, value: number) => void;
  clearRating: (slug: string) => void;
  loaded: boolean;
};

const RATINGS_KEY = 'kitchen-helper.recipe-ratings';

const RatingsContext = createContext<RatingsContextValue | undefined>(undefined);

function clampRating(value: number) {
  return Math.max(0, Math.min(MAX_RATING, Math.round(value)));
}

export function RatingsProvider({ children }: PropsWithChildren) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(RATINGS_KEY)
      .then((value) => {
        if (!active) {
          return;
        }

        if (!value) {
          setLoaded(true);
          return;
        }

        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const next: Record<string, number> = {};
            for (const [slug, rating] of Object.entries(parsed as Record<string, unknown>)) {
              if (typeof rating === 'number' && rating > 0) {
                next[slug] = clampRating(rating);
              }
            }
            setRatings(next);
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

  const value = useMemo<RatingsContextValue>(
    () => ({
      ratings,
      loaded,
      getRating: (slug: string) => ratings[slug] ?? 0,
      setRating: (slug: string, rating: number) => {
        const clamped = clampRating(rating);

        setRatings((current) => {
          const next = { ...current };

          if (clamped <= 0) {
            delete next[slug];
          } else {
            next[slug] = clamped;
          }

          AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
      clearRating: (slug: string) => {
        setRatings((current) => {
          if (!(slug in current)) {
            return current;
          }

          const next = { ...current };
          delete next[slug];
          AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
    }),
    [ratings, loaded]
  );

  return <RatingsContext.Provider value={value}>{children}</RatingsContext.Provider>;
}

export function useRatings() {
  const context = useContext(RatingsContext);

  if (!context) {
    throw new Error('useRatings must be used inside RatingsProvider');
  }

  return context;
}
