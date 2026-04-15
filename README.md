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
- home menu cards for `My Recipes`, `Sample Recipes`, and `Kitchen Guides`
- shared header shortcuts for Home, My Recipes, Kitchen Guides, cook timer, and settings
- compact mobile header titles that collapse to `KH` on smaller screens
- a `Sample Recipes` page that shows an imported-only subset of Obsidian recipes from the sample cooking folders
- a consolidated `Kitchen Reference` screen with conversions, substitutions, and dictionary tabs
- dedicated searchable routes for conversions, substitutions, and the cooking dictionary
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
- a PDF export action for the full recipe library
- a shared cook timer popup with a configurable number of timer slots
- photo-based recipe import with local OCR-assisted prefill
- website-based recipe import with source attribution
- scaled directions with per-step warnings, cue highlights, and local step edits

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
- expo-print
- expo-sharing
- expo-file-system
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

Navigation is now split between two top-level patterns:

- the home hub at `/`, which acts as the main menu for `My Recipes`, `Sample Recipes`, and `Kitchen Guides`
- shared header shortcuts available across screens for Home, My Recipes, Kitchen Guides, the cook timer, and settings

On compact/mobile widths, the header title switches to `KH` so the top bar still has room for the shared shortcuts.

Important routed files:

- [`app/_layout.tsx`]
- [`app/add-recipe.tsx`]
- [`app/index.tsx`]
- [`app/reference.tsx`]
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
- [`components/scaled-directions-list.tsx`]
- [`components/app-theme.ts`]
- [`components/settings-menu.tsx`]
- [`contexts/cook-timer-context.tsx`]
- [`contexts/custom-recipes-context.tsx`]
- [`contexts/favorites-context.tsx`]
- [`contexts/settings-context.tsx`]
- [`utils/allergen-tags.ts`]
- [`utils/ingredient-scaling.ts`]
- [`utils/scaled-directions.ts`]

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
- website-imported recipe source attribution
- per-step direction overrides for scaled recipe guidance

This lets the app treat all recipes as editable without changing the original Markdown files in the `Cooking` vault.

### Sample Recipes

The `/recipe` route is now a real imported-only library screen called `Sample Recipes`.

It is built from the generated Obsidian recipe dataset and includes recipes from these sample folders:

- `Appetizers`
- `Dessert`
- `Entree`
- `Breakfast`

It does not include app-created recipes.

Local overrides still apply there, so renamed titles, updated metadata, and locally hidden imported recipes behave the same way they do elsewhere in the app.

### Cooking Dictionary

The cooking dictionary page is generated from:

- [`Cooking/Resources/New Custom Cooking Dictionary.md`]

The dictionary generator parses that glossary format into searchable app data in [`data/cooking-dictionary.ts`].

## Scripts

Useful scripts in [`package.json`](package.json):

- `start`
- `android`
- `ios`
- `web`
- `review:docs`
- `sync:recipes`
- `sync:dictionary`

Commands:

```powershell
corepack pnpm run web
corepack pnpm run android
corepack pnpm run review:docs
corepack pnpm sync:recipes
corepack pnpm sync:dictionary
```

Use `sync:recipes` after changing recipe Markdown files.

Use `sync:dictionary` after changing the cooking dictionary resource.

Use `review:docs` to generate a draft-only documentation delta report after reviewing the current repo state.

## Documentation Review

The project now includes a manual documentation review workflow instead of automatic doc edits.

Run:

```powershell
corepack pnpm run review:docs
```

What it does:

- inspects the repo first instead of relying on chat history
- reviews app routes, components, contexts, scripts, utilities, and package changes
- compares the detected app state against `README.md` and `docs/knowledge-base.md`
- prints a structured draft report with:
  - `New since last docs update`
  - `README changes needed`
  - `Knowledge-base changes needed`
  - `Potential stale statements to remove`
  - `Confidence / manual review notes`

What it does not do:

- it does not edit docs
- it does not assume all recent changes came from Codex
- it does not treat conversation history as source of truth

If you want to save the report to a file for review:

```powershell
node scripts/review-documentation.mjs --output .\\dist\\documentation-review.md
```

## Tester Setup

There are currently two practical tester paths, depending on whether the goal is general feature coverage or full native-feature validation.

### Web tester

Requires:

- Node.js
- Corepack
- the repo checked out locally
- a browser

Commands:

```powershell
corepack pnpm install
corepack pnpm run web
```

Covers:

- recipe browsing
- filtering and search
- editing
- settings
- cook timer UI
- reference pages
- general web PDF export behavior

### Android tester

Requires:

- Node.js
- Corepack
- Android Studio
- Android SDK / platform tools
- Java configured through Android Studio or `JAVA_HOME`
- an Android emulator or USB-debuggable Android phone

Commands:

```powershell
corepack pnpm install
corepack pnpm run android
```

Covers:

- native OCR testing
- Android file/share flows
- keep-awake behavior
- full native feature validation

### Current limitations

- `Expo Go` is acceptable for some general UI checks
- `Expo Go` is not the right target for OCR/native-module validation
- website import is less reliable on web because of browser CORS restrictions
- the easiest tester path is web; the most complete tester path is Android dev build

