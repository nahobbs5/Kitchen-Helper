# Kitchen Helper Knowledge Base

This file is the longer-form project guide for Kitchen Helper.

The README is the quick orientation document. This knowledge base is where we keep the deeper explanation of how the app works, why certain choices were made, and what changed over time.

## Project Goal

Kitchen Helper is a cross-platform cooking app prototype focused on practical kitchen utilities people can use while they cook.

Current core areas:

- recipe browsing from Obsidian notes
- imported sample-recipe browsing from selected Obsidian folders
- recipe creation and editing in app storage
- photo-based recipe import with local OCR-assisted prefill
- website-based recipe import with source attribution
- ingredient scaling
- scaled directions with per-step annotations
- kitchen conversions
- allergy-friendly substitutions
- cooking glossary lookups
- saved favorites
- bulk recipe management
- cook timers
- app-wide settings
- full-library PDF export

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
- expo-audio
- expo-print
- expo-sharing
- expo-file-system
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
- the shared header stays visible across screens and exposes shortcut buttons for Home, My Recipes, Kitchen Guides, the cook timer, and settings

On compact/mobile widths, the header title collapses to `KH` so the shortcut row still fits cleanly.

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

AsyncStorage is the local persistence layer currently used by the app.

Right now it stores:

- favorite recipes
- saved settings like dark mode and keep-awake mode
- app-created recipes
- local overrides for imported recipes
- deleted-recipe undo state
- website-import source attribution

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
- exposes the Home, My Recipes, Kitchen Guides, cook timer, and settings actions across screens

### 2. Shared State

App-wide state lives in [`contexts/`](contexts).

Important files:

- [`contexts/cook-timer-context.tsx`]
- [`contexts/custom-recipes-context.tsx`]
- [`contexts/favorites-context.tsx`]
- [`contexts/settings-context.tsx`]

What this layer currently handles:

- app-created recipes
- local recipe overrides for imported recipes
- deleted-recipe undo state
- favorite recipe slugs
- dark mode
- keep-screen-awake cook mode
- the number of cook-timer slots
- the confirm-delete preference
- the export action entry point in settings
- the shared cook-timer popup and timer state
- opening and closing the settings overlay
- persistence through AsyncStorage

This layer matters because it keeps app-wide behavior from being duplicated separately on every screen.

### 3. Data Generation and Utilities

This is where source content gets turned into app-ready data.

Important files:

- [`data/obsidian-recipes.ts`]
- [`data/cooking-dictionary.ts`]
- [`scripts/generate-obsidian-recipes.mjs`]
- [`scripts/generate-cooking-dictionary.mjs`]
- [`utils/allergen-tags.ts`]
- [`utils/ingredient-scaling.ts`]
- [`utils/scaled-directions.ts`]
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
- [`components/kitchen-styles.ts`]
- [`components/notice-pie-timer.tsx`]
- [`components/scaled-directions-list.tsx`]
- [`components/app-theme.ts`]
- [`components/settings-menu.tsx`]

What this layer does:

- centralizes shared styles
- defines the light and dark palettes
- provides the shared settings gear and overlay
- provides the shared header actions for Home, My Recipes, Kitchen Guides, cook timer, and settings
- provides the shared cook timer popup
- provides the delete notice pie-timer UI
- keeps route files focused on screen behavior instead of duplicated UI plumbing

Current shared header behavior:

- `🏠` returns to the home hub and is disabled on `/`
- `🍳` opens `My Recipes` and is disabled on `/my-recipes`
- `📖` opens `Kitchen Guides` and is disabled on `/reference`
- `⏳` opens the shared cook timer
- `⚙` opens the shared settings overlay

The disabled state uses a grayed-out, reduced-opacity treatment so users can still see where they are in the app without triggering redundant navigation.

## Simple Data Flow

A good mental model for the app is:

1. source recipes and reference files live in [`Cooking/`](Cooking)
2. generator scripts turn them into typed app data in [`data/`](data)
3. route files in [`app/`](app) render that data
4. shared contexts provide favorites, settings, and theme state
5. shared components and styles keep the UI consistent across screens

That is the current backbone of the project.

## What The App Does Right Now

The app is still a prototype, but it is already useful.

Current capabilities:

- a home screen that acts as a kitchen tools hub
- home menu cards for `My Recipes`, `Sample Recipes`, and `Kitchen Guides`
- shared header shortcuts for Home, My Recipes, Kitchen Guides, cook timer, and settings
- compact mobile header titles that collapse to `KH`
- a `Sample Recipes` screen for imported-only browsing of the sample Obsidian recipe set
- a consolidated `Kitchen Reference` screen with conversions, substitutions, and dictionary tabs
- dedicated searchable routes for conversions, substitutions, and the cooking dictionary
- a `My Recipes` page backed by real Obsidian recipe notes
- recipe creation in app storage
- photo-based recipe import that prefills the add-recipe form
- website import that prefills the add-recipe form
- recipe editing for both app-created and imported recipes
- per-step direction editing with local overrides
- filtering recipes by category, cuisine region, favorites, and allergen tags
- multi-select recipe filters for category, cuisine region, and allergen tags
- searching recipes by title, category, cuisine region, and allergy tags
- bulk recipe selection with checkboxes
- desktop shift-click range selection
- bulk metadata editing
- bulk favorites
- bulk delete with confirmation
- delete undo notices with a 10-second visual timer
- clickable recipe detail pages generated from Markdown
- parsed ingredients and directions from recipe notes
- prep, cook, and total time where the note supports it
- ingredient scaling controls including `1/4x`, `1/2x`, preset servings, and a custom `1-10` selector
- allergen and allergy-friendly tags on recipes
- auto-detected allergen tags that remain editable
- cuisine-region tags and filters
- favorite recipe toggles with persistent storage
- a shared settings menu from the header gear
- dark mode
- keep-screen-awake cook mode
- a full-library PDF export from settings
- a shared cook timer popup with a configurable number of timer slots
- responsive layouts for both Android and web

