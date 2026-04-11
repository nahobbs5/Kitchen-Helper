# Kitchen Helper Knowledge Base

This file is the longer-form project guide for Kitchen Helper.

The README is the quick orientation document. This knowledge base is where we keep the deeper explanation of how the app works, why certain choices were made, and what changed over time.

## Project Goal

Kitchen Helper is a cross-platform cooking app prototype focused on practical kitchen utilities people can use while they cook.

Current core areas:

- recipe browsing from Obsidian notes
- ingredient scaling
- kitchen conversions
- allergy-friendly substitutions
- cooking glossary lookups
- saved favorites
- app-wide settings

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

Routes are created from files in the [`app/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app) folder.

Examples:

- [`app/index.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\index.tsx) -> `/`
- [`app/my-recipes.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\my-recipes.tsx) -> `/my-recipes`
- [`app/recipes/[slug].tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\recipes\[slug].tsx) -> dynamic recipe pages

This keeps navigation easier to follow as the app grows.

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

## Why This Setup Was Chosen

The stack was chosen because it gives us a good balance of:

- fast setup
- one shared codebase
- Android and web support
- architecture that stays understandable while learning

For this project, getting a useful Android and web app from the same codebase mattered more than using the most custom setup possible.

## Why The App Lives In `kitchen-helper`

The parent workspace folder is:

- `C:\Users\Nathan\Documents\App Ideas`

That is a fine workspace name, but not a good Expo app/package name because of the space and naming rules.

So the actual app lives in:

- [`C:\Users\Nathan\Documents\App Ideas\kitchen-helper`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper)

## High-Level Project Structure

Important top-level areas:

- [`app/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app)
- [`components/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components)
- [`contexts/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts)
- [`data/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\data)
- [`scripts/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\scripts)
- [`utils/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\utils)
- [`Cooking/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\Cooking)
- [`docs/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\docs)
- [`README.md`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\README.md)
- [`package.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\package.json)
- [`app.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app.json)

## App Architecture

The app is currently organized into four main layers:

1. routes
2. shared state
3. data generation and utilities
4. shared components and theming

### 1. Routes

Routes live in [`app/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app).

Important route files:

- [`app/_layout.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\_layout.tsx)
- [`app/index.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\index.tsx)
- [`app/conversions.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\conversions.tsx)
- [`app/cooking-dictionary.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\cooking-dictionary.tsx)
- [`app/allergy-substitutions.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\allergy-substitutions.tsx)
- [`app/my-recipes.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\my-recipes.tsx)
- [`app/recipe.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\recipe.tsx)
- [`app/recipes/[slug].tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\recipes\[slug].tsx)

What this layer does:

- defines the screens users can visit
- maps files to URLs and app routes
- renders page-level UI
- wires screens to shared data, styles, and state

[`app/_layout.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\_layout.tsx) is especially important because it:

- wraps the app in providers
- defines the shared stack navigator
- controls the shared header
- exposes the settings gear across screens

### 2. Shared State

App-wide state lives in [`contexts/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts).

Important files:

- [`contexts/favorites-context.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts\favorites-context.tsx)
- [`contexts/settings-context.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts\settings-context.tsx)

What this layer currently handles:

- favorite recipe slugs
- dark mode
- keep-screen-awake cook mode
- opening and closing the settings overlay
- persistence through AsyncStorage

This layer matters because it keeps app-wide behavior from being duplicated separately on every screen.

### 3. Data Generation and Utilities

This is where source content gets turned into app-ready data.

Important files:

- [`data/obsidian-recipes.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\data\obsidian-recipes.ts)
- [`data/cooking-dictionary.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\data\cooking-dictionary.ts)
- [`scripts/generate-obsidian-recipes.mjs`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\scripts\generate-obsidian-recipes.mjs)
- [`scripts/generate-cooking-dictionary.mjs`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\scripts\generate-cooking-dictionary.mjs)
- [`utils/ingredient-scaling.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\utils\ingredient-scaling.ts)
- [`components/sample-data.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\sample-data.ts)
- [`Cooking/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\Cooking)

How this layer works:

- recipe Markdown notes live in [`Cooking/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\Cooking)
- recipe resources also live there, including the glossary file and conversion resources
- `scripts/generate-obsidian-recipes.mjs` parses the recipe notes
- that script writes structured output into [`data/obsidian-recipes.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\data\obsidian-recipes.ts)
- `scripts/generate-cooking-dictionary.mjs` parses [`Cooking/Resources/Cooking Dictionary.md`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\Cooking\Resources\Cooking%20Dictionary.md)
- that script writes structured glossary output into [`data/cooking-dictionary.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\data\cooking-dictionary.ts)
- route files read those generated data files to render screens
- [`utils/ingredient-scaling.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\utils\ingredient-scaling.ts) scales ingredient text for recipe pages
- [`components/sample-data.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\sample-data.ts) still provides curated prototype content for reference pages and the preview recipe screen

### 4. Shared Components and Theming

Reusable UI pieces live in [`components/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components).

