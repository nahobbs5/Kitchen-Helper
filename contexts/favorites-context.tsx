import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

type FavoritesContextValue = {
  favoriteSlugs: string[];
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
  favoriteRecipes: (slugs: string[]) => void;
  loaded: boolean;
};

const FAVORITES_KEY = 'kitchen-helper.favorite-recipes';

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(FAVORITES_KEY)
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
          setFavoriteSlugs(Array.isArray(parsed) ? parsed : []);
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

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteSlugs,
      loaded,
      isFavorite: (slug: string) => favoriteSlugs.includes(slug),
      toggleFavorite: (slug: string) => {
        setFavoriteSlugs((current) => {
          const next = current.includes(slug)
            ? current.filter((entry) => entry !== slug)
            : [...current, slug];

          AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
      favoriteRecipes: (slugs: string[]) => {
        if (slugs.length === 0) {
          return;
        }

        setFavoriteSlugs((current) => {
          const next = [...new Set([...current, ...slugs])];
          AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
    }),
    [favoriteSlugs, loaded]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }

  return context;
}