What it does not yet support:

- user accounts
- sync across devices
- pantry tracking
- grocery list generation
- dedicated step-linked cooking mode

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

A practical rule we settled on:

- `prep time` should only come from explicit metadata or clearly reliable note content
- `cook time` can be inferred more safely from clear phrases such as bake or simmer durations

That keeps recipe timing more trustworthy.

Imported recipes are still editable in the app because local overrides are stored separately from the original Markdown notes.

That means:

- the vault stays untouched
- the app can still support edits, tags, and metadata cleanup
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
- local overrides still apply
- locally hidden imported recipes stay hidden there too
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

Important product decision:

- timers stay visible as original times
- temperatures are highlighted, not scaled
- doneness cues are emphasized because they remain more reliable than the timer when scale changes
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
- `Confirm delete`
- `Export all recipes to PDF` action

How it works:

- settings are stored locally with AsyncStorage
- restore defaults is an immediate in-app action, not just a placeholder label
- restore defaults immediately resets dark mode to Off, keep screen awake to Off, confirm delete to On, and timer count to 3
- dark mode swaps between centralized light and dark palettes
- keep-awake mode uses `expo-keep-awake`
- timer count controls how many timer slots the shared cook timer exposes and is clamped to `1-6`
- confirm delete controls whether single app-recipe deletion asks first
- bulk delete still always confirms, even if the single-delete setting is turned off
- export builds a single cookbook-style PDF from the effective merged recipe library
- web export downloads the file through `html2pdf.js`
- Android export renders the PDF with `expo-print` and tries to save it through the folder picker before falling back to share
- the settings UI is implemented as a shared in-app overlay rather than relying on more fragile native UI primitives

The restore-defaults flow is deliberately immediate:

- tapping it resets the saved preferences right away
- the settings overlay stays open so the user can keep adjusting values after the reset
- the UI briefly shows the checked-state feedback before returning to the normal button state

This was a useful architecture milestone because it introduced real app-wide persisted state.

## PDF Export

The app now supports exporting the full recipe library to a single PDF from Settings.

Important files:

- [`components/settings-menu.tsx`](components/settings-menu.tsx)
- [`utils/export-recipes.ts`](utils/export-recipes.ts)
- [`contexts/custom-recipes-context.tsx`](contexts/custom-recipes-context.tsx)

Current behavior:

- the export uses the same effective recipe view the app treats as canonical
- app-created recipes are included
- Obsidian recipes are included
- local overrides are treated as canonical for export
- the PDF includes metadata, tags, ingredients, directions, notes, and source attribution when present
- web downloads the PDF
- Android tries to save the PDF into a folder selected by the user and falls back to the share sheet if that step is skipped

Implementation notes:

- the export pipeline first builds a normalized `ExportRecipe[]` list
- it then renders cookbook-style HTML
- native uses `expo-print`
- web uses `html2pdf.js`
- Android file saving uses `expo-file-system`

## Favorites System

Favorite recipes are stored locally and can be toggled from both the recipe list and recipe detail pages.

Important files:

- [`contexts/favorites-context.tsx`]
- [`app/my-recipes.tsx`]
- [`app/recipes/[slug].tsx`]

This gives the app one early personalized behavior without needing accounts or a backend.

## Custom Recipes And Overrides

The app now has a second recipe-storage path in addition to generated Obsidian data.

Important file:

- [`contexts/custom-recipes-context.tsx`]

This context stores:

- recipes created in the app
- local edits to imported recipes
- bulk metadata changes
- recently deleted recipe data for undo
- website import attribution through a dedicated `Source` structure
- original directions plus per-step direction overrides for scaled recipe editing

This approach was chosen so we could support editing everywhere without writing back into the original `Cooking` vault.

## Local OCR And Website Recipe Import

The add-recipe flow now has three starting modes:

- manual entry
- photo OCR
- website

The photo path works like this:

- pick a recipe image from the device
- run local OCR on the image
- parse the recognized text into title, ingredients, directions, and notes
- prefill the normal add-recipe form for review

Important files:

- [`app/add-recipe.tsx`](app/add-recipe.tsx)
- [`utils/ocr-recipe-parser.ts`](utils/ocr-recipe-parser.ts)
- [`app.json`](app.json)

One important implementation detail:

- this OCR path uses a native ML Kit module
- that means it is intended for a native development build rather than Expo Go

That tradeoff is worth calling out early so the feature feels predictable during testing.

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
- bulk metadata editing
- bulk delete with required confirmation

One important product decision here:

- bulk delete applies to the full visible library
- imported recipes are hidden locally through recipe overrides instead of deleting the source Markdown files
- app-saved recipes still use the undo banner because they are removed from app storage

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

The app now includes a shared cook timer popup available from the header on every screen.

Important files:

- [`components/cook-timer-modal.tsx`]
- [`contexts/cook-timer-context.tsx`]
- [`components/settings-menu.tsx`]
- [`contexts/settings-context.tsx`]

Current behavior:

- configurable timer slots from `1-6`
- custom timer names
- whole-minute or `mm:ss` input
- shrinking horizontal progress bars
- beep at zero
- vibration on supported native devices
- `Start`, `Pause`, and `Resume` labels that track real timer state
- `Reset` stays disabled until the timer has actually been started

The timer popup is global, which keeps it accessible while moving around the app.

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
33. added full-library PDF export from settings for web and Android
34. replaced the old `/recipe` prototype with the imported-only `Sample Recipes` library

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


