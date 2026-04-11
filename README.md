# Kitchen Helper

Kitchen Helper is a cross-platform cooking app prototype built with Expo, React Native, TypeScript, and Expo Router.

The current app runs on:

- Android
- Web

It is focused on practical kitchen utilities:

- recipe scaling
- substitutions
- conversions
- saved recipe browsing and editing
- glossary/reference lookups
- cook timers

## Current Status

The app currently includes:

- a routed home screen that acts like a kitchen tools hub
- a searchable conversions page
- a searchable allergy substitutions page
- a searchable cooking dictionary page
- a `My Recipes` page backed by Obsidian recipe notes in [`Cooking/`](Cooking)
- locally created recipes stored in app storage
- clickable recipe detail pages generated from Markdown
- editable recipe detail pages for both local recipes and Obsidian-backed recipes through local overrides
- ingredient scaling controls on recipe pages
- favorites saved locally
- category, cuisine-region, allergen, and favorites filtering
- bulk recipe selection, bulk favorites, bulk metadata editing, and bulk delete
- undo delete notifications with auto-dismiss
- a shared settings menu in the header
- dark mode
- a keep-screen-awake cook mode setting
- a shared cook timer popup with up to three timers

## Stack

This project currently uses:

- Expo
- React Native
- TypeScript
- Expo Router
- pnpm
- Metro
- AsyncStorage
- expo-audio
- react-native-svg

## Why Expo

Expo was chosen because it gives us:

- Android support
- web support
- one shared codebase
- a simpler development workflow for a prototype

This is a good fit for a cooking app idea because we can build and test one product across platforms without splitting the app into separate native and web codebases.

## Why `pnpm`

`pnpm` is the package manager for this project.

It was chosen because it is:

- fast
- space efficient
- reliable

On this machine, `pnpm` is run through `corepack`, so the normal commands are:

```powershell
corepack pnpm install
corepack pnpm run web
corepack pnpm run android
```

## Why We Did Not Use Vite Inside the App

Expo already uses Metro as its supported bundler for Android and web in this setup.

So the current tool split is:

- Expo for the app framework
- Metro for bundling
- `pnpm` for dependency management

If Vite is ever added later, it would make more sense for a separate site such as documentation, marketing, or an admin surface.

## App Architecture

At a high level, the app is organized into four pieces:

1. `app/`
Routes and screens

2. `contexts/`
Shared app state like favorites and settings

3. `data/`, `scripts/`, `utils/`, and `Cooking/`
Recipe source files, generated data, and parsing/scaling logic

4. `components/`
Shared styles, theme palettes, and reusable UI pieces

A simple way to think about it:

- `Cooking/` contains the Obsidian recipe source files and resource files
- `scripts/generate-obsidian-recipes.mjs` turns recipe notes into [`data/obsidian-recipes.ts`]
- `scripts/generate-cooking-dictionary.mjs` turns the glossary resource into [`data/cooking-dictionary.ts`]
- `app/` renders the screens from that data
- `contexts/` handles shared state like favorites and settings
- `components/` keeps the UI and theming consistent

## Main App Areas

Important routed files:

- [`app/_layout.tsx`]
- [`app/add-recipe.tsx`]
- [`app/index.tsx`]
- [`app/conversions.tsx`]
- [`app/cooking-dictionary.tsx`]
- [`app/allergy-substitutions.tsx`]
- [`app/edit-recipe/[slug].tsx`]
- [`app/my-recipes.tsx`]
- [`app/recipe.tsx`]
- [`app/recipes/[slug].tsx`]
- [`app/user-recipes/[slug].tsx`]

Important shared files:

- [`components/cook-timer-modal.tsx`]
- [`components/kitchen-styles.ts`]
- [`components/notice-pie-timer.tsx`]
- [`components/reference-nav.tsx`]
- [`components/app-theme.ts`]
- [`components/settings-menu.tsx`]
- [`components/sample-data.ts`]
- [`contexts/cook-timer-context.tsx`]
- [`contexts/custom-recipes-context.tsx`]
- [`contexts/favorites-context.tsx`]
- [`contexts/settings-context.tsx`]
- [`utils/allergen-tags.ts`]
- [`utils/ingredient-scaling.ts`]

