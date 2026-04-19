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

import { useAuth } from './auth-context';
import { obsidianRecipeMap, type RecipeSection } from '../data/obsidian-recipes';
import {
  allergenTagOptions,
  allergyFriendlyTagOptions,
  ensureAllergenTag,
  ensureFriendlyTag,
  inferRecipeTags,
} from '../utils/allergen-tags';
import {
  fetchSyncSnapshot,
  getSyncConfig,
  type SyncedRecipeOverrideRecord,
  type SyncedUserRecipeRecord,
  upsertRecipeOverrides,
  upsertUserRecipes,
} from '../utils/supabase-sync';
import {
  buildDirectionStepOverrides,
  replaceDirectionStepText,
  toDirectionSections,
} from '../utils/scaled-directions';

export type RecipeSource = {
  websiteName: string | null;
  author: string | null;
  url: string | null;
} | null;

export type UserRecipe = {
  id: string;
  userId: string;
  syncStatus: 'local' | 'synced';
  slug: string;
  title: string;
  category: string;
  source: 'App Storage';
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  allergyFriendlyTags: string[];
  allergenTags: string[];
  ingredients: RecipeSection[];
  originalDirections: RecipeSection[];
  directions: RecipeSection[];
  directionStepOverrides: Record<string, string>;
  notes: string | null;
  cuisineRegion: string | null;
  sourceInfo: RecipeSource;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type NewUserRecipeInput = {
  category: string;
  title: string;
  ingredientsText: string;
  directionsText: string;
  notes?: string;
  cuisineRegion?: string | null;
  sourceInfo?: RecipeSource;
  allergyFriendlyTags?: string[];
  allergenTags?: string[];
};

type BulkRecipeMetadataInput = {
  slugs: string[];
  category?: string | null;
  cuisineRegion?: string | null;
  applyCuisineRegion?: boolean;
  allergenTagsToAdd?: string[];
  allergyFriendlyTagsToAdd?: string[];
};

export type RecipeOverride = {
  id: string;
  userId: string;
  slug: string;
  title: string;
  category: string;
  allergyFriendlyTags: string[];
  allergenTags: string[];
  ingredients: RecipeSection[];
  directions: RecipeSection[];
  directionStepOverrides: Record<string, string>;
  notes: string | null;
  cuisineRegion: string | null;
  sourceInfo: RecipeSource;
  deleted: boolean;
  updatedAt: string;
};

type CustomRecipesContextValue = {
  customRecipes: UserRecipe[];
  customRecipeMap: Record<string, UserRecipe>;
  recipeOverrides: RecipeOverride[];
  recipeOverrideMap: Record<string, RecipeOverride>;
  lastDeletedRecipes: UserRecipe[];
  addRecipe: (input: NewUserRecipeInput) => Promise<UserRecipe | null>;
  updateRecipe: (
    slug: string,
    input: NewUserRecipeInput,
    source: 'custom' | 'obsidian'
  ) => Promise<UserRecipe | RecipeOverride | null>;
  bulkUpdateRecipeMetadata: (input: BulkRecipeMetadataInput) => Promise<void>;
  updateDirectionStep: (
    slug: string,
    stepId: string,
    text: string,
    source: 'custom' | 'obsidian'
  ) => Promise<void>;
  resetDirectionStep: (
    slug: string,
    stepId: string,
    source: 'custom' | 'obsidian'
  ) => Promise<void>;
  deleteRecipe: (slug: string, source?: 'custom' | 'obsidian') => Promise<void>;
  deleteRecipes: (slugs: string[]) => Promise<void>;
  restoreDeletedRecipes: () => Promise<void>;
  clearDeletedRecipes: () => void;
  loaded: boolean;
  syncConfigured: boolean;
  syncEnabled: boolean;
  syncBusy: boolean;
  syncError: string | null;
  refreshSync: () => Promise<void>;
  clearSyncError: () => void;
};

const LEGACY_CUSTOM_RECIPES_KEY = 'kitchen-helper.custom-recipes';
const LEGACY_RECIPE_OVERRIDES_KEY = 'kitchen-helper.recipe-overrides';
const LOCAL_USER_ID = 'local';

const CustomRecipesContext = createContext<CustomRecipesContextValue | undefined>(undefined);

const syncConfig = getSyncConfig();

function cacheCustomRecipesKey(userId: string) {
  return `kitchen-helper.sync-cache.custom-recipes.${userId}`;
}

function cacheRecipeOverridesKey(userId: string) {
  return `kitchen-helper.sync-cache.recipe-overrides.${userId}`;
}

function normalizeSource(
  source: unknown,
  legacy?: { sourceWebsite?: unknown; sourceAuthor?: unknown; sourceUrl?: unknown }
): RecipeSource {
  if (source && typeof source === 'object') {
    const record = source as Record<string, unknown>;
    const websiteName =
      typeof record.websiteName === 'string' && record.websiteName.trim()
        ? record.websiteName.trim()
        : null;
    const author =
      typeof record.author === 'string' && record.author.trim() ? record.author.trim() : null;
    const url = typeof record.url === 'string' && record.url.trim() ? record.url.trim() : null;

    return websiteName || author || url ? { websiteName, author, url } : null;
  }

  const websiteName =
    typeof legacy?.sourceWebsite === 'string' && legacy.sourceWebsite.trim()
      ? legacy.sourceWebsite.trim()
      : null;
  const author =
    typeof legacy?.sourceAuthor === 'string' && legacy.sourceAuthor.trim()
      ? legacy.sourceAuthor.trim()
      : null;
  const url =
    typeof legacy?.sourceUrl === 'string' && legacy.sourceUrl.trim() ? legacy.sourceUrl.trim() : null;

  return websiteName || author || url ? { websiteName, author, url } : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function createId(prefix: string) {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return `${prefix}-${randomUuid}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toSection(text: string): RecipeSection[] {
  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return items.length > 0 ? [{ title: null, items }] : [];
}

function normalizeCustomRecipe(recipe: unknown): UserRecipe {
  const record = recipe as Record<string, unknown>;
  const createdAt =
    typeof record.createdAt === 'string' && record.createdAt ? record.createdAt : new Date().toISOString();
  const updatedAt =
    typeof record.updatedAt === 'string' && record.updatedAt ? record.updatedAt : createdAt;

  return {
    id: typeof record.id === 'string' && record.id ? record.id : createId('recipe'),
    userId: typeof record.userId === 'string' ? record.userId : '',
    syncStatus:
      record.syncStatus === 'synced' || record.syncStatus === 'local'
        ? record.syncStatus
        : typeof record.userId === 'string' && record.userId && record.userId !== LOCAL_USER_ID
          ? 'synced'
          : 'local',
    slug: typeof record.slug === 'string' ? record.slug : slugify(String(record.title ?? 'recipe')),
    title: typeof record.title === 'string' ? record.title : 'Untitled Recipe',
    category: typeof record.category === 'string' ? record.category : 'Entree',
    source: 'App Storage',
    prepTime: typeof record.prepTime === 'string' ? record.prepTime : null,
    cookTime: typeof record.cookTime === 'string' ? record.cookTime : null,
    totalTime: typeof record.totalTime === 'string' ? record.totalTime : null,
    servings: typeof record.servings === 'string' ? record.servings : null,
    allergyFriendlyTags: Array.isArray(record.allergyFriendlyTags)
      ? (record.allergyFriendlyTags as string[])
      : [],
    allergenTags: Array.isArray(record.allergenTags) ? (record.allergenTags as string[]) : [],
    ingredients: Array.isArray(record.ingredients) ? (record.ingredients as RecipeSection[]) : [],
    originalDirections: Array.isArray(record.originalDirections)
      ? (record.originalDirections as RecipeSection[])
      : Array.isArray(record.directions)
        ? (record.directions as RecipeSection[])
        : [],
    directions: Array.isArray(record.directions) ? (record.directions as RecipeSection[]) : [],
    directionStepOverrides:
      record.directionStepOverrides && typeof record.directionStepOverrides === 'object'
        ? (record.directionStepOverrides as Record<string, string>)
        : {},
    notes: typeof record.notes === 'string' ? record.notes : null,
    cuisineRegion: typeof record.cuisineRegion === 'string' ? record.cuisineRegion : null,
    sourceInfo: normalizeSource(record.sourceInfo, record),
    createdAt,
    updatedAt,
    deletedAt: typeof record.deletedAt === 'string' ? record.deletedAt : null,
  };
}

function normalizeRecipeOverride(recipe: unknown): RecipeOverride {
  const record = recipe as Record<string, unknown>;

  return {
    id:
      typeof record.id === 'string' && record.id
        ? record.id
        : `override-${typeof record.slug === 'string' ? record.slug : createId('override')}`,
    userId: typeof record.userId === 'string' ? record.userId : '',
    slug: typeof record.slug === 'string' ? record.slug : '',
    title: typeof record.title === 'string' ? record.title : 'Untitled Recipe',
    category: typeof record.category === 'string' ? record.category : 'Entree',
    allergyFriendlyTags: Array.isArray(record.allergyFriendlyTags)
      ? (record.allergyFriendlyTags as string[])
      : [],
    allergenTags: Array.isArray(record.allergenTags) ? (record.allergenTags as string[]) : [],
    ingredients: Array.isArray(record.ingredients) ? (record.ingredients as RecipeSection[]) : [],
    directions: Array.isArray(record.directions) ? (record.directions as RecipeSection[]) : [],
    directionStepOverrides:
      record.directionStepOverrides && typeof record.directionStepOverrides === 'object'
        ? (record.directionStepOverrides as Record<string, string>)
        : {},
    notes: typeof record.notes === 'string' ? record.notes : null,
    cuisineRegion: typeof record.cuisineRegion === 'string' ? record.cuisineRegion : null,
    sourceInfo: normalizeSource(record.sourceInfo, record),
    deleted: Boolean(record.deleted),
    updatedAt:
      typeof record.updatedAt === 'string' && record.updatedAt ? record.updatedAt : new Date().toISOString(),
  };
}

function mapSyncedUserRecipe(record: SyncedUserRecipeRecord): UserRecipe {
  return {
    id: record.id,
    userId: record.user_id,
    slug: record.slug,
    title: record.title,
    category: record.category,
    source: 'App Storage',
    syncStatus: 'synced',
    prepTime: record.prep_time,
    cookTime: record.cook_time,
    totalTime: record.total_time,
    servings: record.servings,
    allergyFriendlyTags: record.allergy_friendly_tags ?? [],
    allergenTags: record.allergen_tags ?? [],
    ingredients: record.ingredients ?? [],
    originalDirections: record.original_directions ?? [],
    directions: record.directions ?? [],
    directionStepOverrides: record.direction_step_overrides ?? {},
    notes: record.notes,
    cuisineRegion: record.cuisine_region,
    sourceInfo: normalizeSource(record.source_info),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    deletedAt: record.deleted_at,
  };
}

function mapSyncedRecipeOverride(record: SyncedRecipeOverrideRecord): RecipeOverride {
  return {
    id: record.id,
    userId: record.user_id,
    slug: record.slug,
    title: record.title,
    category: record.category,
    allergyFriendlyTags: record.allergy_friendly_tags ?? [],
    allergenTags: record.allergen_tags ?? [],
    ingredients: record.ingredients ?? [],
    directions: record.directions ?? [],
    directionStepOverrides: record.direction_step_overrides ?? {},
    notes: record.notes,
    cuisineRegion: record.cuisine_region,
    sourceInfo: normalizeSource(record.source_info),
    deleted: record.deleted,
    updatedAt: record.updated_at,
  };
}

function toSyncedUserRecipeRecord(recipe: UserRecipe): SyncedUserRecipeRecord {
  return {
    id: recipe.id,
    user_id: recipe.userId,
    slug: recipe.slug,
    title: recipe.title,
    category: recipe.category,
    source: recipe.source,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    total_time: recipe.totalTime,
    servings: recipe.servings,
    allergy_friendly_tags: recipe.allergyFriendlyTags,
    allergen_tags: recipe.allergenTags,
    ingredients: recipe.ingredients,
    original_directions: recipe.originalDirections,
    directions: recipe.directions,
    direction_step_overrides: recipe.directionStepOverrides,
    notes: recipe.notes,
    cuisine_region: recipe.cuisineRegion,
    source_info: recipe.sourceInfo,
    created_at: recipe.createdAt,
    updated_at: recipe.updatedAt,
    deleted_at: recipe.deletedAt,
  };
}

function toSyncedRecipeOverrideRecord(recipe: RecipeOverride): SyncedRecipeOverrideRecord {
  return {
    id: recipe.id,
    user_id: recipe.userId,
    slug: recipe.slug,
    title: recipe.title,
    category: recipe.category,
    allergy_friendly_tags: recipe.allergyFriendlyTags,
    allergen_tags: recipe.allergenTags,
    ingredients: recipe.ingredients,
    directions: recipe.directions,
    direction_step_overrides: recipe.directionStepOverrides,
    notes: recipe.notes,
    cuisine_region: recipe.cuisineRegion,
    source_info: recipe.sourceInfo,
    deleted: recipe.deleted,
    updated_at: recipe.updatedAt,
  };
}

function mergeById<T extends { id: string }>(current: T[], updates: T[]) {
  const nextMap = new Map(current.map((item) => [item.id, item]));
  updates.forEach((item) => {
    nextMap.set(item.id, item);
  });
  return Array.from(nextMap.values());
}

function sortUserRecipes(recipes: UserRecipe[]) {
  return [...recipes].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function shouldReplaceRecipe(existing: UserRecipe, incoming: UserRecipe) {
  if (existing.syncStatus === 'local' && incoming.syncStatus === 'synced') {
    return new Date(incoming.updatedAt).getTime() >= new Date(existing.updatedAt).getTime();
  }

  if (existing.syncStatus === 'synced' && incoming.syncStatus === 'local') {
    return false;
  }

  return new Date(incoming.updatedAt).getTime() >= new Date(existing.updatedAt).getTime();
}

function mergeUserRecipes(...groups: UserRecipe[][]) {
  const merged: UserRecipe[] = [];
  const byId = new Map<string, UserRecipe>();
  const bySlug = new Map<string, UserRecipe>();

  groups.flat().forEach((incoming) => {
    const existing = byId.get(incoming.id) ?? bySlug.get(incoming.slug);

    if (!existing) {
      merged.push(incoming);
      byId.set(incoming.id, incoming);
      bySlug.set(incoming.slug, incoming);
      return;
    }

    if (!shouldReplaceRecipe(existing, incoming)) {
      return;
    }

    const index = merged.indexOf(existing);
    if (index >= 0) {
      merged[index] = incoming;
    }

    byId.delete(existing.id);
    bySlug.delete(existing.slug);
    byId.set(incoming.id, incoming);
    bySlug.set(incoming.slug, incoming);
  });

  return sortUserRecipes(merged);
}

function mergeRecipeOverrides(...groups: RecipeOverride[][]) {
  const merged = new Map<string, RecipeOverride>();

  groups.flat().forEach((incoming) => {
    const existing = merged.get(incoming.slug);

    if (!existing || new Date(incoming.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      merged.set(incoming.slug, incoming);
    }
  });

  return Array.from(merged.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function normalizeError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export function CustomRecipesProvider({ children }: PropsWithChildren) {
  const { configured: authConfigured, loaded: authLoaded, session, user } = useAuth();
  const [customRecipes, setCustomRecipes] = useState<UserRecipe[]>([]);
  const [recipeOverrides, setRecipeOverrides] = useState<RecipeOverride[]>([]);
  const [lastDeletedRecipes, setLastDeletedRecipes] = useState<UserRecipe[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const customRecipesRef = useRef<UserRecipe[]>([]);
  const recipeOverridesRef = useRef<RecipeOverride[]>([]);
  const lastDeletedRecipesRef = useRef<UserRecipe[]>([]);

  const syncConfigured = authConfigured && Boolean(syncConfig);
  const syncEnabled = Boolean(syncConfigured && session?.accessToken && user?.id);
  const activeUserId = user?.id ?? LOCAL_USER_ID;

  useEffect(() => {
    customRecipesRef.current = customRecipes;
  }, [customRecipes]);

  useEffect(() => {
    recipeOverridesRef.current = recipeOverrides;
  }, [recipeOverrides]);

  useEffect(() => {
    lastDeletedRecipesRef.current = lastDeletedRecipes;
  }, [lastDeletedRecipes]);

  async function persistLocalCache(nextCustomRecipes: UserRecipe[], nextRecipeOverrides: RecipeOverride[]) {
    await AsyncStorage.multiSet([
      [LEGACY_CUSTOM_RECIPES_KEY, JSON.stringify(nextCustomRecipes)],
      [LEGACY_RECIPE_OVERRIDES_KEY, JSON.stringify(nextRecipeOverrides)],
    ]);
  }

  async function persistCache(nextCustomRecipes: UserRecipe[], nextRecipeOverrides: RecipeOverride[]) {
    await persistLocalCache(nextCustomRecipes, nextRecipeOverrides);

    if (!user?.id) {
      return;
    }

    await AsyncStorage.multiSet([
      [cacheCustomRecipesKey(user.id), JSON.stringify(nextCustomRecipes)],
      [cacheRecipeOverridesKey(user.id), JSON.stringify(nextRecipeOverrides)],
    ]);
  }

  async function applyRemoteSnapshot() {
    if (!syncConfig || !session?.accessToken || !user?.id) {
      return;
    }

    const snapshot = await fetchSyncSnapshot(syncConfig, session.accessToken, user.id);
    const syncedCustomRecipes = snapshot.customRecipes.map(mapSyncedUserRecipe);
    const syncedRecipeOverrides = snapshot.recipeOverrides.map(mapSyncedRecipeOverride);
    const syncedPending = await syncPendingLocalData(
      customRecipesRef.current,
      recipeOverridesRef.current,
      syncedCustomRecipes,
      syncedRecipeOverrides
    );
    const mergedCustomRecipes = mergeUserRecipes(
      customRecipesRef.current,
      syncedCustomRecipes,
      syncedPending.customRecipes
    );
    const mergedRecipeOverrides = mergeRecipeOverrides(
      recipeOverridesRef.current,
      syncedRecipeOverrides,
      syncedPending.recipeOverrides
    );

    setCustomRecipes(mergedCustomRecipes);
    setRecipeOverrides(mergedRecipeOverrides);
    await persistCache(mergedCustomRecipes, mergedRecipeOverrides);
    setSyncError(null);
  }

  async function refreshSync() {
    if (!syncEnabled || syncBusy) {
      return;
    }

    setSyncBusy(true);

    try {
      await applyRemoteSnapshot();
    } catch (error) {
      setSyncError(normalizeError(error, 'Unable to refresh synced recipes.'));
    } finally {
      setSyncBusy(false);
    }
  }

  async function syncPendingLocalData(
    localCustomRecipes: UserRecipe[],
    localRecipeOverrides: RecipeOverride[],
    syncedCustomRecipes: UserRecipe[],
    syncedRecipeOverrides: RecipeOverride[]
  ) {
    if (!syncConfig || !session?.accessToken || !user?.id) {
      return {
        customRecipes: syncedCustomRecipes,
        recipeOverrides: syncedRecipeOverrides,
      };
    }

    const remoteOverrideBySlug = new Map(
      syncedRecipeOverrides.map((recipe) => [recipe.slug, recipe] as const)
    );

    const customUploads = localCustomRecipes
      .filter(
        (recipe) =>
          recipe.syncStatus !== 'synced' ||
          !recipe.userId ||
          recipe.userId === LOCAL_USER_ID
      )
      .map((recipe) =>
        toSyncedUserRecipeRecord({
          ...recipe,
          id: recipe.id || createId('recipe'),
          userId: user.id,
          updatedAt: recipe.updatedAt || recipe.createdAt,
          deletedAt: null,
        })
      );

    const overrideUploads = localRecipeOverrides
      .filter((recipe) => {
        const existing = remoteOverrideBySlug.get(recipe.slug);
        return !existing || new Date(recipe.updatedAt).getTime() > new Date(existing.updatedAt).getTime();
      })
      .map((recipe) =>
        toSyncedRecipeOverrideRecord({
          ...recipe,
          id: recipe.id || `override-${recipe.slug}`,
          userId: user.id,
        })
      );

    let uploadedCustomRecipes: UserRecipe[] = [];
    let uploadedRecipeOverrides: RecipeOverride[] = [];

    if (customUploads.length > 0) {
      const savedRecords = await upsertUserRecipes(syncConfig, session.accessToken, customUploads);
      uploadedCustomRecipes = savedRecords.map(mapSyncedUserRecipe);
    }

    if (overrideUploads.length > 0) {
      const savedRecords = await upsertRecipeOverrides(syncConfig, session.accessToken, overrideUploads);
      uploadedRecipeOverrides = savedRecords.map(mapSyncedRecipeOverride);
    }

    return {
      customRecipes: mergeUserRecipes(syncedCustomRecipes, uploadedCustomRecipes),
      recipeOverrides: mergeRecipeOverrides(syncedRecipeOverrides, uploadedRecipeOverrides),
    };
  }

  async function syncUserRecipesToRemote(recipes: UserRecipe[], fallback: string) {
    if (recipes.length === 0) {
      return recipes;
    }

    if (!syncConfig || !session?.accessToken || !user?.id) {
      return recipes;
    }

    setSyncBusy(true);

    try {
      const savedRecords = await upsertUserRecipes(
        syncConfig,
        session.accessToken,
        recipes.map((recipe) => toSyncedUserRecipeRecord({ ...recipe, userId: user.id }))
      );
      setSyncError(null);
      return savedRecords.length > 0 ? savedRecords.map(mapSyncedUserRecipe) : recipes;
    } catch (error) {
      setSyncError(normalizeError(error, fallback));
      return recipes;
    } finally {
      setSyncBusy(false);
    }
  }

  async function syncRecipeOverridesToRemote(recipes: RecipeOverride[], fallback: string) {
    if (recipes.length === 0) {
      return recipes;
    }

    if (!syncConfig || !session?.accessToken || !user?.id) {
      return recipes;
    }

    setSyncBusy(true);

    try {
      const savedRecords = await upsertRecipeOverrides(
        syncConfig,
        session.accessToken,
        recipes.map((recipe) => toSyncedRecipeOverrideRecord({ ...recipe, userId: user.id }))
      );
      setSyncError(null);
      return savedRecords.length > 0 ? savedRecords.map(mapSyncedRecipeOverride) : recipes;
    } catch (error) {
      setSyncError(normalizeError(error, fallback));
      return recipes;
    } finally {
      setSyncBusy(false);
    }
  }

  useEffect(() => {
    let active = true;

    if (!authLoaded) {
      return;
    }

    async function hydrate() {
      setSyncBusy(true);
      setLoaded(false);

      try {
        if (!syncEnabled || !user?.id) {
          const [localCustomValue, localOverridesValue] = await Promise.all([
            AsyncStorage.getItem(LEGACY_CUSTOM_RECIPES_KEY),
            AsyncStorage.getItem(LEGACY_RECIPE_OVERRIDES_KEY),
          ]);

          if (active) {
            setCustomRecipes(
              localCustomValue ? (JSON.parse(localCustomValue) as unknown[]).map(normalizeCustomRecipe) : []
            );
            setRecipeOverrides(
              localOverridesValue
                ? (JSON.parse(localOverridesValue) as unknown[]).map(normalizeRecipeOverride)
                : []
            );
            setLastDeletedRecipes([]);
            setLoaded(true);
          }
          return;
        }

        const userId = user.id;
        const accessToken = session?.accessToken;
        const currentSyncConfig = syncConfig;

        if (!currentSyncConfig || !accessToken) {
          return;
        }

        const [localCustomValue, localOverridesValue, cachedCustomValue, cachedOverridesValue] = await Promise.all([
          AsyncStorage.getItem(LEGACY_CUSTOM_RECIPES_KEY),
          AsyncStorage.getItem(LEGACY_RECIPE_OVERRIDES_KEY),
          AsyncStorage.getItem(cacheCustomRecipesKey(userId)),
          AsyncStorage.getItem(cacheRecipeOverridesKey(userId)),
        ]);

        const localCustomRecipes = localCustomValue
          ? (JSON.parse(localCustomValue) as unknown[]).map(normalizeCustomRecipe)
          : [];
        const localRecipeOverrides = localOverridesValue
          ? (JSON.parse(localOverridesValue) as unknown[]).map(normalizeRecipeOverride)
          : [];
        const cachedCustomRecipes = cachedCustomValue
          ? (JSON.parse(cachedCustomValue) as unknown[]).map(normalizeCustomRecipe)
          : [];
        const cachedRecipeOverrides = cachedOverridesValue
          ? (JSON.parse(cachedOverridesValue) as unknown[]).map(normalizeRecipeOverride)
          : [];
        const cachedMergedCustomRecipes = mergeUserRecipes(localCustomRecipes, cachedCustomRecipes);
        const cachedMergedRecipeOverrides = mergeRecipeOverrides(localRecipeOverrides, cachedRecipeOverrides);

        if (active) {
          setCustomRecipes(cachedMergedCustomRecipes);
          setRecipeOverrides(cachedMergedRecipeOverrides);
          setLoaded(true);
        }

        const snapshot = await fetchSyncSnapshot(currentSyncConfig, accessToken, userId);
        const remoteCustomRecipes = snapshot.customRecipes.map(mapSyncedUserRecipe);
        const remoteRecipeOverrides = snapshot.recipeOverrides.map(mapSyncedRecipeOverride);
        const syncedPending = await syncPendingLocalData(
          cachedMergedCustomRecipes,
          cachedMergedRecipeOverrides,
          remoteCustomRecipes,
          remoteRecipeOverrides
        );
        const mergedCustomRecipes = mergeUserRecipes(
          cachedMergedCustomRecipes,
          remoteCustomRecipes,
          syncedPending.customRecipes
        );
        const mergedRecipeOverrides = mergeRecipeOverrides(
          cachedMergedRecipeOverrides,
          remoteRecipeOverrides,
          syncedPending.recipeOverrides
        );

        if (active) {
          setCustomRecipes(mergedCustomRecipes);
          setRecipeOverrides(mergedRecipeOverrides);
        }

        await persistCache(mergedCustomRecipes, mergedRecipeOverrides);
        setSyncError(null);
      } catch (error) {
        if (active) {
          setSyncError(normalizeError(error, 'Unable to load synced recipes.'));
          setLoaded(true);
        }
      } finally {
        if (active) {
          setSyncBusy(false);
        }
      }
    }

    hydrate();

    return () => {
      active = false;
    };
  }, [authLoaded, syncEnabled, user?.id]);

  useEffect(() => {
    if (!syncEnabled) {
      return;
    }

    const intervalId = setInterval(() => {
      void refreshSync();
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [syncBusy, syncEnabled, session?.accessToken, user?.id]);

  const value = useMemo<CustomRecipesContextValue>(
    () => ({
      customRecipes,
      customRecipeMap: Object.fromEntries(customRecipes.map((recipe) => [recipe.slug, recipe])),
      recipeOverrides,
      recipeOverrideMap: Object.fromEntries(recipeOverrides.map((recipe) => [recipe.slug, recipe])),
      lastDeletedRecipes,
      loaded,
      syncConfigured,
      syncEnabled,
      syncBusy,
      syncError,
      refreshSync,
      clearSyncError: () => setSyncError(null),
      addRecipe: async (input: NewUserRecipeInput) => {
        try {
          const title = input.title.trim();
          const current = customRecipesRef.current;
          const baseSlug = slugify(title || 'recipe');
          let slug = baseSlug;
          let counter = 2;

          while (current.some((recipe) => recipe.slug === slug)) {
            slug = `${baseSlug}-${counter}`;
            counter += 1;
          }

          const inferredTags = inferRecipeTags({
            title,
            ingredientsText: input.ingredientsText,
            directionsText: input.directionsText,
            notes: input.notes,
          });
          const now = new Date().toISOString();
          const draftRecipe: UserRecipe = {
            id: createId('recipe'),
            userId: activeUserId,
            syncStatus: 'local',
            slug,
            title,
            category: input.category,
            source: 'App Storage',
            prepTime: null,
            cookTime: null,
            totalTime: null,
            servings: null,
            allergyFriendlyTags: input.allergyFriendlyTags ?? inferredTags.allergyFriendlyTags,
            allergenTags: input.allergenTags ?? inferredTags.allergenTags,
            ingredients: toSection(input.ingredientsText),
            originalDirections: toDirectionSections(input.directionsText),
            directions: toDirectionSections(input.directionsText),
            directionStepOverrides: {},
            notes: input.notes?.trim() ? input.notes.trim() : null,
            cuisineRegion: input.cuisineRegion?.trim() ? input.cuisineRegion.trim() : null,
            sourceInfo: normalizeSource(input.sourceInfo),
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
          };

          const nextCustomRecipes = [draftRecipe, ...current];
          setCustomRecipes(nextCustomRecipes);
          await persistCache(nextCustomRecipes, recipeOverridesRef.current);
          setSyncError(null);

          const [savedRecipe] = await syncUserRecipesToRemote([draftRecipe], 'Unable to sync the recipe.');

          if (
            savedRecipe.id !== draftRecipe.id ||
            savedRecipe.userId !== draftRecipe.userId ||
            savedRecipe.syncStatus !== draftRecipe.syncStatus
          ) {
            const syncedCustomRecipes = [savedRecipe, ...current];
            setCustomRecipes(syncedCustomRecipes);
            await persistCache(syncedCustomRecipes, recipeOverridesRef.current);
          }

          return savedRecipe;
        } catch (error) {
          setSyncError(normalizeError(error, 'Unable to save the recipe.'));
          return null;
        }
      },
      deleteRecipe: async (slug: string, source: 'custom' | 'obsidian' = 'custom') => {
        try {
          if (source === 'obsidian') {
            const currentOverrides = recipeOverridesRef.current;
            const baseRecipe = obsidianRecipeMap[slug];

            if (!baseRecipe) {
              return;
            }

            const existingOverride = currentOverrides.find((recipe) => recipe.slug === slug);
            const nextOverride: RecipeOverride = {
              id: existingOverride?.id ?? `override-${slug}`,
              userId: existingOverride?.userId ?? activeUserId,
              slug,
              title: existingOverride?.title ?? baseRecipe.title,
              category: existingOverride?.category ?? baseRecipe.category,
              allergyFriendlyTags:
                existingOverride?.allergyFriendlyTags ?? baseRecipe.allergyFriendlyTags,
              allergenTags: existingOverride?.allergenTags ?? baseRecipe.allergenTags,
              ingredients: existingOverride?.ingredients ?? baseRecipe.ingredients,
              directions: existingOverride?.directions ?? baseRecipe.directions,
              directionStepOverrides: existingOverride?.directionStepOverrides ?? {},
              notes: existingOverride?.notes ?? null,
              cuisineRegion: existingOverride?.cuisineRegion ?? null,
              sourceInfo: existingOverride?.sourceInfo ?? null,
              deleted: true,
              updatedAt: new Date().toISOString(),
            };

            const nextOverrides = [
              nextOverride,
              ...currentOverrides.filter((recipe) => recipe.slug !== slug),
            ];

            setRecipeOverrides(nextOverrides);
            await persistCache(customRecipesRef.current, nextOverrides);
            setSyncError(null);
            const [savedOverride] = await syncRecipeOverridesToRemote(
              [nextOverride],
              'Unable to sync the hidden recipe.'
            );

            if (savedOverride.id !== nextOverride.id || savedOverride.userId !== nextOverride.userId) {
              const syncedOverrides = [
                savedOverride,
                ...currentOverrides.filter((recipe) => recipe.slug !== slug),
              ];
              setRecipeOverrides(syncedOverrides);
              await persistCache(customRecipesRef.current, syncedOverrides);
            }
            return;
          }

          const currentCustomRecipes = customRecipesRef.current;
          const recipe = currentCustomRecipes.find((item) => item.slug === slug);

          if (!recipe) {
            return;
          }

          const deletedRecipe = {
            ...recipe,
            syncStatus: 'local' as const,
            updatedAt: new Date().toISOString(),
            deletedAt: new Date().toISOString(),
          };

          const nextCustomRecipes = currentCustomRecipes.filter((item) => item.slug !== slug);
          setCustomRecipes(nextCustomRecipes);
          setLastDeletedRecipes([recipe]);
          await persistCache(nextCustomRecipes, recipeOverridesRef.current);
          setSyncError(null);
          await syncUserRecipesToRemote([deletedRecipe], 'Unable to sync the deleted recipe.');
        } catch (error) {
          setSyncError(normalizeError(error, 'Unable to delete the recipe.'));
        }
      },
      deleteRecipes: async (slugs: string[]) => {
        if (slugs.length === 0) {
          return;
        }

        try {
          const currentCustomRecipes = customRecipesRef.current;
          const currentOverrides = recipeOverridesRef.current;
          const removedCustomRecipes = currentCustomRecipes.filter((recipe) => slugs.includes(recipe.slug));
          const deletedCustomRecipes = removedCustomRecipes.map((recipe) => ({
            ...recipe,
            syncStatus: 'local' as const,
            updatedAt: new Date().toISOString(),
            deletedAt: new Date().toISOString(),
          }));
          const obsidianOverrides = slugs
            .filter((slugValue) => !removedCustomRecipes.some((recipe) => recipe.slug === slugValue))
            .map((slugValue) => {
              const baseRecipe = obsidianRecipeMap[slugValue];

              if (!baseRecipe) {
                return null;
              }

              const existingOverride = currentOverrides.find((recipe) => recipe.slug === slugValue);

              return {
                id: existingOverride?.id ?? `override-${slugValue}`,
                userId: existingOverride?.userId ?? activeUserId,
                slug: slugValue,
                title: existingOverride?.title ?? baseRecipe.title,
                category: existingOverride?.category ?? baseRecipe.category,
                allergyFriendlyTags:
                  existingOverride?.allergyFriendlyTags ?? baseRecipe.allergyFriendlyTags,
                allergenTags: existingOverride?.allergenTags ?? baseRecipe.allergenTags,
                ingredients: existingOverride?.ingredients ?? baseRecipe.ingredients,
                directions: existingOverride?.directions ?? baseRecipe.directions,
                directionStepOverrides: existingOverride?.directionStepOverrides ?? {},
                notes: existingOverride?.notes ?? null,
                cuisineRegion: existingOverride?.cuisineRegion ?? null,
                sourceInfo: existingOverride?.sourceInfo ?? null,
                deleted: true,
                updatedAt: new Date().toISOString(),
              } satisfies RecipeOverride;
            })
            .filter(Boolean) as RecipeOverride[];

          const deletedOverrideSlugs = new Set(obsidianOverrides.map((recipe) => recipe.slug));
          const nextCustomRecipes = currentCustomRecipes.filter((recipe) => !slugs.includes(recipe.slug));
          const nextOverrides = [
            ...obsidianOverrides,
            ...currentOverrides.filter((recipe) => !deletedOverrideSlugs.has(recipe.slug)),
          ];

          setCustomRecipes(nextCustomRecipes);
          setRecipeOverrides(nextOverrides);
          setLastDeletedRecipes(removedCustomRecipes);
          await persistCache(nextCustomRecipes, nextOverrides);
          setSyncError(null);

          await Promise.all([
            deletedCustomRecipes.length > 0
              ? syncUserRecipesToRemote(deletedCustomRecipes, 'Unable to sync the deleted recipes.')
              : Promise.resolve([]),
            obsidianOverrides.length > 0
              ? syncRecipeOverridesToRemote(obsidianOverrides, 'Unable to sync the hidden recipes.')
              : Promise.resolve([]),
          ]);
        } catch (error) {
          setSyncError(normalizeError(error, 'Unable to delete the selected recipes.'));
        }
      },
      restoreDeletedRecipes: async () => {
        if (lastDeletedRecipesRef.current.length === 0) {
          return;
        }

        try {
          const restoredRecipes = lastDeletedRecipesRef.current.map((recipe) => ({
            ...recipe,
            userId: user?.id ?? recipe.userId ?? LOCAL_USER_ID,
            syncStatus: 'local' as const,
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          }));

          const nextCustomRecipes = mergeById(customRecipesRef.current, restoredRecipes).sort((left, right) =>
            right.createdAt.localeCompare(left.createdAt)
          );

          setCustomRecipes(nextCustomRecipes);
          setLastDeletedRecipes([]);
          await persistCache(nextCustomRecipes, recipeOverridesRef.current);
          setSyncError(null);

          const syncedRecipes = await syncUserRecipesToRemote(
            restoredRecipes,
            'Unable to sync the restored recipes.'
          );

          if (
            syncedRecipes.some(
              (recipe, index) =>
                recipe.id !== restoredRecipes[index]?.id ||
                recipe.syncStatus !== restoredRecipes[index]?.syncStatus
            )
          ) {
            const syncedCustomRecipes = mergeById(customRecipesRef.current, syncedRecipes).sort((left, right) =>
              right.createdAt.localeCompare(left.createdAt)
            );
            setCustomRecipes(syncedCustomRecipes);
            await persistCache(syncedCustomRecipes, recipeOverridesRef.current);
          }
        } catch (error) {
          setSyncError(normalizeError(error, 'Unable to restore deleted recipes.'));
        }
      },
      clearDeletedRecipes: () => {
        setLastDeletedRecipes([]);
      },
      updateRecipe: async (slug: string, input: NewUserRecipeInput, source: 'custom' | 'obsidian') => {
        try {
          const title = input.title.trim();
          const inferredTags = inferRecipeTags({
            title,
            ingredientsText: input.ingredientsText,
            directionsText: input.directionsText,
            notes: input.notes,
          });
          const ingredientsSection = toSection(input.ingredientsText);
          const directionsSection = toDirectionSections(input.directionsText);
          const notes = input.notes?.trim() ? input.notes.trim() : null;
          const cuisineRegion = input.cuisineRegion?.trim() ? input.cuisineRegion.trim() : null;
          const sourceInfo = normalizeSource(input.sourceInfo);
          const allergyFriendlyTags = input.allergyFriendlyTags ?? inferredTags.allergyFriendlyTags;
          const allergenTags = input.allergenTags ?? inferredTags.allergenTags;

          if (source === 'custom') {
            const currentCustomRecipes = customRecipesRef.current;
            const currentRecipe = currentCustomRecipes.find((recipe) => recipe.slug === slug);

            if (!currentRecipe) {
              return null;
            }

            const updatedRecipe: UserRecipe = {
              ...currentRecipe,
              userId: user?.id ?? currentRecipe.userId ?? LOCAL_USER_ID,
              syncStatus: 'local' as const,
              title,
              category: input.category,
              allergyFriendlyTags,
              allergenTags,
              ingredients: ingredientsSection,
              directionStepOverrides: buildDirectionStepOverrides(
                currentRecipe.originalDirections,
                directionsSection
              ),
              directions: directionsSection,
              notes,
              cuisineRegion,
              sourceInfo,
              updatedAt: new Date().toISOString(),
            };

            const nextCustomRecipes = currentCustomRecipes.map((recipe) =>
              recipe.id === updatedRecipe.id ? updatedRecipe : recipe
            );

            setCustomRecipes(nextCustomRecipes);
            await persistCache(nextCustomRecipes, recipeOverridesRef.current);
            setSyncError(null);
            const [savedRecipe] = await syncUserRecipesToRemote(
              [updatedRecipe],
              'Unable to sync the recipe changes.'
            );

            if (
              savedRecipe.id !== updatedRecipe.id ||
              savedRecipe.userId !== updatedRecipe.userId ||
              savedRecipe.syncStatus !== updatedRecipe.syncStatus
            ) {
              const syncedCustomRecipes = currentCustomRecipes.map((recipe) =>
                recipe.id === updatedRecipe.id ? savedRecipe : recipe
              );
              setCustomRecipes(syncedCustomRecipes);
              await persistCache(syncedCustomRecipes, recipeOverridesRef.current);
            }

            return savedRecipe;
          }

          const currentOverrides = recipeOverridesRef.current;
          const baseRecipe = obsidianRecipeMap[slug];
          const existingOverride = currentOverrides.find((recipe) => recipe.slug === slug);
          const override: RecipeOverride = {
            id: existingOverride?.id ?? `override-${slug}`,
            userId: existingOverride?.userId ?? activeUserId,
            slug,
            title,
            category: input.category,
            allergyFriendlyTags,
            allergenTags,
            ingredients: ingredientsSection,
            directions: directionsSection,
            directionStepOverrides: baseRecipe
              ? buildDirectionStepOverrides(baseRecipe.directions, directionsSection)
              : {},
            notes,
            cuisineRegion,
            sourceInfo,
            deleted: false,
            updatedAt: new Date().toISOString(),
          };

          const nextOverrides = [
            override,
            ...currentOverrides.filter((recipe) => recipe.slug !== slug),
          ];

          setRecipeOverrides(nextOverrides);
          await persistCache(customRecipesRef.current, nextOverrides);
          setSyncError(null);
          const [savedOverride] = await syncRecipeOverridesToRemote(
            [override],
            'Unable to sync the recipe changes.'
          );

          if (savedOverride.id !== override.id || savedOverride.userId !== override.userId) {
            const syncedOverrides = [
              savedOverride,
              ...currentOverrides.filter((recipe) => recipe.slug !== slug),
            ];
            setRecipeOverrides(syncedOverrides);
            await persistCache(customRecipesRef.current, syncedOverrides);
          }

          return savedOverride;
        } catch (error) {
          setSyncError(normalizeError(error, 'Unable to save the recipe changes.'));
          return null;
        }
      },
      bulkUpdateRecipeMetadata: async (input: BulkRecipeMetadataInput) => {
        if (input.slugs.length === 0) {
          return;
        }

        try {
          const allergenTagsToAdd = (input.allergenTagsToAdd ?? []).filter(
            (tag): tag is (typeof allergenTagOptions)[number] =>
              allergenTagOptions.includes(tag as (typeof allergenTagOptions)[number])
          );
          const allergyFriendlyTagsToAdd = (input.allergyFriendlyTagsToAdd ?? []).filter(
            (tag): tag is (typeof allergyFriendlyTagOptions)[number] =>
              allergyFriendlyTagOptions.includes(tag as (typeof allergyFriendlyTagOptions)[number])
          );

          const currentCustomRecipes = customRecipesRef.current;
          const currentOverrides = recipeOverridesRef.current;

          const nextCustomRecipes = currentCustomRecipes.map((recipe) => {
            if (!input.slugs.includes(recipe.slug)) {
              return recipe;
            }

            let nextAllergenTags = [...recipe.allergenTags];
            let nextFriendlyTags = [...recipe.allergyFriendlyTags];

            allergyFriendlyTagsToAdd.forEach((tag) => {
              const nextTags = ensureFriendlyTag(nextAllergenTags, nextFriendlyTags, tag);
              nextAllergenTags = nextTags.allergenTags;
              nextFriendlyTags = nextTags.allergyFriendlyTags;
            });

            allergenTagsToAdd.forEach((tag) => {
              const nextTags = ensureAllergenTag(nextAllergenTags, nextFriendlyTags, tag);
              nextAllergenTags = nextTags.allergenTags;
              nextFriendlyTags = nextTags.allergyFriendlyTags;
            });

            return {
              ...recipe,
              syncStatus: 'local' as const,
              category: input.category ?? recipe.category,
              cuisineRegion: input.applyCuisineRegion
                ? input.cuisineRegion?.trim()
                  ? input.cuisineRegion.trim()
                  : null
                : recipe.cuisineRegion,
              allergenTags: nextAllergenTags,
              allergyFriendlyTags: nextFriendlyTags,
              updatedAt: new Date().toISOString(),
            };
          });

          const nextOverrides = [...currentOverrides];

          input.slugs.forEach((slugValue) => {
            const baseRecipe = obsidianRecipeMap[slugValue];

            if (!baseRecipe) {
              return;
            }

            const existingOverride = nextOverrides.find((recipe) => recipe.slug === slugValue);
            let nextAllergenTags = [...(existingOverride?.allergenTags ?? baseRecipe.allergenTags)];
            let nextFriendlyTags = [
              ...(existingOverride?.allergyFriendlyTags ?? baseRecipe.allergyFriendlyTags),
            ];

            allergyFriendlyTagsToAdd.forEach((tag) => {
              const nextTags = ensureFriendlyTag(nextAllergenTags, nextFriendlyTags, tag);
              nextAllergenTags = nextTags.allergenTags;
              nextFriendlyTags = nextTags.allergyFriendlyTags;
            });

            allergenTagsToAdd.forEach((tag) => {
              const nextTags = ensureAllergenTag(nextAllergenTags, nextFriendlyTags, tag);
              nextAllergenTags = nextTags.allergenTags;
              nextFriendlyTags = nextTags.allergyFriendlyTags;
            });

            const nextOverride: RecipeOverride = {
              id: existingOverride?.id ?? `override-${slugValue}`,
              userId: existingOverride?.userId ?? activeUserId,
              slug: slugValue,
              title: existingOverride?.title ?? baseRecipe.title,
              category: input.category ?? existingOverride?.category ?? baseRecipe.category,
              allergyFriendlyTags: nextFriendlyTags,
              allergenTags: nextAllergenTags,
              ingredients: existingOverride?.ingredients ?? baseRecipe.ingredients,
              directions: existingOverride?.directions ?? baseRecipe.directions,
              directionStepOverrides: existingOverride?.directionStepOverrides ?? {},
              notes: existingOverride?.notes ?? null,
              cuisineRegion: input.applyCuisineRegion
                ? input.cuisineRegion?.trim()
                  ? input.cuisineRegion.trim()
                  : null
                : (existingOverride?.cuisineRegion ?? null),
              sourceInfo: existingOverride?.sourceInfo ?? null,
              deleted: false,
              updatedAt: new Date().toISOString(),
            };

            const existingIndex = nextOverrides.findIndex((recipe) => recipe.slug === slugValue);

            if (existingIndex >= 0) {
              nextOverrides[existingIndex] = nextOverride;
            } else {
              nextOverrides.unshift(nextOverride);
            }
          });

          setCustomRecipes(nextCustomRecipes);
          setRecipeOverrides(nextOverrides);
          await persistCache(nextCustomRecipes, nextOverrides);
          setSyncError(null);

          const [syncedCustomRecipes] = await Promise.all([
            syncUserRecipesToRemote(
              nextCustomRecipes.filter((recipe) => input.slugs.includes(recipe.slug)),
              'Unable to sync the selected recipe changes.'
            ),
            syncRecipeOverridesToRemote(
              nextOverrides.filter((recipe) => input.slugs.includes(recipe.slug)),
              'Unable to sync the selected imported recipe changes.'
            ),
          ]);

          if (syncedCustomRecipes.some((recipe) => recipe.syncStatus === 'synced')) {
            const syncedById = new Map(syncedCustomRecipes.map((recipe) => [recipe.id, recipe] as const));
            const syncedNextCustomRecipes = nextCustomRecipes.map(
              (recipe) => syncedById.get(recipe.id) ?? recipe
            );
            setCustomRecipes(syncedNextCustomRecipes);
            await persistCache(syncedNextCustomRecipes, nextOverrides);
          }
        } catch (error) {
          setSyncError(normalizeError(error, 'Unable to update the selected recipes.'));
        }
      },
      updateDirectionStep: async (
        slug: string,
        stepId: string,
        text: string,
        source: 'custom' | 'obsidian'
      ) => {
        const nextText = text.trim();

        if (!nextText) {
          return;
        }

        try {
          if (source === 'custom') {
            const currentCustomRecipes = customRecipesRef.current;
            const recipe = currentCustomRecipes.find((item) => item.slug === slug);

            if (!recipe) {
              return;
            }

            const nextDirections = replaceDirectionStepText(recipe.directions, stepId, nextText);
            const nextRecipe: UserRecipe = {
              ...recipe,
              userId: user?.id ?? recipe.userId ?? LOCAL_USER_ID,
              syncStatus: 'local',
              directions: nextDirections,
              directionStepOverrides: buildDirectionStepOverrides(
                recipe.originalDirections,
                nextDirections
              ),
              updatedAt: new Date().toISOString(),
            };

            const nextCustomRecipes = currentCustomRecipes.map((item) =>
              item.id === nextRecipe.id ? nextRecipe : item
            );

            setCustomRecipes(nextCustomRecipes);
            await persistCache(nextCustomRecipes, recipeOverridesRef.current);
            setSyncError(null);
            const [savedRecipe] = await syncUserRecipesToRemote(
              [nextRecipe],
              'Unable to sync the direction change.'
            );

            if (
              savedRecipe.id !== nextRecipe.id ||
              savedRecipe.userId !== nextRecipe.userId ||
              savedRecipe.syncStatus !== nextRecipe.syncStatus
            ) {
              const syncedCustomRecipes = currentCustomRecipes.map((item) =>
                item.id === nextRecipe.id ? savedRecipe : item
              );
              setCustomRecipes(syncedCustomRecipes);
              await persistCache(syncedCustomRecipes, recipeOverridesRef.current);
            }
            return;
          }

          const currentOverrides = recipeOverridesRef.current;
          const baseRecipe = obsidianRecipeMap[slug];

          if (!baseRecipe) {
            return;
          }

          const existingOverride = currentOverrides.find((recipe) => recipe.slug === slug);
          const nextDirections = replaceDirectionStepText(
            existingOverride?.directions ?? baseRecipe.directions,
            stepId,
            nextText
          );

          const nextOverride: RecipeOverride = {
            id: existingOverride?.id ?? `override-${slug}`,
            userId: existingOverride?.userId ?? activeUserId,
            slug,
            title: existingOverride?.title ?? baseRecipe.title,
            category: existingOverride?.category ?? baseRecipe.category,
            allergyFriendlyTags:
              existingOverride?.allergyFriendlyTags ?? baseRecipe.allergyFriendlyTags,
            allergenTags: existingOverride?.allergenTags ?? baseRecipe.allergenTags,
            ingredients: existingOverride?.ingredients ?? baseRecipe.ingredients,
            directions: nextDirections,
            directionStepOverrides: buildDirectionStepOverrides(baseRecipe.directions, nextDirections),
            notes: existingOverride?.notes ?? null,
            cuisineRegion: existingOverride?.cuisineRegion ?? null,
            sourceInfo: existingOverride?.sourceInfo ?? null,
            deleted: false,
            updatedAt: new Date().toISOString(),
          };

          const nextOverrides = [
            nextOverride,
            ...currentOverrides.filter((recipe) => recipe.slug !== slug),
          ];

          setRecipeOverrides(nextOverrides);
          await persistCache(customRecipesRef.current, nextOverrides);
          setSyncError(null);
          const [savedOverride] = await syncRecipeOverridesToRemote(
            [nextOverride],
            'Unable to sync the direction change.'
          );

          if (savedOverride.id !== nextOverride.id || savedOverride.userId !== nextOverride.userId) {
            const syncedOverrides = [
              savedOverride,
              ...currentOverrides.filter((recipe) => recipe.slug !== slug),
            ];
            setRecipeOverrides(syncedOverrides);
            await persistCache(customRecipesRef.current, syncedOverrides);
          }
        } catch (error) {
          setSyncError(normalizeError(error, 'Unable to save the direction change.'));
        }
      },
      resetDirectionStep: async (slug: string, stepId: string, source: 'custom' | 'obsidian') => {
        try {
          if (source === 'custom') {
            const currentCustomRecipes = customRecipesRef.current;
            const recipe = currentCustomRecipes.find((item) => item.slug === slug);

            if (!recipe) {
              return;
            }

            const stepNumber = Number(stepId.replace('step-', ''));
            const originalText = recipe.originalDirections.flatMap((section) => section.items)[stepNumber - 1];

            if (!originalText) {
              return;
            }

            const nextDirections = replaceDirectionStepText(recipe.directions, stepId, originalText);
            const nextRecipe: UserRecipe = {
              ...recipe,
              userId: user?.id ?? recipe.userId ?? LOCAL_USER_ID,
              syncStatus: 'local',
              directions: nextDirections,
              directionStepOverrides: buildDirectionStepOverrides(
                recipe.originalDirections,
                nextDirections
              ),
              updatedAt: new Date().toISOString(),
            };

            const nextCustomRecipes = currentCustomRecipes.map((item) =>
              item.id === nextRecipe.id ? nextRecipe : item
            );

            setCustomRecipes(nextCustomRecipes);
            await persistCache(nextCustomRecipes, recipeOverridesRef.current);
            setSyncError(null);
            const [savedRecipe] = await syncUserRecipesToRemote(
              [nextRecipe],
              'Unable to sync the direction reset.'
            );

            if (
              savedRecipe.id !== nextRecipe.id ||
              savedRecipe.userId !== nextRecipe.userId ||
              savedRecipe.syncStatus !== nextRecipe.syncStatus
            ) {
              const syncedCustomRecipes = currentCustomRecipes.map((item) =>
                item.id === nextRecipe.id ? savedRecipe : item
              );
              setCustomRecipes(syncedCustomRecipes);
              await persistCache(syncedCustomRecipes, recipeOverridesRef.current);
            }
            return;
          }

          const currentOverrides = recipeOverridesRef.current;
          const baseRecipe = obsidianRecipeMap[slug];

          if (!baseRecipe) {
            return;
          }

          const existingOverride = currentOverrides.find((recipe) => recipe.slug === slug);
          const stepNumber = Number(stepId.replace('step-', ''));
          const originalText = baseRecipe.directions.flatMap((section) => section.items)[stepNumber - 1];

          if (!existingOverride || !originalText) {
            return;
          }

          const nextDirections = replaceDirectionStepText(existingOverride.directions, stepId, originalText);
          const nextOverride: RecipeOverride = {
            ...existingOverride,
            userId: user?.id ?? existingOverride.userId ?? LOCAL_USER_ID,
            directions: nextDirections,
            directionStepOverrides: buildDirectionStepOverrides(baseRecipe.directions, nextDirections),
            deleted: false,
            updatedAt: new Date().toISOString(),
          };

          const nextOverrides = [
            nextOverride,
            ...currentOverrides.filter((recipe) => recipe.slug !== slug),
          ];

          setRecipeOverrides(nextOverrides);
          await persistCache(customRecipesRef.current, nextOverrides);
          setSyncError(null);
          const [savedOverride] = await syncRecipeOverridesToRemote(
            [nextOverride],
            'Unable to sync the direction reset.'
          );

          if (savedOverride.id !== nextOverride.id || savedOverride.userId !== nextOverride.userId) {
            const syncedOverrides = [
              savedOverride,
              ...currentOverrides.filter((recipe) => recipe.slug !== slug),
            ];
            setRecipeOverrides(syncedOverrides);
            await persistCache(customRecipesRef.current, syncedOverrides);
          }
        } catch (error) {
          setSyncError(normalizeError(error, 'Unable to reset the direction step.'));
        }
      },
    }),
    [
      customRecipes,
      lastDeletedRecipes,
      loaded,
      recipeOverrides,
      session?.accessToken,
      syncBusy,
      syncConfigured,
      syncEnabled,
      syncError,
      user?.id,
    ]
  );

  return <CustomRecipesContext.Provider value={value}>{children}</CustomRecipesContext.Provider>;
}

export function useCustomRecipes() {
  const context = useContext(CustomRecipesContext);

  if (!context) {
    throw new Error('useCustomRecipes must be used inside CustomRecipesProvider');
  }

  return context;
}
