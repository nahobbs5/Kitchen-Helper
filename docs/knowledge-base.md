# Kitchen Helper Knowledge Base

This file is the longer-form project guide for Kitchen Helper.

The README is the quick orientation document. This knowledge base is where we keep the deeper explanation of how the app works, why certain choices were made, and what changed over time.

## Project Goal

Kitchen Helper is a cross-platform cooking app prototype focused on practical kitchen utilities people can use while they cook.

Current core areas:

- recipe browsing from Obsidian notes
- imported sample-recipe browsing from selected Obsidian folders
- account-backed recipe creation and editing with cross-device sync
- photo-based recipe import with local OCR-assisted prefill or AI-powered Claude API import
- website-based recipe import with source attribution
- ingredient scaling with mixed-number and unicode fraction support
- scaled directions with per-step annotations and a tap-to-expand annotation popup
- context-aware cook-time tag (Bake vs Cook derived from title and directions)
- kitchen conversions
- allergy-friendly substitutions
- cooking glossary lookups
- cooking tips reference
- saved favorites
- recipe ratings and rating-based filter
- drag-and-drop recipe reordering
- bulk recipe management
- cook timers
- app-wide settings
- PDF export and recipe-card sharing

The app currently runs on:

- Android
- Web

## Current Stack

The project currently uses:

- Expo
- React Native
- TypeScript
- Expo Router
- pnpm
- Metro
- AsyncStorage
- Supabase-compatible REST auth/database sync
- expo-audio
- expo-print
- expo-sharing
- expo-file-system
- expo-navigation-bar
- react-native-svg

## How These Tools Fit Together

### Expo

Expo is the app framework and development environment.

It gives us:

- the project structure
- Android support
- web support
- development tooling
- access to Expo-native packages like `expo-keep-awake`

It is the main reason we can move quickly with one codebase.

### React Native

React Native is the UI layer.

Instead of HTML elements like `div` and `button`, this project uses cross-platform components such as:

- `View`
- `Text`
- `ScrollView`
- `Pressable`
- `TextInput`

Those components render appropriately for Android and web through Expo.

### TypeScript

TypeScript adds type checking to the app.

It helps us:

- catch mistakes earlier
- keep generated data shapes reliable
- make screen and utility code easier to reason about

### Expo Router

Expo Router is the navigation system.

Routes are created from files in the [`app/`](app) folder.

Examples:

- [`app/index.tsx`] -> `/`
- [`app/my-recipes.tsx`] -> `/my-recipes`
- [`app/reference.tsx`] -> `/reference`
- [`app/recipes/[slug].tsx`] -> dynamic recipe pages

This keeps navigation easier to follow as the app grows.

The app now uses a two-layer navigation model:

- the home hub at `/` is the primary menu and links to `My Recipes`, `Sample Recipes`, and `Kitchen Guides`
- the home hub also exposes an Add Recipe shortcut; on mobile this becomes a floating/sticky action button
- the shared header stays visible across screens and exposes shortcut buttons for Home, My Recipes, Kitchen Guides, the cook timer, settings, and account

On compact/mobile widths, the header title collapses to `KH` so the shortcut row still fits cleanly.

### Android System UI

Android immersive navigation is owned by [`app/_layout.tsx`]. The root layout uses `expo-navigation-bar` to hide the bottom Android system navigation bar and sets the behavior to `overlay-swipe`, so users can still reveal the system controls with the normal swipe gesture.

The implementation also listens for `AppState` changes and re-hides the navigation bar when the app becomes active again. A root-level responder calls the same hide helper on app taps and returns `false`, which keeps buttons, scrolling, inputs, headers, and overlays receiving their normal touch events.

This behavior is Android-only. Web and iOS do not get system-navigation changes from this helper.

### pnpm

`pnpm` is the package manager.

It is used for:

- installing dependencies
- running scripts
- keeping the lockfile in sync

On this machine it is run through `corepack`, so most commands look like:

```powershell
corepack pnpm install
corepack pnpm run web
corepack pnpm run android
corepack pnpm run review:docs
corepack pnpm sync:recipes
corepack pnpm sync:dictionary
```

### Metro

Metro is the bundler used by Expo in this app.

Even though the app targets web too, Expo still uses Metro for this setup. That is why the app itself is not using Vite.

### AsyncStorage

AsyncStorage is still used locally, but it is no longer the canonical recipe store.

Right now it stores:

- favorite recipes
- saved settings like dark mode, keep-awake mode, timer count, confirm delete, and mobile vibration
- auth sessions
- per-user cached synced recipes
- per-user cached imported-recipe overrides
- deleted-recipe undo state
- one-time migration markers for older local-only recipe data

### Supabase-Compatible Sync

Supabase is now the shared backend for recipe sync.

It provides:

- email/password authentication
- a hosted Postgres-backed data store for user recipes and recipe overrides
- row-level security so users only see their own synced data
- REST endpoints the Expo app can call directly

This means the app now has a real shared source of truth across mobile and web without needing a custom server in this repo.

## Why This Setup Was Chosen

The stack was chosen because it gives us a good balance of:

- fast setup
- one shared codebase
- Android and web support
- architecture that stays understandable while learning

For this project, getting a useful Android and web app from the same codebase mattered more than using the most custom setup possible.

## High-Level Project Structure

Important top-level areas:

- [`app/`](app)
- [`components/`](components)
- [`contexts/`](contexts)
- [`data/`](data)
- [`scripts/`](scripts)
- [`utils/`](utils)
- [`Cooking/`](Cooking)
- [`docs/`](docs)
- [`README.md`](README.md)
- [`package.json`](package.json)
- [`app.json`](app.json)