## Settings

The app has a shared settings menu available from the gear icon in the shared header action row.

Current saved settings:

- `Restore defaults`
- `Dark mode`
- `Keep screen awake`
- `Number of timers`
- `Confirm delete`
- `Export all recipes to PDF` action

How it works:

- settings are stored locally with AsyncStorage
- restore defaults is a real immediate action in settings
- restore defaults immediately resets dark mode to Off, keep screen awake to Off, confirm delete to On, and timers to 3
- dark mode switches between light and dark palettes
- keep-screen-awake uses `expo-keep-awake`
- number of timers controls how many cook-timer slots are available and is clamped to `1-6`
- confirm delete asks before deleting a saved app recipe and does not apply to bulk deletes
- export builds a single cookbook-style PDF from the full merged recipe library
- on web, export downloads a PDF file
- on Android, export first tries to save to a folder you choose and falls back to share if needed

Shared header navigation behavior:

- the Home button is active on every route except `/`
- the My Recipes skillet button is active on every route except `/my-recipes`
- the Kitchen Guides button is active on every route except `/reference`
- the current-page shortcut uses a grayed-out disabled state instead of re-navigating to the same screen

## Recipe Management

The app now supports:

- adding recipes directly in the app
- browsing a separate imported-only `Sample Recipes` library
- starting new recipes from a photo with local OCR-assisted prefill
- starting new recipes from a website URL with schema-first import
- editing any recipe in the UI
- editing individual direction steps directly from recipe pages
- local overrides for Obsidian-backed recipes
- deleting app-saved recipes
- restoring recently deleted recipes from an undo banner

Recipe metadata now includes:

- category
- cuisine region
- allergen tags
- allergy-friendly tags

Allergen tags are auto-detected from recipe content and can still be edited manually.

Scaled directions now use a step-based annotation pipeline:

- original direction text stays visible
- each step is normalized internally
- the app detects timers, temperatures, equipment references, doneness cues, and cooking-method risks per step
- the app adds hints on top of the source text instead of rewriting recipe prose
- edited direction steps are stored locally and can be reset back to the original text

The OCR import path is intentionally review-first:

- pick a recipe image
- extract text locally on device
- prefill the normal recipe form
- review and save manually

Right now, the local OCR module is intended for a native development build rather than Expo Go.

The website import path is also review-first:

- paste a recipe URL
- fetch the page
- extract recipe data from structured markup when available
- prefill the normal recipe form
- keep website attribution separate from notes

Website imports save a dedicated `Source` block with:

- website name
- author when available
- source URL

On web, this importer is less reliable because many recipe sites block browser fetches with CORS. Native builds are the better target for this feature.

## Bulk Actions

`My Recipes` now supports bulk selection with:

- checkboxes on each recipe card
- desktop `Shift+click` range selection
- `Select All`
- bulk delete
- bulk favorite
- bulk metadata editing

Bulk delete always asks for confirmation, regardless of the normal delete-confirm setting.

## Scaled Directions

Recipe pages now use a shared scaled-directions pipeline.

Current behavior:

- directions are normalized into step objects internally
- original times stay visible and are marked as original timing when scaled
- target temperatures and doneness cues are visually emphasized
- scaled-up surface cooking steps can show crowding warnings
- scaled-up baking or roasting steps can show depth warnings
- vessel-size references can show equipment-check notes
- users can edit and reset individual steps directly on recipe pages

Important files:

- [`components/scaled-directions-list.tsx`]
- [`utils/scaled-directions.ts`]
- [`contexts/custom-recipes-context.tsx`]

## Cook Timer

The app now includes a shared cook timer popup available from the header.

Current timer behavior:

- configurable timer slots from `1-6`
- custom names
- minutes or `mm:ss` input
- shrinking horizontal progress bars
- beep and vibration when a timer finishes
- button labels that correctly distinguish `Start` from `Resume`
- `Reset` is disabled until a timer has actually been started

Important files:

- [`components/cook-timer-modal.tsx`]
- [`contexts/cook-timer-context.tsx`]
- [`components/settings-menu.tsx`]
- [`contexts/settings-context.tsx`]

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

## PDF Export

The settings menu now includes a one-shot export action:

- `Export all recipes to PDF`

Current behavior:

- exports the full recipe library, not the currently filtered `My Recipes` view
- includes app-created recipes plus Obsidian-backed recipes with local overrides applied
- includes title, category, cuisine region, time fields, tags, ingredients, directions, notes, and source attribution when present
- produces a single cookbook-style PDF

Platform behavior:

- web uses `html2pdf.js` to download the generated PDF
- Android uses `expo-print` to render the PDF, then tries to save it through the Android folder picker
- if no Android folder is chosen, the app falls back to the native share sheet

## Native OCR And Dev Builds

The local OCR path uses a native ML Kit module, so it is intended for a native development build rather than Expo Go.

That means the practical split is:

- Expo Go for general UI work
- Android dev builds for testing OCR and other native-only behavior

Android Studio and the Android SDK are the expected toolchain for that workflow.

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