Important files:

- [`components/kitchen-styles.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\kitchen-styles.ts)
- [`components/app-theme.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\app-theme.ts)
- [`components/settings-menu.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\settings-menu.tsx)

What this layer does:

- centralizes shared styles
- defines the light and dark palettes
- provides the shared settings gear and overlay
- keeps route files focused on screen behavior instead of duplicated UI plumbing

## Simple Data Flow

A good mental model for the app is:

1. source recipes and reference files live in [`Cooking/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\Cooking)
2. generator scripts turn them into typed app data in [`data/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\data)
3. route files in [`app/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app) render that data
4. shared contexts provide favorites, settings, and theme state
5. shared components and styles keep the UI consistent across screens

That is the current backbone of the project.

## What The App Does Right Now

The app is still a prototype, but it is already useful.

Current capabilities:

- a home screen that acts as a kitchen tools hub
- a searchable conversions page with section filters
- a searchable allergy substitutions page
- a searchable cooking dictionary page with letter filters
- a `My Recipes` page backed by real Obsidian recipe notes
- filtering recipes by category and favorites
- searching recipes by title, category, and allergy tags
- clickable recipe detail pages generated from Markdown
- parsed ingredients and directions from recipe notes
- prep, cook, and total time where the note supports it
- ingredient scaling controls including `1/4x`, `1/2x`, preset servings, and a custom `1-10` selector
- allergen and allergy-friendly tags on recipes
- favorite recipe toggles with persistent storage
- a shared settings menu from the header gear
- dark mode
- keep-screen-awake cook mode
- responsive layouts for both Android and web

What it does not yet support:

- user accounts
- sync across devices
- recipe authoring inside the app
- pantry tracking
- grocery list generation
- dedicated cook-mode screen/timers

## Obsidian Recipe Integration

The app now uses real recipe data from the [`Cooking/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\Cooking) folder.

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

## Cooking Dictionary

The cooking dictionary page is based on:

- [`Cooking/Resources/Cooking Dictionary.md`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\Cooking\Resources\Cooking%20Dictionary.md)

The parser converts that glossary into [`data/cooking-dictionary.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\data\cooking-dictionary.ts), which the app renders as searchable term cards.

The page also cites the source used for the glossary:

- [What’s Cooking America glossary](https://whatscookingamerica.net/glossary/)

One cleanup detail that mattered here:

- the parser was adjusted so the glossary intro block was not treated as a fake dictionary entry

## Settings System

The app has a shared settings menu that can be opened from the gear icon in the header.

Important files:

- [`app/_layout.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\_layout.tsx)
- [`components/settings-menu.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\settings-menu.tsx)
- [`contexts/settings-context.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts\settings-context.tsx)
- [`components/app-theme.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\app-theme.ts)

Current saved settings:

- `Dark mode`
- `Keep screen awake`

How it works:

- settings are stored locally with AsyncStorage
- dark mode swaps between centralized light and dark palettes
- keep-awake mode uses `expo-keep-awake`
- the settings UI is implemented as a shared in-app overlay rather than relying on more fragile native UI primitives

This was a useful architecture milestone because it introduced real app-wide persisted state.

## Favorites System

Favorite recipes are stored locally and can be toggled from both the recipe list and recipe detail pages.

Important files:

- [`contexts/favorites-context.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts\favorites-context.tsx)
- [`app/my-recipes.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\my-recipes.tsx)
- [`app/recipes/[slug].tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\recipes\[slug].tsx)

This gives the app one early personalized behavior without needing accounts or a backend.

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

### [`package.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\package.json)

This file defines:

- dependencies
- scripts
- project metadata

Important scripts currently include:

- `start`
- `android`
- `ios`
- `web`
- `sync:recipes`
- `sync:dictionary`

It also sets:

- `"main": "expo-router/entry"`

That tells Expo to boot the app through Expo Router.

### [`app.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app.json)

This file contains Expo app configuration such as:

- app name and slug
- Android and web settings
- plugin setup

One important detail is the Expo Router plugin configuration that supports the routed app structure.

### [`README.md`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\README.md)

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
4. more kitchen references and searchable helpers
5. possibly local recipe creation or editing

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