## Documentation Review Workflow

The project now has a manual, draft-only documentation review script.

Command:

```powershell
corepack pnpm run review:docs
```

Purpose:

- inspect the current repo state before proposing documentation updates
- detect user-visible feature changes, architecture changes, dependency changes, and workflow changes
- compare those findings against `README.md` and `docs/knowledge-base.md`
- produce a structured draft report without editing either file

The report always uses this structure:

- `New since last docs update`
- `README changes needed`
- `Knowledge-base changes needed`
- `Potential stale statements to remove`
- `Confidence / manual review notes`

This matters because not all project changes are made inside Codex, so documentation updates must be derived from the repo itself rather than chat history.

If you want to save the report instead of printing it only to the terminal:

```powershell
node scripts/review-documentation.mjs --output .\\dist\\documentation-review.md
```

## App Architecture

The app is currently organized into four main layers:

1. routes
2. shared state
3. data generation and utilities
4. shared components and theming

### 1. Routes

Routes live in [`app/`](app).

Important route files:

- [`app/_layout.tsx`]
- [`app/add-recipe.tsx`]
- [`app/account.tsx`]
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

What this layer does:

- defines the screens users can visit
- maps files to URLs and app routes
- renders page-level UI
- wires screens to shared data, styles, and state

[`app/_layout.tsx`] is especially important because it:

- wraps the app in providers
- defines the shared stack navigator
- controls the shared header
- swaps the header title to `KH` on compact widths
- exposes the Home, My Recipes, Kitchen Guides, cook timer, settings, and account actions across screens

### 2. Shared State

App-wide state lives in [`contexts/`](contexts).

Important files:

- [`contexts/auth-context.tsx`]
- [`contexts/cook-timer-context.tsx`]
- [`contexts/custom-recipes-context.tsx`]
- [`contexts/favorites-context.tsx`]
- [`contexts/ratings-context.tsx`]
- [`contexts/recipe-order-context.tsx`]
- [`contexts/settings-context.tsx`]

What this layer currently handles:

- signed-in user auth state and session restore
- cloud-synced user recipes
- synced overrides for imported recipes
- deleted-recipe undo state
- favorite recipe slugs
- recipe ratings (stored per user, synced)
- recipe display order (drag-and-drop reordering, synced per user)
- dark mode
- keep-screen-awake cook mode
- the number of cook-timer slots
- the confirm-delete preference
- the Kitchen Guides default view setting
- whether recipe reordering is enabled
- the handoff to account-level auth and export flows
- the shared cook-timer popup and timer state
- opening and closing the settings overlay
- local caching and persistence through AsyncStorage

This layer matters because it keeps app-wide behavior from being duplicated separately on every screen.

### 3. Data Generation and Utilities

This is where source content gets turned into app-ready data.

Important files:

- [`data/obsidian-recipes.ts`]
- [`data/cooking-dictionary.ts`]
- [`data/cooking-tips.ts`]
- [`scripts/generate-obsidian-recipes.mjs`]
- [`scripts/generate-cooking-dictionary.mjs`]
- [`utils/supabase-sync.ts`]
- [`utils/ai-recipe-import.ts`]
- [`utils/allergen-tags.ts`]
- [`utils/ingredient-scaling.ts`]
- [`utils/recipe-metadata.ts`]
- [`utils/recipe-order.ts`]
- [`utils/scaled-directions.ts`]
- [`supabase/functions/recipe-import/index.ts`]
- [`Cooking/`](Cooking)

How this layer works:

- recipe Markdown notes live in [`Cooking/`](Cooking)
- recipe resources also live there, including the glossary file and conversion resources
- `scripts/generate-obsidian-recipes.mjs` parses the recipe notes
- that script writes structured output into [`data/obsidian-recipes.ts`]
- `scripts/generate-cooking-dictionary.mjs` parses [`Cooking/Resources/New Custom Cooking Dictionary.md`]
- that script writes structured glossary output into [`data/cooking-dictionary.ts`]
- route files read those generated data files to render screens
- [`utils/allergen-tags.ts`] helps detect and normalize allergen tags
- [`utils/ingredient-scaling.ts`] scales ingredient text for recipe pages
- [`utils/scaled-directions.ts`] normalizes direction steps, detects scale-sensitive cues, and generates step annotations
- [`utils/web-recipe-import.ts`] parses recipe pages for website import
- `app/recipe.tsx` now renders the imported-only `Sample Recipes` library from generated Obsidian recipe data

### 4. Shared Components and Theming

Reusable UI pieces live in [`components/`](components).

Important files:

- [`components/cook-timer-modal.tsx`]
- [`components/clearable-search-input.tsx`]
- [`components/draggable-recipe-list.tsx`]
- [`components/kitchen-styles.ts`]
- [`components/notice-pie-timer.tsx`]
- [`components/progress-bar.tsx`]
- [`components/rating-filter-chip.tsx`]
- [`components/recipe-share-card.tsx`]
- [`components/scaled-directions-list.tsx`]
- [`components/share-icon.tsx`]
- [`components/star-rating.tsx`]
- [`components/app-theme.ts`]
- [`components/settings-menu.tsx`]
- [`app/account.tsx`]

What this layer does:

- centralizes shared styles
- defines the light and dark palettes
- provides the shared settings gear and overlay
- provides the shared header actions for Home, My Recipes, Kitchen Guides, cook timer, settings, and account
- provides the shared cook timer popup
- provides clearable search fields for recipe and reference browsing
- provides recipe-card rendering used by single and selected recipe sharing
- provides the delete notice pie-timer UI
- keeps route files focused on screen behavior instead of duplicated UI plumbing

