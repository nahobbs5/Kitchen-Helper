import type { RecipeSection } from '../data/obsidian-recipes';

export type SyncConfig = {
  url: string;
  anonKey: string;
};

export type SyncUser = {
  id: string;
  email: string | null;
};

export type SyncSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: SyncUser;
};

export type SyncedUserRecipeRecord = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  category: string;
  source: 'App Storage';
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  servings: string | null;
  allergy_friendly_tags: string[];
  allergen_tags: string[];
  ingredients: RecipeSection[];
  original_directions: RecipeSection[];
  directions: RecipeSection[];
  direction_step_overrides: Record<string, string>;
  notes: string | null;
  cuisine_region: string | null;
  source_info: {
    websiteName: string | null;
    author: string | null;
    url: string | null;
  } | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SyncedRecipeOverrideRecord = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  category: string;
  allergy_friendly_tags: string[];
  allergen_tags: string[];
  ingredients: RecipeSection[];
  directions: RecipeSection[];
  direction_step_overrides: Record<string, string>;
  notes: string | null;
  cuisine_region: string | null;
  source_info: {
    websiteName: string | null;
    author: string | null;
    url: string | null;
  } | null;
  deleted: boolean;
  updated_at: string;
};

type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id: string;
    email?: string | null;
  };
};

function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getSyncConfig(): SyncConfig | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return {
    url: normalizeUrl(url),
    anonKey,
  };
}

function buildSession(payload: AuthResponse): SyncSession | null {
  if (!payload.access_token || !payload.refresh_token || !payload.user?.id) {
    return null;
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt:
      typeof payload.expires_in === 'number' ? Date.now() + payload.expires_in * 1000 : null,
    user: {
      id: payload.user.id,
      email: payload.user.email ?? null,
    },
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

async function request<T>(
  input: string,
  init: RequestInit,
  fallbackError: string
): Promise<T> {
  const response = await fetch(input, init);
  const payload = await readJson<Record<string, unknown>>(response);

  if (!response.ok) {
    const message =
      typeof payload.msg === 'string'
        ? payload.msg
        : typeof payload.message === 'string'
          ? payload.message
          : fallbackError;
    throw new Error(message);
  }

  return payload as T;
}

function authHeaders(config: SyncConfig, accessToken?: string) {
  return {
    apikey: config.anonKey,
    Authorization: accessToken ? `Bearer ${accessToken}` : `Bearer ${config.anonKey}`,
    'Content-Type': 'application/json',
  };
}

export async function signUpWithPassword(config: SyncConfig, email: string, password: string) {
  const payload = await request<AuthResponse>(
    `${config.url}/auth/v1/signup`,
    {
      method: 'POST',
      headers: authHeaders(config),
      body: JSON.stringify({ email, password }),
    },
    'Unable to create an account.'
  );

  return {
    session: buildSession(payload),
    requiresEmailConfirmation: !payload.access_token,
  };
}

export async function signInWithPassword(config: SyncConfig, email: string, password: string) {
  const payload = await request<AuthResponse>(
    `${config.url}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: authHeaders(config),
      body: JSON.stringify({ email, password }),
    },
    'Unable to sign in.'
  );

  const session = buildSession(payload);

  if (!session) {
    throw new Error('The sign-in response did not include a valid session.');
  }

  return session;
}

export async function requestPasswordReset(config: SyncConfig, email: string) {
  await request<Record<string, never>>(
    `${config.url}/auth/v1/recover`,
    {
      method: 'POST',
      headers: authHeaders(config),
      body: JSON.stringify({ email }),
    },
    'Unable to send a password reset email.'
  );
}

export async function refreshSession(config: SyncConfig, refreshToken: string) {
  const payload = await request<AuthResponse>(
    `${config.url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: authHeaders(config),
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
    'Unable to refresh your session.'
  );

  const session = buildSession(payload);

  if (!session) {
    throw new Error('The refresh response did not include a valid session.');
  }

  return session;
}

export async function fetchCurrentUser(config: SyncConfig, accessToken: string) {
  const payload = await request<{ id: string; email?: string | null }>(
    `${config.url}/auth/v1/user`,
    {
      method: 'GET',
      headers: authHeaders(config, accessToken),
    },
    'Unable to load the current user.'
  );

  return {
    id: payload.id,
    email: payload.email ?? null,
  } satisfies SyncUser;
}

async function upsertRecords<T extends Record<string, unknown>>(
  config: SyncConfig,
  accessToken: string,
  table: string,
  records: T[]
) {
  if (records.length === 0) {
    return [] as T[];
  }

  return request<T[]>(
    `${config.url}/rest/v1/${table}?on_conflict=id`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(config, accessToken),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(records),
    },
    `Unable to save ${table}.`
  );
}

export async function listUserRecipes(
  config: SyncConfig,
  accessToken: string,
  userId: string
) {
  const params = new URLSearchParams({
    select: '*',
    user_id: `eq.${userId}`,
    deleted_at: 'is.null',
    order: 'updated_at.desc',
  });

  return request<SyncedUserRecipeRecord[]>(
    `${config.url}/rest/v1/user_recipes?${params.toString()}`,
    {
      method: 'GET',
      headers: authHeaders(config, accessToken),
    },
    'Unable to load synced recipes.'
  );
}

export async function listRecipeOverrides(
  config: SyncConfig,
  accessToken: string,
  userId: string
) {
  const params = new URLSearchParams({
    select: '*',
    user_id: `eq.${userId}`,
    order: 'updated_at.desc',
  });

  return request<SyncedRecipeOverrideRecord[]>(
    `${config.url}/rest/v1/recipe_overrides?${params.toString()}`,
    {
      method: 'GET',
      headers: authHeaders(config, accessToken),
    },
    'Unable to load synced recipe overrides.'
  );
}

export async function fetchSyncSnapshot(
  config: SyncConfig,
  accessToken: string,
  userId: string
) {
  const [customRecipes, recipeOverrides] = await Promise.all([
    listUserRecipes(config, accessToken, userId),
    listRecipeOverrides(config, accessToken, userId),
  ]);

  return { customRecipes, recipeOverrides };
}

export async function upsertUserRecipes(
  config: SyncConfig,
  accessToken: string,
  records: SyncedUserRecipeRecord[]
) {
  return upsertRecords(config, accessToken, 'user_recipes', records);
}

export async function upsertRecipeOverrides(
  config: SyncConfig,
  accessToken: string,
  records: SyncedRecipeOverrideRecord[]
) {
  return upsertRecords(config, accessToken, 'recipe_overrides', records);
}
