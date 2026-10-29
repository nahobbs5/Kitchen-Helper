import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  emptyRecipeFilters,
  type RecipeFilterKind,
  type RecipeFilterScope,
  type RecipeFilterState,
} from '../utils/recipe-filters';

type ScopeState = { filters: RecipeFilterState; searchText: string };

type RecipeFiltersContextValue = {
  states: Record<RecipeFilterScope, ScopeState>;
  update: (scope: RecipeFilterScope, updater: (current: ScopeState) => ScopeState) => void;
};

const initialScopeState: ScopeState = { filters: emptyRecipeFilters, searchText: '' };

const RecipeFiltersContext = createContext<RecipeFiltersContextValue | null>(null);

// Filter state lives here (not in each screen) so the separate Filters page can read and apply it.
export function RecipeFiltersProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<RecipeFilterScope, ScopeState>>({
    'my-recipes': initialScopeState,
    'sample-recipes': initialScopeState,
  });

  const update = useCallback(
    (scope: RecipeFilterScope, updater: (current: ScopeState) => ScopeState) => {
      setStates((current) => ({ ...current, [scope]: updater(current[scope]) }));
    },
    []
  );

  const value = useMemo(() => ({ states, update }), [states, update]);

  return <RecipeFiltersContext.Provider value={value}>{children}</RecipeFiltersContext.Provider>;
}

export function useRecipeFilters(scope: RecipeFilterScope) {
  const context = useContext(RecipeFiltersContext);

  if (!context) {
    throw new Error('useRecipeFilters must be used inside RecipeFiltersProvider');
  }

  const { states, update } = context;
  const { filters, searchText } = states[scope];

  const setFilters = useCallback(
    (next: RecipeFilterState | ((current: RecipeFilterState) => RecipeFilterState)) => {
      update(scope, (current) => ({
        ...current,
        filters: typeof next === 'function' ? next(current.filters) : next,
      }));
    },
    [scope, update]
  );

  const setSearchText = useCallback(
    (text: string) => update(scope, (current) => ({ ...current, searchText: text })),
    [scope, update]
  );

  const removeFilter = useCallback(
    (kind: RecipeFilterKind, value?: string) => {
      setFilters((current) => {
        switch (kind) {
          case 'category':
            return { ...current, categories: current.categories.filter((item) => item !== value) };
          case 'cuisine':
            return { ...current, cuisines: current.cuisines.filter((item) => item !== value) };
          case 'dietary':
            return { ...current, dietaryTags: current.dietaryTags.filter((item) => item !== value) };
          case 'rating':
            return { ...current, ratingActive: false };
        }
      });
    },
    [setFilters]
  );

  const clearAll = useCallback(
    () => setFilters((current) => ({ ...emptyRecipeFilters, ratingThreshold: current.ratingThreshold })),
    [setFilters]
  );

  return { filters, setFilters, searchText, setSearchText, removeFilter, clearAll };
}