Current shared header behavior:

- `🏠` returns to the home hub and is disabled on `/`
- `🍳` opens `My Recipes` and is disabled on `/my-recipes`
- `📖` opens `Kitchen Guides` and is disabled on `/reference`
- `⏳` opens the shared cook timer
- `⚙` opens the shared settings overlay
- `👤` opens `Account` and is disabled on `/account`

The disabled state uses a grayed-out, reduced-opacity treatment so users can still see where they are in the app without triggering redundant navigation.

## Simple Data Flow

A good mental model for the app is:

1. source recipes and reference files live in [`Cooking/`](Cooking)
2. generator scripts turn them into typed app data in [`data/`](data)
3. route files in [`app/`](app) render that data
4. shared contexts provide auth, synced recipe state, favorites, settings, and theme state
5. shared components and styles keep the UI consistent across screens

That is the current backbone of the project.

## What The App Does Right Now

The app is still a prototype, but it is already useful.

Current capabilities:

- a home screen that acts as a kitchen tools hub
- home menu cards for `My Recipes`, `Sample Recipes`, and `Kitchen Guides`
- an Add Recipe shortcut on the home screen, including a floating/sticky mobile action button
- shared header shortcuts for Home, My Recipes, Kitchen Guides, cook timer, settings, and account
- compact mobile header titles that collapse to `KH`
- a `Sample Recipes` screen for imported-only browsing of the sample Obsidian recipe set
- a consolidated `Kitchen Reference` screen with conversions, substitutions, dictionary tabs, and interactive conversion sliders for oven temperature, liquid measure, dry measure, butter/olive oil substitution, gallons, quarts, liters, and tsp/ml
- dedicated searchable routes for conversions, substitutions, and the cooking dictionary
- sticky search bars on recipe and reference browsing screens, with clear buttons when search text is entered
- a `My Recipes` page backed by real Obsidian recipe notes
- account-backed recipe sync across devices
- recipe creation in a shared synced library
- photo-based recipe import that prefills the add-recipe form
- website import that prefills the add-recipe form
- a dedicated `Account` screen for sign-in, sync state, export, and importer guidance
- recipe editing for both app-created and imported recipes
- per-step direction editing with local overrides
- filtering recipes by category, cuisine region, favorites, and allergen tags
- multi-select recipe filters for category, cuisine region, and allergen tags
- searching recipes by title, category, cuisine region, and allergy tags
- sticky search overlays for long recipe and reference lists
- bulk recipe selection with checkboxes
- desktop shift-click range selection
- bulk metadata editing
- bulk favorites
- single-recipe share cards and bulk `Share Selected` from `My Recipes`
- bulk delete with confirmation
- delete undo notices with a 10-second visual timer
- clickable recipe detail pages generated from Markdown
- parsed ingredients and directions from recipe notes
- prep, cook, and total time where the note supports it
- ingredient scaling controls including `1/4x`, `1/2x`, preset servings, and a custom `1-10` selector, with the serving count tag updating dynamically as the multiplier changes
- ingredient scaling handles mixed numbers (`1 1/2 cups`), unicode fractions (`½`, `¼`), and ampersand/and-separated quantities (`2 & 1/2`)
- context-aware cook-time tag that reads "Bake" for baked dishes and "Cook" for stovetop dishes, inferred from recipe title and direction text
- allergen and allergy-friendly tags on recipes
- auto-detected allergen tags that remain editable
- cuisine-region tags and filters
- favorite recipe toggles with persistent storage
- recipe ratings with star controls on detail pages and My Recipes cards
- rating-based filter toggle in My Recipes and Sample Recipes
- drag-and-drop recipe reordering in My Recipes (enable via settings; order synced per user)
- a shared settings menu from the header gear, including Kitchen Guides default view and reorder toggle
- dark mode
- keep-screen-awake cook mode
- all-recipes and filtered PDF export from the Account screen
- a global shared cook timer popup/modal with a configurable number of timer slots
- a loading progress bar shown during AI import and PDF export
- responsive layouts for both Android and web

What it does not yet support:

- pantry tracking
- grocery list generation
- dedicated step-linked cooking mode
- expanding the Cooking Tips content beyond the initial set

## Obsidian Recipe Integration

The app now uses real recipe data from the [`Cooking/`](Cooking) folder.

The recipe generator currently tries to extract:

- title
- slug
- category
- ingredients
- directions
- servings
- prep time
- cook time
- total time
- allergen tags
- allergy-friendly tags

The servings parser recognizes common labels such as `servings`, `serving size`, `serves`, `yield`, and `makes`. Those metadata lines are skipped while collecting ingredients, directions, and notes, so serving metadata does not reappear as body content.

A practical rule we settled on:

- `prep time` should only come from explicit metadata or clearly reliable note content
- `cook time` can be inferred more safely from clear phrases such as bake or simmer durations

That keeps recipe timing more trustworthy.

Notes are only emitted when the source note has actual note content. Empty note headings are ignored, and time/serving metadata stays in structured fields instead of being duplicated into the notes panel.

Imported recipes are still editable in the app because synced overrides are stored separately from the original Markdown notes.

That means:

- the vault stays untouched
- the app can still support edits, tags, metadata cleanup, and hidden-state overrides
- imported recipes and app-created recipes behave much more similarly in the UI

## Sample Recipes Library

The `/recipe` route is no longer a hand-authored prototype screen.

It now serves as `Sample Recipes`, an imported-only library screen built from the generated Obsidian recipe dataset.

Inclusion rule:

- `Appetizers`
- `Dessert`
- `Entree`
- `Breakfast`

Behavior:

- only imported Obsidian recipes appear there
- app-created recipes stay exclusive to `My Recipes`
- synced overrides still apply
- hidden imported recipes stay hidden there too for the signed-in user
- tapping a card opens the existing imported recipe detail route

This keeps `Sample Recipes` useful as a clean sample library while `My Recipes` remains the broader personal working library.

## Scaled Directions

Recipe directions are now treated as normalized steps internally, even though the source content still comes from simple text sections.

Important files:

- [`utils/scaled-directions.ts`](utils/scaled-directions.ts)
- [`components/scaled-directions-list.tsx`](components/scaled-directions-list.tsx)
- [`contexts/custom-recipes-context.tsx`](contexts/custom-recipes-context.tsx)

Current behavior:

- directions are normalized into stable step objects with step IDs
- each step is analyzed for scaling-sensitive cues such as:
  - time mentions
  - temperatures
  - vessel dimensions and equipment words
  - surface-cooking verbs like `sear` or `fry`
  - deep-cook verbs like `bake` or `roast`
  - doneness cues like `golden`, `set`, or `toothpick`
- the UI preserves the original direction text and adds annotations on top of it
- scale-related warnings are generated per step rather than rewriting recipe prose
- edited steps are stored as local per-step overrides
- reset returns the step to the original source text and re-enables automatic annotations
- highlighted time mentions in direction steps are tappable — tapping one calls `loadTimerSlot` on the cook timer context with the parsed duration and recipe name as the label, then opens the timer popup if a slot was successfully loaded
- highlighted cooking-method and equipment words are now also tappable — tapping one opens a native Modal popup listing that step's scale-relevant annotations (severity-coded warnings and notes) with a Close button

Important product decision:

- timers stay visible as original times and highlighted time spans are tappable to open the timer
- temperatures are highlighted using palette-aware theme colors (not hardcoded hex), not scaled
- doneness cues are emphasized using palette-aware theme colors because they remain more reliable than the timer when scale changes
- cook-method and equipment highlights use their own palette colors (`highlightMethod`/`highlightEquipment`) so they are visually distinct from time and temperature highlights
- once a step is edited, the app stops auto-appending annotations to that step until it is reset

## Cooking Dictionary

The cooking dictionary page is based on:

- [`Cooking/Resources/New Custom Cooking Dictionary.md`]

The parser converts that glossary into [`data/cooking-dictionary.ts`], which the app renders as searchable term cards.

The current parser supports the newer custom glossary format:

- `## A`
- `**Term** — Definition`

Recent cleanup details that mattered here:

- the page now uses a full `A-Z` selector
- letters with no entries are visibly disabled
- sorting was adjusted to behave more like a real glossary
- dictionary tabs now include focused views for `Cheeses` and `Breads` in addition to the existing general, spice, oil, alcohol, and instrument groups

The Kitchen Reference conversions tab is now fully interactive. Every measurement section uses a custom slider built from pan gesture handlers, with preset buttons for common values:

- `Oven temperatures` — Fahrenheit slider from `200F` to `550F` with presets like `325F`, `350F`, `400F`
- `Liquid measure` — fluid ounces (`1–32 oz`) to milliliters, with presets at common pour sizes
- `Dry measure` — cups (`1/4–4 cups`) to fluid ounces
- `Butter to olive oil` — teaspoon-based substitution using a `0.75` ratio
- Gallons, quarts, liters, and tsp/ml sections with their own ranges and presets

All sliders were converted from the original static card layout. The `components/sample-data.ts` static conversion entries were trimmed accordingly.

## Sticky Search

Sticky search uses paired inline and overlay search inputs tied to scroll position on the main recipe and reference browsing surfaces, so search remains reachable after users scroll past the original search field.

Search inputs use the shared [`components/clearable-search-input.tsx`](components/clearable-search-input.tsx) component. When the field has text, it shows a clear button that resets the value without requiring users to manually delete the query.

## Settings System

The app has a shared settings menu that can be opened from the gear icon in the shared header.

Important files:

- [`app/_layout.tsx`]
- [`components/settings-menu.tsx`]
- [`contexts/settings-context.tsx`]
- [`components/app-theme.ts`]

Current saved settings:

- `Restore defaults`
- `Dark mode`
- `Keep screen awake`
- `Number of timers`
- `Allow vibration`
- `Timer sound`
- `Confirm delete`
- `Kitchen Guides default view` — which tab opens first when navigating to Kitchen Guides
- `Enable recipe reordering` — toggles drag-and-drop mode in My Recipes

How it works:

- settings are stored locally with AsyncStorage
- auth sessions are stored locally and refreshed on launch
- restore defaults is an immediate in-app action, not just a placeholder label
- restore defaults immediately resets dark mode to Off, keep screen awake to Off, vibration to On, timer sound to `Beep Beep`, confirm delete to On, and timer count to 3
- dark mode swaps between centralized light and dark palettes
- keep-awake mode uses `expo-keep-awake`
- timer count controls how many timer slots the shared cook timer exposes and is clamped to `1-6`
- allow vibration controls phone vibration when a cook timer ends; it defaults to On and only appears on iOS/Android
- timer sound controls the cook-timer completion alert and offers `Beep Beep`, `Soft Chime`, `Classic Bell`, and `Urgent Alarm`
- confirm delete controls whether single app-recipe deletion asks first
- bulk delete still always confirms, even if the single-delete setting is turned off
- Kitchen Guides default view saves which reference tab the user uses most so they land there instead of the first tab
- recipe reordering is off by default so the normal list experience is unaffected for users who don't want drag-and-drop
- the settings UI is implemented as a shared in-app overlay rather than relying on more fragile native UI primitives
- the scrollable settings overlay uses a backdrop, a sheet, fixed-width controls, and max-width/max-height constraints so the same modal remains usable on compact mobile screens and larger web layouts

