# Kitchen Helper

This project is an early prototype of a cooking app built with Expo and TypeScript.

The current app is a small cross-platform demo that shows how the idea could work on:

- Android
- Web

## What Has Happened So Far

We started with the product idea:

- a cooking app
- recipe scaling like double or half
- substitutions for missing ingredients
- kitchen unit conversions

From there, we made a technical decision about the stack.

## Why Expo Was Chosen

Expo is a React Native framework that helps us build one app that can run in more than one place.

For this project, Expo gives us:

- Android support
- Web support
- one shared codebase
- a straightforward development workflow

This is a good fit for a cooking app prototype because we can test the concept quickly without building separate Android and web apps from scratch.

## Why `pnpm` Was Chosen

`pnpm` is the package manager used for installing JavaScript dependencies.

It was chosen because it is:

- fast
- space efficient
- reliable for larger projects

On this machine, `pnpm` was not globally installed, so the project currently uses `corepack pnpm ...` commands instead. `corepack` is included with modern Node.js and can run package managers like `pnpm` without requiring a separate manual install first.

## Why We Did Not Use Vite Inside the App

This is an important detail.

Expo already has an official bundler workflow for both native apps and web apps. That workflow uses Metro.

So the current setup is:

- Expo for the app framework
- Metro for bundling
- `pnpm` for packages

We did not wire Vite into the app itself because that would add complexity without helping the main goal right now. For an Expo app that targets Android and web, Metro is the supported and simplest path.

If we ever want Vite later, the best use would probably be for a separate website, such as:

- a landing page
- a documentation site
- an admin tool

## Project Setup That Was Created

A new Expo project was scaffolded in this folder:

- [`C:\Users\Nathan\Documents\App Ideas\kitchen-helper`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper)

It was created in a subfolder because the parent folder name, `App Ideas`, is not a valid Expo project name for app/package setup.

The project now includes:

- Expo SDK
- React
- React Native
- TypeScript
- Expo Router
- web support packages

## Files That Were Updated

### Expo Router files

The app no longer uses a single root `App.tsx` file.

Instead, it now uses Expo Router with an `app/` folder:

- [`app/_layout.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\_layout.tsx)
- [`app/index.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\index.tsx)
- [`app/recipe.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\recipe.tsx)

What those files do:

- `_layout.tsx` defines the shared navigation stack
- `index.tsx` is the home screen
- `recipe.tsx` is the sample recipe screen

This is useful because each screen now has its own file and route instead of everything living in one large component.

On web, that also means the screens can map naturally to URLs such as:

- `/`
- `/recipe`

### Shared UI/data files

To keep the routed screens cleaner, some shared code was moved into:

- [`components/kitchen-styles.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\kitchen-styles.ts)
- [`components/sample-data.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\sample-data.ts)

These files hold:

- common styles
- sample ingredient data
- sample conversions
- sample substitutions
- helper formatting logic

### [`app.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app.json)

This file contains Expo app configuration.

So far, one small change was made:

- the app display name was changed from `kitchen-helper` to `Kitchen Helper`

This file will later matter for things like:

- app name
- icons
- splash screen
- Android configuration
- web configuration

### [`package.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\package.json)

This file describes the project dependencies and scripts.

It now includes the packages needed to run Expo on web as well as native:

- `expo`
- `expo-router`
- `react`
- `react-native`
- `react-dom`
- `react-native-web`
- `@expo/metro-runtime`

It also includes the main run scripts:

- `start`
- `android`
- `ios`
- `web`

One important change was also made here:

- the project entry point now uses `expo-router/entry`

Another useful script now exists:

- `sync:recipes`

That script regenerates the app's recipe data from the Markdown files in the Cooking folder.

Serving scaling is handled inside the app:

- recipes with a declared serving count use 2, 4, and 8 as target servings
- recipes without a declared serving count treat those buttons as multipliers

### [`pnpm-lock.yaml`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\pnpm-lock.yaml)

This file was generated when dependencies were installed.

Its job is to lock exact package versions so installs stay consistent over time.

## What The Current App Actually Does

Right now, the app is a static but interactive prototype.

It can:

- show a home screen that works like a menu
- navigate to a separate recipe screen
- navigate to a conversions reference screen
- navigate to an allergy substitutions reference screen
- navigate to a My Recipes screen
- show recipe titles and categories sourced from your Obsidian Cooking folder
- open individual Obsidian-backed recipe pages
- show prep time and cook time indicators where the Markdown note provides them
- display ingredients and directions parsed from Markdown notes
- scale recipe ingredients with Original, 1/4x, 1/2x, and quick 2, 4, 8 options
- switch between sample serving sizes
- recalculate ingredient quantities for the sample recipe
- display example substitutions
- display example conversions
- adapt its layout for smaller and wider screens

It does not yet:

- save recipes
- import recipes
- parse ingredients from text
- store user data
- run a real substitution engine
- support cooking mode

## Verification That Was Run

We checked that the code works in two important ways.

### TypeScript check

We ran a TypeScript validation command to make sure the code compiles cleanly:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```

That passed.

### Web build check

We also ran an Expo web export to confirm the web version bundles correctly:

```powershell
.\node_modules\.bin\expo.cmd export --platform web
```

That passed and generated a `dist` folder.

## A Note About Command Usage

Because `pnpm` is not globally available on this machine, the safest commands to use right now are:

```powershell
corepack pnpm install
corepack pnpm sync:recipes
corepack pnpm run web
corepack pnpm run android
```

If you later install `pnpm` globally, we can simplify those commands.

## Summary

So far, we have:

1. chosen Expo as the app framework
2. chosen `pnpm` as the package manager
3. kept Metro as the official bundler instead of forcing Vite into the app
4. created a new Expo project
5. added web support
6. added Expo Router for file-based navigation
7. split the app into multiple screens
8. added menu pages for conversions, allergy substitutions, and My Recipes`r`n8a. updated conversions and substitutions pages to reflect the chart resource
9. kept the recipe preview as the scaling prototype
10. connected My Recipes to parsed Obsidian recipe data
11. added clickable recipe detail pages generated from Markdown
12. added serving controls to Obsidian-backed recipe pages
12. verified TypeScript and web bundling

## Good Next Steps

If we continue from here, the most natural next steps are:

1. split the app into multiple screens
2. add real recipe data structures
3. let users enter their own recipes
4. save recipes locally
5. build a real scaling and conversion workflow