## Data Sources

### Obsidian Recipes

Recipe data comes from the [`Cooking/`](Cooking) folder.

The app parses those Markdown notes into structured recipe data including:

- title
- category
- cuisine region when overridden locally
- ingredients
- directions
- servings
- prep/cook/total time when available
- allergen and allergy-friendly tags

### Local App Recipes And Overrides

The app also stores recipe data in local app storage.

That includes:

- recipes created directly in the app
- local edits to Obsidian-backed recipes
- bulk metadata changes

This lets the app treat all recipes as editable without changing the original Markdown files in the `Cooking` vault.

### Cooking Dictionary

The cooking dictionary page is generated from:

- [`Cooking/Resources/Cooking Dictionary.md`]

The app displays that glossary as searchable term cards and cites the source:

- [What’s Cooking America glossary](https://whatscookingamerica.net/glossary/)

## Scripts

Useful scripts in [`package.json`](package.json):

- `start`
- `android`
- `ios`
- `web`
- `sync:recipes`
- `sync:dictionary`

Commands:

```powershell
corepack pnpm run web
corepack pnpm run android
corepack pnpm sync:recipes
corepack pnpm sync:dictionary
```

Use `sync:recipes` after changing recipe Markdown files.

Use `sync:dictionary` after changing the cooking dictionary resource.

## Settings

The app has a shared settings menu available from the gear icon in the header.

Current saved settings:

- `Dark mode`
- `Keep screen awake`
- `Confirm delete`

How it works:

- settings are stored locally with AsyncStorage
- dark mode switches between light and dark palettes
- keep-screen-awake uses `expo-keep-awake`
- confirm delete asks before deleting a saved app recipe and does not apply to bulk deletes

## Recipe Management

The app now supports:

- adding recipes directly in the app
- editing any recipe in the UI
- local overrides for Obsidian-backed recipes
- deleting app-saved recipes
- restoring recently deleted recipes from an undo banner

Recipe metadata now includes:

- category
- cuisine region
- allergen tags
- allergy-friendly tags

Allergen tags are auto-detected from recipe content and can still be edited manually.

## Bulk Actions

`My Recipes` now supports bulk selection with:

- checkboxes on each recipe card
- desktop `Shift+click` range selection
- `Select All`
- bulk delete
- bulk favorite
- bulk metadata editing

Bulk delete always asks for confirmation, regardless of the normal delete-confirm setting.

## Cook Timer

The app now includes a shared cook timer popup available anywhere the reference nav appears.

Current timer behavior:

- up to three timers
- custom names
- minutes or `mm:ss` input
- shrinking horizontal progress bars
- beep and vibration when a timer finishes
- button labels that correctly distinguish `Start` from `Resume`
- `Reset` is disabled until a timer has actually been started

Important files:

- [`components/cook-timer-modal.tsx`]
- [`contexts/cook-timer-context.tsx`]
- [`components/reference-nav.tsx`]

## Notes About Expo Go and Dependency Alignment

During development, Expo Go on Android was failing with a native error:

- `java.lang.String cannot be cast to java.lang.Boolean`

The real cause turned out to be Expo SDK dependency mismatches, not the UI code itself.

The project was aligned to Expo SDK 54-compatible versions for:

- `@react-native-async-storage/async-storage`
- `expo-keep-awake`
- `react-native-safe-area-context`
- `react-native-screens`

After that:

- `npx expo-doctor` passed
- `npx expo install --check` reported dependencies were up to date
- Expo Go started working again

This is a good reminder that Expo package version alignment matters a lot, especially when native modules are involved.

## Verification

The project has been checked with:

### TypeScript

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```

### Expo Doctor

```powershell
npx expo-doctor
```

### Expo Version Check

```powershell
npx expo install --check
```

### Web Export

```powershell
.\node_modules\.bin\expo.cmd export --platform web
```

## Good Next Steps

Natural next steps from here:

1. add more bulk actions like unfavorite or bulk tag removal
2. improve dictionary formatting for very long entries
3. add recipe search from the home screen
4. standardize more recipe note formats so more metadata can be parsed cleanly
5. add richer timer presets or recipe-step-linked timers