The dedicated Account screen now owns account-facing actions:

- sign in and sign up
- `Account Sync` helper copy that says `Sign in to sync recipes across devices.`
- signed-out password reset from the `Forgot password` action
- sync status and sign out
- PDF export
- importer guidance and compatibility notes

The restore-defaults flow is deliberately immediate:

- tapping it resets the saved preferences right away
- the settings overlay stays open so the user can keep adjusting values after the reset
- the UI briefly shows the checked-state feedback before returning to the normal button state

This was a useful architecture milestone because it introduced real app-wide persisted state.

## PDF Export

The app supports exporting the full recipe library or a filtered recipe subset to a single PDF from the Account screen.

The export builds a single cookbook-style PDF from the merged recipe library, using local overrides as the effective source of truth for exported content.

Important files:

- [`app/account.tsx`](app/account.tsx)
- [`utils/export-recipes.ts`](utils/export-recipes.ts)
- [`utils/recipe-metadata.ts`](utils/recipe-metadata.ts)
- [`contexts/custom-recipes-context.tsx`](contexts/custom-recipes-context.tsx)

Current behavior:

- the export uses the same effective recipe view the app treats as canonical
- app-created recipes are included
- Obsidian recipes are included
- local overrides are treated as canonical for export
- the Account screen can filter selected exports by recipe type, allergy-friendly tags, allergen tags, cook time, and prep time
- selected export filters use AND logic across filter groups and OR logic within a group
- time thresholds parse human-readable metadata, use the upper bound for ranges, and exclude missing or unparseable times when active
- the PDF includes metadata, tags, ingredients, directions, notes, and source attribution when present
- web downloads the PDF
- Android tries to save the PDF into a folder selected by the user and falls back to the share sheet if that step is skipped

Implementation notes:

- the export pipeline first builds a normalized `ExportRecipe[]` list
- filtered exports pass a filtered `ExportRecipe[]` list into the same PDF pipeline as the full export
- it then renders cookbook-style HTML
- native uses `expo-print`
- web uses `html2pdf.js`
- Android file saving uses `expo-file-system`

PDF export is distinct from recipe-card sharing. The Account screen owns cookbook-style PDFs, while `My Recipes` owns single-recipe sharing and selected-recipe sharing from the current library selection.

## Account And Recipe Sync

Recipe sync now uses a Supabase-backed auth and database layer instead of per-device local-only recipe storage.

Important files:

- [`app/account.tsx`](app/account.tsx)
- [`contexts/auth-context.tsx`](contexts/auth-context.tsx)
- [`contexts/custom-recipes-context.tsx`](contexts/custom-recipes-context.tsx)
- [`utils/supabase-sync.ts`](utils/supabase-sync.ts)
- [`docs/supabase-sync.sql`](docs/supabase-sync.sql)

Current behavior:

- users create an account or sign in from the Account screen
- sessions are restored from local storage on launch and refreshed when needed
- user-created recipes sync through the backend
- imported recipe overrides sync through the backend
- older local-only recipe data is migrated once after sign-in
- AsyncStorage keeps a per-user cache for startup speed and offline fallback

This was added so mobile and web can share one recipe library without introducing a custom backend service inside this repo.

## Favorites System

Favorite recipes are stored locally and can be toggled from both the recipe list and recipe detail pages.

Important files:

- [`contexts/favorites-context.tsx`]
- [`app/my-recipes.tsx`]
- [`app/recipes/[slug].tsx`]

This remains a local personalization feature separate from the synced recipe backend.

## Custom Recipes And Overrides

The app now has a second recipe-storage path in addition to generated Obsidian data.

Important file:

- [`contexts/custom-recipes-context.tsx`]

This context now manages:

- synced recipes created in the app
- synced edits to imported recipes
- bulk metadata changes
- recently deleted recipe data for undo
- website import attribution through a dedicated `Source` structure
- original directions plus per-step direction overrides for scaled recipe editing
- per-user cached copies of synced recipe data for startup and offline fallback

This approach was chosen so we could support editing everywhere without writing back into the original `Cooking` vault, while still keeping one shared recipe library across signed-in devices.

## Photo Recipe Import: Local OCR And AI Import

The add-recipe flow now has three starting modes:

- manual entry
- photo import (local OCR or AI-powered)
- website URL

The Account screen also includes high-level importer guidance and compatibility notes, but the docs intentionally avoid a hard-coded site list because those results change frequently.

### On-Device OCR (ML Kit)

The original photo path:

- pick up to two recipe images from the device
- run local OCR on the selected images in order
- parse the recognized text into title, ingredients, directions, and notes
- prefill the normal add-recipe form for review

This path uses a native ML Kit module and is intended for a native development build rather than Expo Go.

Important files:

- [`app/add-recipe.tsx`](app/add-recipe.tsx)
- [`utils/ocr-recipe-parser.ts`](utils/ocr-recipe-parser.ts)
- [`app.json`](app.json)

### AI Import (Claude API)

The AI import path sends recipe photos to a Supabase edge function that calls the Claude API:

- pick up to two recipe images from the device
- choose a tier: `fast` (quicker, lower detail) or `accurate` (more thorough extraction)
- the edge function calls Claude with the images and a structured extraction prompt
- Claude returns a complete recipe object: title, ingredient sections, direction sections, prep/cook time, servings, notes, suggested category, cuisine region, allergen tags, and allergy-friendly tags
- the result prefills the normal add-recipe form for review

