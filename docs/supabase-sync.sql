create table if not exists public.user_recipes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  category text not null,
  source text not null default 'App Storage',
  prep_time text,
  cook_time text,
  total_time text,
  servings text,
  allergy_friendly_tags jsonb not null default '[]'::jsonb,
  allergen_tags jsonb not null default '[]'::jsonb,
  ingredients jsonb not null default '[]'::jsonb,
  original_directions jsonb not null default '[]'::jsonb,
  directions jsonb not null default '[]'::jsonb,
  direction_step_overrides jsonb not null default '{}'::jsonb,
  notes text,
  cuisine_region text,
  source_info jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists user_recipes_user_slug_idx
  on public.user_recipes (user_id, slug)
  where deleted_at is null;

create table if not exists public.recipe_overrides (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  category text not null,
  allergy_friendly_tags jsonb not null default '[]'::jsonb,
  allergen_tags jsonb not null default '[]'::jsonb,
  ingredients jsonb not null default '[]'::jsonb,
  directions jsonb not null default '[]'::jsonb,
  direction_step_overrides jsonb not null default '{}'::jsonb,
  notes text,
  cuisine_region text,
  source_info jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists recipe_overrides_user_slug_idx
  on public.recipe_overrides (user_id, slug);

alter table public.user_recipes enable row level security;
alter table public.recipe_overrides enable row level security;

create policy "user_recipes_select_own" on public.user_recipes
  for select using (auth.uid() = user_id);

create policy "user_recipes_insert_own" on public.user_recipes
  for insert with check (auth.uid() = user_id);

create policy "user_recipes_update_own" on public.user_recipes
  for update using (auth.uid() = user_id);

create policy "recipe_overrides_select_own" on public.recipe_overrides
  for select using (auth.uid() = user_id);

create policy "recipe_overrides_insert_own" on public.recipe_overrides
  for insert with check (auth.uid() = user_id);

create policy "recipe_overrides_update_own" on public.recipe_overrides
  for update using (auth.uid() = user_id);
