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
import {
  getSyncConfig,
  listRecipeOrders,
  upsertRecipeOrders,
} from '../utils/supabase-sync';
import { RECIPE_LIST_KEYS, isRecipeListKey, type RecipeListKey } from '../utils/recipe-order';

type OrdersMap = Record<RecipeListKey, string[]>;
type UpdatedMap = Record<RecipeListKey, string | null>;

type RecipeOrderContextValue = {
  loaded: boolean;
  getOrder: (listKey: RecipeListKey) => string[];
  applyOrder: (listKey: RecipeListKey, orderedSlugs: string[]) => void;
};

const LOCAL_USER_ID = 'local';
const syncConfig = getSyncConfig();

function emptyOrders(): OrdersMap {
  return { 'my-recipes': [], 'sample-recipes': [] };
}

function emptyUpdated(): UpdatedMap {
  return { 'my-recipes': null, 'sample-recipes': null };
}

function cacheKey(userId: string) {
  return `kitchen-helper.recipe-order.${userId}`;
}

type StoredOrders = {
  orders: OrdersMap;
  updatedAt: UpdatedMap;
};

function parseStored(raw: string | null): StoredOrders {
  const orders = emptyOrders();
  const updatedAt = emptyUpdated();

  if (!raw) {
    return { orders, updatedAt };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredOrders>;
    RECIPE_LIST_KEYS.forEach((key) => {
      const list = parsed.orders?.[key];
      if (Array.isArray(list)) {
        orders[key] = list.filter((slug): slug is string => typeof slug === 'string');
      }
      const stamp = parsed.updatedAt?.[key];
      if (typeof stamp === 'string') {
        updatedAt[key] = stamp;
      }
    });
  } catch {
    // fall through to empty defaults
  }

  return { orders, updatedAt };
}

const RecipeOrderContext = createContext<RecipeOrderContextValue | undefined>(undefined);

export function RecipeOrderProvider({ children }: PropsWithChildren) {
  const { session, user } = useAuth();
  const [orders, setOrders] = useState<OrdersMap>(emptyOrders);
  const [loaded, setLoaded] = useState(false);
  const ordersRef = useRef<OrdersMap>(emptyOrders());
  const updatedRef = useRef<UpdatedMap>(emptyUpdated());

  const activeUserId = user?.id ?? LOCAL_USER_ID;
  const accessToken = session?.accessToken ?? null;
  const remoteUserId = user?.id ?? null;
  const syncEnabled = Boolean(syncConfig && accessToken && remoteUserId);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  async function persistLocal(userId: string, nextOrders: OrdersMap, nextUpdated: UpdatedMap) {
    await AsyncStorage.setItem(
      cacheKey(userId),
      JSON.stringify({ orders: nextOrders, updatedAt: nextUpdated } satisfies StoredOrders)
    );
  }

  // Load the local cache for the active user (offline-first).
  useEffect(() => {
    let active = true;
    setLoaded(false);

    AsyncStorage.getItem(cacheKey(activeUserId))
      .then((raw) => {
        if (!active) {
          return;
        }

        const stored = parseStored(raw);
        ordersRef.current = stored.orders;
        updatedRef.current = stored.updatedAt;
        setOrders(stored.orders);
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [activeUserId]);

  // When signed in, reconcile with the remote copy (last-write-wins per list).
  useEffect(() => {
    if (!syncEnabled || !syncConfig || !accessToken || !remoteUserId) {
      return;
    }

    let active = true;

    (async () => {
      try {
        const records = await listRecipeOrders(syncConfig, accessToken, remoteUserId);
        if (!active) {
          return;
        }

        const nextOrders: OrdersMap = { ...ordersRef.current };
        const nextUpdated: UpdatedMap = { ...updatedRef.current };
        const uploads: { id: string; user_id: string; list_key: string; slug_order: string[]; updated_at: string }[] =
          [];

        const remoteByKey = new Map<RecipeListKey, { slugOrder: string[]; updatedAt: string }>();
        records.forEach((record) => {
          if (isRecipeListKey(record.list_key)) {
            remoteByKey.set(record.list_key, {
              slugOrder: Array.isArray(record.slug_order) ? record.slug_order : [],
              updatedAt: record.updated_at,
            });
          }
        });

        RECIPE_LIST_KEYS.forEach((key) => {
          const remote = remoteByKey.get(key);
          const localStamp = nextUpdated[key];
          const remoteStamp = remote?.updatedAt ?? null;

          const remoteNewer =
            remote &&
            (!localStamp || (remoteStamp && new Date(remoteStamp).getTime() >= new Date(localStamp).getTime()));

          if (remoteNewer && remote) {
            nextOrders[key] = remote.slugOrder;
            nextUpdated[key] = remoteStamp;
          } else if (localStamp && (!remote || new Date(localStamp).getTime() > new Date(remoteStamp!).getTime())) {
            // Local is newer (or remote missing) — push it up.
            uploads.push({
              id: `${remoteUserId}:${key}`,
              user_id: remoteUserId,
              list_key: key,
              slug_order: nextOrders[key],
              updated_at: localStamp,
            });
          }
        });

        ordersRef.current = nextOrders;
        updatedRef.current = nextUpdated;
        setOrders(nextOrders);
        await persistLocal(remoteUserId, nextOrders, nextUpdated);

        if (uploads.length > 0) {
          await upsertRecipeOrders(syncConfig, accessToken, uploads);
        }
      } catch {
        // Keep the local copy on any sync failure.
      }
    })();

    return () => {
      active = false;
    };
  }, [syncEnabled, accessToken, remoteUserId]);

  const value = useMemo<RecipeOrderContextValue>(
    () => ({
      loaded,
      getOrder: (listKey: RecipeListKey) => orders[listKey] ?? [],
      applyOrder: (listKey: RecipeListKey, orderedSlugs: string[]) => {
        const now = new Date().toISOString();
        const nextOrders: OrdersMap = { ...ordersRef.current, [listKey]: orderedSlugs };
        const nextUpdated: UpdatedMap = { ...updatedRef.current, [listKey]: now };

        ordersRef.current = nextOrders;
        updatedRef.current = nextUpdated;
        setOrders(nextOrders);
        void persistLocal(activeUserId, nextOrders, nextUpdated);

        if (syncConfig && accessToken && remoteUserId) {
          upsertRecipeOrders(syncConfig, accessToken, [
            {
              id: `${remoteUserId}:${listKey}`,
              user_id: remoteUserId,
              list_key: listKey,
              slug_order: orderedSlugs,
              updated_at: now,
            },
          ]).catch(() => {});
        }
      },
    }),
    [orders, loaded, activeUserId, accessToken, remoteUserId]
  );

  return <RecipeOrderContext.Provider value={value}>{children}</RecipeOrderContext.Provider>;
}

export function useRecipeOrder() {
  const context = useContext(RecipeOrderContext);

  if (!context) {
    throw new Error('useRecipeOrder must be used inside RecipeOrderProvider');
  }

  return context;
}