Important files:

- [`app/add-recipe.tsx`](app/add-recipe.tsx)
- [`utils/ai-recipe-import.ts`](utils/ai-recipe-import.ts)
- [`supabase/functions/recipe-import/index.ts`](supabase/functions/recipe-import/index.ts)
- [`supabase/functions/recipe-import/README.md`](supabase/functions/recipe-import/README.md)

Setup requires:

- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
- the `recipe-import` edge function deployed to Supabase
- an `ANTHROPIC_API_KEY` secret set on the edge function

`aiImportIsConfigured()` in `utils/ai-recipe-import.ts` checks whether the required env vars are present; the UI only shows the AI path when that check passes.

The website path works like this:

- paste a recipe URL
- fetch the page
- look for recipe JSON-LD or other structured recipe metadata
- extract title, ingredients, directions, and suggested category when possible
- extract attribution metadata such as website name, author, and source URL
- prefill the normal add-recipe form for review

Important files:

- [`app/add-recipe.tsx`](app/add-recipe.tsx)
- [`utils/web-recipe-import.ts`](utils/web-recipe-import.ts)
- [`contexts/custom-recipes-context.tsx`](contexts/custom-recipes-context.tsx)

Important product decision:

- attribution metadata does not get pushed into `notes`
- website-imported recipes store a dedicated `Source` block instead
- saved recipe pages render that `Source` block directly under the title area

Important limitation:

- this importer is less reliable on web because many sites block direct browser fetches with CORS
- native builds are the more reliable environment for URL import

One useful integration detail:

- website-imported instruction strings now go through the same direction-step splitter used by the scaled-directions system
- that keeps imported directions more consistent with imported Markdown notes and app-authored recipes

## Bulk Selection And Bulk Actions

`My Recipes` has grown into a real library-management screen.

Current bulk behaviors include:

- checkbox selection on recipe cards
- whole-card selection highlighting
- `Select All`
- desktop `Shift+click` range selection
- bulk favorite
- `Share Selected` for selected recipe cards
- bulk metadata editing
- bulk delete with required confirmation

One important product decision here:

- bulk delete applies to the full visible library
- imported recipes are hidden locally through recipe overrides instead of deleting the source Markdown files
- app-saved recipes still use the undo banner because they are removed from app storage

Sharing selected recipes builds hidden recipe-card views first, then hands those cards to the platform share flow. This keeps selected sharing separate from the Account screen's PDF export workflow.

## Allergen And Metadata Tagging

Recipe metadata is now richer and more editable than the original first version.

Current metadata behavior includes:

- auto-detected allergen tags
- editable allergy-friendly tags
- optional cuisine-region tags
- multi-select filtering in the recipe library

This metadata can come from:

- imported recipe parsing
- manual add/edit forms
- local override edits
- bulk metadata actions

The visual system is also intentional:

- orange for allergen tags
- green for allergy-friendly tags
- light blue for cuisine-region tags

## Cook Timer

The app now includes a global shared cook timer popup/modal available from the header on every screen.

Important files:

- [`components/cook-timer-modal.tsx`]
- [`contexts/cook-timer-context.tsx`]
- [`components/settings-menu.tsx`]
- [`contexts/settings-context.tsx`]

Current behavior:

- configurable timer slots from `1-6`
- custom timer names
- whole-minute or `mm:ss` input with numeric/decimal keyboard support (`.` is treated as `:`)
- shrinking horizontal progress bars
- selectable completion sound at zero, defaulting to a looping `Beep Beep` pattern
- optional vibration on supported native devices when `Allow vibration` is enabled
- `Start`, `Pause`, and `Resume` labels that track real timer state
- `Reset` stays disabled until the timer has actually been started
- `loadTimerSlot(label, durationMs)` is a context API that finds the first available slot (preferring unused over paused), sets its label and duration, and returns `true` if successful; direction step links use this to pre-load a timer from a tapped time highlight

The timer popup is global, which keeps it accessible while moving around the app.

## Recipe Ratings

Ratings let users score each recipe from 1–5 stars.

Important files:

- [`components/star-rating.tsx`](components/star-rating.tsx)
- [`components/rating-filter-chip.tsx`](components/rating-filter-chip.tsx)
- [`contexts/ratings-context.tsx`](contexts/ratings-context.tsx)
- [`app/my-recipes.tsx`](app/my-recipes.tsx)
- [`app/recipes/[slug].tsx`](app/recipes/[slug].tsx)
- [`app/user-recipes/[slug].tsx`](app/user-recipes/[slug].tsx)

Current behavior:

- star controls appear on recipe detail pages and in My Recipes list cards
- ratings are stored per user and synced through Supabase
- `ratings-context.tsx` owns the load, save, and optimistic-update flow
- a `RatingFilterChip` in My Recipes and Sample Recipes lets users show only rated recipes or filter by minimum star count
- ratings are also included in PDF export and share cards

Design decision:

- ratings are kept separate from recipe data so they don't require a recipe edit to change
- Sample Recipes shows ratings pulled from sample data (added at the same time as the reorder feature) so the library feels more useful out of the box

## Recipe Reordering

Users can drag and drop recipes into a custom order in My Recipes.

Important files:

- [`components/draggable-recipe-list.tsx`](components/draggable-recipe-list.tsx)
- [`contexts/recipe-order-context.tsx`](contexts/recipe-order-context.tsx)
- [`utils/recipe-order.ts`](utils/recipe-order.ts)
- [`utils/haptics.ts`](utils/haptics.ts)
- [`docs/supabase-sync.sql`](docs/supabase-sync.sql)

Current behavior:

- reorder mode is opt-in via a toggle in Settings (`Enable recipe reordering`)
- when enabled, My Recipes switches from the normal list to `DraggableRecipeList`
- dragging a card uses animated gesture handlers; a haptic pulse fires when a card is picked up
- the resolved order is persisted to Supabase so it syncs across devices for the signed-in user
- `recipe-order-context.tsx` owns the order array and exposes `setOrder` and `resetOrder`
- `utils/recipe-order.ts` handles merging new recipes into an existing saved order without disrupting the user's arrangement

The Supabase schema addition for this feature is in `docs/supabase-sync.sql`.

## Cooking Tips

A `Cooking Tips` tab was added to the Kitchen Guides (Reference) screen.

Important files:

- [`data/cooking-tips.ts`](data/cooking-tips.ts)
- [`app/reference.tsx`](app/reference.tsx)

Current behavior:

- tips live in `data/cooking-tips.ts` as a flat array of `{ title, body }` objects
- the Reference screen renders them as cards in the Tips tab
- the default tab that opens in Kitchen Guides is now user-configurable via Settings (`Kitchen Guides default view`)

Design decision:

- tips are static app data rather than user-editable, so they live in a generated data file rather than Supabase
- the default view setting lets users who primarily use the dictionary or conversions avoid landing on Tips each time

## Context-Aware Cook-Time Tag

The cook-time tag used to hardcode "Bake" for desserts and "Cook" for everything else. It now uses a detection function to pick the right verb regardless of category.

Important files:

- [`utils/recipe-metadata.ts`](utils/recipe-metadata.ts)

How `resolveCookVerb` works (in priority order):

1. **Title is authoritative** — if the title contains `no-bake`, return Cook; if it contains `baked`, `baking`, `bake`, or `roast(ed/ing)`, return Bake
2. **Directions oven cues** — if directions mention `preheat`, `oven`, `bake`, `roast`, or a 3-digit temperature, return Bake (unless directions also explicitly say `no-bake`)
3. **Dessert default with chilled-cue override** — desserts with `icebox`, `refrigerat…`, `chill…`, `freez…`, or `frozen` return Cook; otherwise keep Bake as the dessert default
4. **General default** — return Cook

`formatCookTimeTag(recipe, cookTime)` now accepts the full recipe object (needs `title`, `category`, `directions`) instead of just `category`. The add/edit form preview passes a synthetic object constructed from the live form state.

## Ingredient Scaling: Mixed Numbers And Extended Units

The scaling algorithm was significantly improved to handle real-world recipe formats.

Important file:

- [`utils/ingredient-scaling.ts`](utils/ingredient-scaling.ts)

Changes:

- **Mixed numbers** — quantities like `1 1/2`, `2 & 1/2`, `2 and 1/2` are parsed and scaled correctly
- **Unicode fractions** — `½`, `¼`, `¾`, and other unicode fraction characters are recognized as numeric values
- **Parenthetical measurements** — quantities in parentheses (often weight equivalents like `(200g)`) are handled without corrupting the scaled output
- **Extended unit word map** — the singular/plural unit map was expanded to cover a large set of produce and common ingredient descriptors (onion/onions, leaf/leaves, slice/slices, etc.) so scaled quantities use the correct grammatical form

## Loading Progress Bar

A shared `ProgressBar` component shows progress during long operations.

Important files:

- [`components/progress-bar.tsx`](components/progress-bar.tsx)
- [`app/add-recipe.tsx`](app/add-recipe.tsx)
- [`app/account.tsx`](app/account.tsx)

Current usage:

- shown during AI photo import (progress advances as the edge function responds)
- shown during PDF export on the Account screen
- the component accepts a `0–1` progress value and renders an animated fill bar

## Expo Go Dependency Lesson

One of the more important debugging lessons so far came from Expo Go on Android.

The app was failing with this native error:

- `java.lang.String cannot be cast to java.lang.Boolean`

At first the UI looked suspicious, but the real cause was Expo dependency mismatch, not the screen code.

`npx expo-doctor` and `npx expo install --check` revealed that several packages were out of alignment with Expo SDK 54, including:

- `@react-native-async-storage/async-storage`
- `expo-keep-awake`
- `react-native-safe-area-context`
- `react-native-screens`

After aligning those package versions to Expo SDK 54-compatible releases:

- `npx expo-doctor` passed
- `npx expo install --check` reported everything up to date
- Expo Go started working correctly again

That was an important reminder that native-feeling runtime errors in Expo are sometimes dependency alignment problems rather than component bugs.

## React Key Warning Lesson

React duplicate-key warnings in the Expo/dev console should be treated as real rendering signals, even if a finished production APK may not show the warning text.

The dictionary and substitutions pages both hit this when list keys were built from display fields that looked unique but were not:

- the dictionary `All` tab combined categories, so valid terms like `Zester` and `Yeast` appeared more than once
- the Egg-free substitutions included two valid `1 egg` swaps, which both produced the same `Egg-free-1 egg` key

The useful fix pattern is to preserve valid duplicated content and make the React key include enough rendering context to be unique. Category, letter, swap text, and list index can be used as disambiguators when the source data does not have a dedicated stable id.

## Configuration Files

### [`package.json`](package.json)

This file defines:

- dependencies
- scripts
- project metadata

Important scripts currently include:

- `start`
- `android`
- `ios`
- `web`
- `review:docs`
- `sync:recipes`
- `sync:dictionary`

It also sets:

- `"main": "expo-router/entry"`

That tells Expo to boot the app through Expo Router.

### [`app.json`](app.json)

This file contains Expo app configuration such as:

- app name and slug
- Android and web settings
- plugin setup

One important detail is the Expo Router plugin configuration that supports the routed app structure.

### [`README.md`](README.md)

The README is the shorter overview.

This knowledge base is where we keep:

- deeper explanation
- project history
- architecture notes
- lessons learned

## Useful Commands

```powershell
corepack pnpm run web
corepack pnpm run android
corepack pnpm sync:recipes
corepack pnpm sync:dictionary
.\node_modules\.bin\tsc.cmd --noEmit
npx expo-doctor
npx expo install --check
```

## What Has Been Verified

The project has been checked with:

### TypeScript

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```

Purpose:

- verify the TypeScript code compiles cleanly

### Expo Doctor

```powershell
npx expo-doctor
```

Purpose:

- verify the Expo dependency/config setup is healthy

### Expo Version Check

```powershell
npx expo install --check
```

Purpose:

- verify Expo package versions match the SDK expectations

### Web Export

```powershell
.\node_modules\.bin\expo.cmd export --platform web
```

Purpose:

- verify the app can bundle for web successfully

## Architecture Direction

The project is moving toward a structure where Kitchen Helper becomes a practical cooking companion instead of just a recipe browser.

Likely next layers include:

1. a more dedicated cook-mode screen
2. better recipe metadata normalization
3. more structured recipe import flows
4. more bulk-management actions
5. deeper timer integration with recipe steps

## Change Log So Far

High-level sequence of what has happened:

1. chose the cooking app idea
2. chose Expo for Android and web support
3. chose `pnpm` as the package manager
4. created the Expo project
5. added web support packages
6. built the first cooking-app prototype screen
7. added the README
8. converted the app to Expo Router
9. split the app into real routed screens and shared files
10. added the knowledge base
11. added menu routes for conversions, substitutions, and `My Recipes`
12. connected `My Recipes` to the actual Obsidian recipe inventory
13. added generated recipe detail pages with Markdown parsing
14. added serving controls and ingredient scaling
15. expanded the conversions and substitutions references
16. added recipe filtering and searching
17. added prep/cook time extraction and display
18. added allergen and allergy-friendly tags
19. added favorites with persistent storage
20. added the shared settings system with dark mode and keep-awake
21. debugged the Expo Go Android failure and fixed package alignment issues
22. added the cooking dictionary page and dictionary generator
23. added source citation for the glossary and cleaned up the parser output
24. added local recipe creation in app storage
25. added recipe editing for both local and imported recipes through overrides
26. added cuisine-region metadata and filters
27. added delete flows, undo notices, and the confirm-delete setting
28. added bulk selection, bulk favorites, bulk metadata, and shift-click range selection
29. added a shared cook timer popup with audio, vibration, and timer progress UI
30. added website-based recipe import with dedicated source attribution
31. replaced the old glossary source with a custom cooking dictionary and updated the parser
32. added a scaled-directions pipeline with per-step analysis, highlights, and local step overrides
33. added all-recipes PDF export for web and Android
34. replaced the old `/recipe` prototype with the imported-only `Sample Recipes` library
35. added Supabase-backed account auth and cross-device recipe sync
36. improved the settings modal with a scrollable mobile-friendly in-app sheet
37. added Android immersive system navigation with swipe reveal, resume re-hide, and tap re-hide behavior
38. resolved duplicate React key warnings for dictionary and allergy substitution cards
39. added a home-screen Add Recipe shortcut, including the floating/sticky mobile action button
40. added clear buttons to shared recipe and reference search fields
41. added single-recipe share cards and `Share Selected` for bulk-selected recipes
42. replaced the static oven temperature reference with an interactive slider and preset buttons
43. added cheese and bread dictionary categories and cleaned up sample recipe data
44. normalized Obsidian servings import and omitted empty or metadata-only note content
45. scaled the Android app logo assets to fit better
46. converted all Kitchen Reference conversion cards to interactive sliders with presets (liquid measure, dry measure, butter/olive oil, gallons, quarts, liters, tsp/ml join the oven temperature slider)
47. serving count tag now scales dynamically with the ingredient multiplier on recipe detail pages
48. tappable time highlights in recipe directions that pre-load the cook timer with the parsed duration and recipe name, then open the popup
49. fixed Android status bar visibility in light mode by adding a `values-night/styles.xml` override
50. upgraded photo import with Claude API integration via a Supabase edge function (`fast`/`accurate` tier toggle)
51. added recipe ratings with star controls, ratings context, and PDF/share card export
52. added Cooking Tips tab to Kitchen Guides and a Kitchen Guides default view setting in Settings
53. added drag-and-drop recipe reordering in My Recipes (opt-in via Settings; synced per user)
54. added rating filter chip to My Recipes and Sample Recipes
55. added loading progress bar to AI import and PDF export flows
56. improved ingredient scaling to handle mixed numbers, unicode fractions, and ampersand/and-separated quantities
57. expanded unit word map to cover common produce and ingredient terms
58. improved website scanning to fix HTML character entities in imported recipe text
59. added annotation popup: tapping a highlighted cook-method or equipment word in scaled directions opens a modal with per-step scale warnings
60. fixed allergen tag bug on the edit recipe screen
61. made the cook-time tag context-aware (title and direction scanning via `resolveCookVerb`)

## How To Grow This File

As the project continues, this file can keep adding sections like:

- recipe note formatting conventions
- import workflows
- state management decisions
- release/build notes
- testing strategy
- debugging lessons learned

## Working Agreement For Explanations

Going forward, new technical changes can be added here with:

1. what changed
2. why it changed
3. what files were affected
4. what concept it introduces

That keeps this document useful as both a project memory and a learning reference.


