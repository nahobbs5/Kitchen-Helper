# Kitchen Helper Knowledge Base

This document is meant to be a running explanation of how the project works and why certain technical choices were made.

The goal is not just to record what files exist, but to build a reference you can come back to while learning and building.

## Project Goal

Kitchen Helper is a cooking app prototype focused on practical kitchen utilities:

- recipe scaling
- ingredient substitutions
- cooking conversions

The app is being built so it can work on:

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

## How These Tools Fit Together

### Expo

Expo is the framework that runs the app project.

It gives us:

- project structure
- development tooling
- Android support
- web support
- a smoother React Native workflow

You can think of Expo as the overall app platform we are building inside.

### React Native

React Native is the UI framework used to build the app screens.

Instead of writing HTML elements like `div`, this project uses React Native components like:

- `View`
- `Text`
- `ScrollView`
- `Pressable`

These components are designed to work across platforms, including Android and web through Expo's tooling.

### TypeScript

TypeScript adds type checking on top of JavaScript.

It helps catch mistakes earlier and makes the code easier to reason about as the project grows.

Examples in this project include:

- ingredient types
- substitution types
- conversion types

### Expo Router

Expo Router is the navigation system.

It uses files inside the `app/` folder to define screens and routes.

Examples:

- `app/index.tsx` becomes `/`
- `app/recipe.tsx` becomes `/recipe`

This is useful because navigation becomes easier to understand and easier to scale as more screens are added.

### pnpm

`pnpm` is the package manager used to install and track dependencies.

It works similarly to `npm`, but is often faster and more space efficient.

On this machine, `pnpm` is currently being run through `corepack`, so commands usually look like:

```powershell
corepack pnpm install
corepack pnpm sync:recipes
corepack pnpm run web
corepack pnpm run android
```

### Metro

Metro is the JavaScript bundler used by Expo.

A bundler takes all the app code and dependencies and turns them into the packaged code the app can run.

Even though the app also targets web, Expo still uses Metro for this setup.

This is why we did not wire Vite into the app itself.

## Why We Chose This Setup

The current stack was chosen because it gives us a good balance of:

- speed of setup
- cross-platform support
- room to grow
- beginner-friendly structure

For this project, the most important goal is to get a working Android and web app from one codebase while keeping the architecture understandable.

## Why The App Lives In `kitchen-helper`

The original parent folder is:

- `C:\Users\Nathan\Documents\App Ideas`

That folder name is fine for a general workspace, but it is not a valid Expo app/package name because of the space and naming rules.

So the actual project was created in:

- [`C:\Users\Nathan\Documents\App Ideas\kitchen-helper`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper)

## High-Level Project Structure

Current important folders and files:

- [`app/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app)
- [`components/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components)
- [`docs/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\docs)
- [`app.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app.json)
- [`package.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\package.json)
- [`README.md`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\README.md)

## What Each Main Area Does

### [`app/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app)

This folder contains app routes and screens.

Important files right now:

- [`app/_layout.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\_layout.tsx)
- [`app/index.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\index.tsx)
- [`app/recipe.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\recipe.tsx)

#### `app/_layout.tsx`

This file defines the shared navigation wrapper for the routes in the `app/` folder.

Right now it uses a stack navigator.

That means:

- screens are layered in a navigation stack
- users can move forward to a new screen
- users can move back to the previous screen

This file is important because it controls:

- shared header behavior
- shared screen styling
- route registration in the stack

#### `app/index.tsx`

This is the home screen.

Because it is named `index.tsx`, it becomes the default route for the folder.

So on web, this maps to:

- `/`

Right now it exists mostly to:

- show that Expo Router is active
- explain the routed structure
- link to the recipe screen

#### `app/recipe.tsx`

This is the sample recipe screen.

Because it is named `recipe.tsx`, it becomes:

- `/recipe`

This screen currently holds most of the cooking-app demo behavior, including:

- serving size selection
- scaled ingredient amounts
- substitution examples
- conversion examples

### [`components/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components)

This folder contains reusable code that is shared between screens.

Important files right now:

- [`components/kitchen-styles.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\kitchen-styles.ts)
- [`components/sample-data.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\sample-data.ts)

#### `components/kitchen-styles.ts`

This file contains shared style definitions.

Why it exists:

- to avoid repeating the same styles in multiple screen files
- to keep route files easier to read
- to make visual changes easier later

#### `components/sample-data.ts`

This file contains the sample data used by the prototype.

That includes:

- base recipe servings
- sample ingredients
- sample substitutions
- sample conversions
- a helper function for formatting numbers

Why it exists:

- to separate demo data from screen layout code
- to prepare for a future move toward real structured recipe data

### [`docs/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\docs)

This folder is for internal project documentation and learning notes.

This knowledge-base file lives here so we can keep building a record of the project as decisions are made.

## Configuration Files

### [`package.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\package.json)

This file defines:

- project metadata
- scripts
- dependencies
- dev dependencies

One important setting is:

- `"main": "expo-router/entry"`

That tells Expo to boot the app through Expo Router instead of a custom root file like `App.tsx`.

### [`app.json`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app.json)

This file contains Expo app configuration.

It controls things like:

- app name
- app slug
- icons
- splash screen
- Android settings
- web settings
- Expo plugins

One important line is:

- `"plugins": ["expo-router"]`

That enables Expo Router's config integration.

### [`README.md`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\README.md)

The README is the quick project summary.

This knowledge-base file is different.

The README is for:

- concise overview
- setup summary
- quick orientation

This file is for:

- deeper explanation
- learning notes
- architecture understanding
- ongoing project reasoning

## What The App Does Right Now

The current app is still a prototype, not a finished product.

It currently supports:

- a routed home screen that acts as a menu
- a routed recipe screen
- a routed conversions reference screen
- a routed allergy substitutions reference screen
- a routed My Recipes screen
- recipe titles and categories sourced from the Obsidian Cooking folder
- clickable recipe detail pages generated from Markdown notes
- prep and cook time indicators when recipe notes include them
- ingredients and directions parsed from Obsidian recipe files
- serving controls on recipe pages with 1/4x, 1/2x, 2, 4, and 8 options
- recipe scaling through serving-size buttons
- sample substitutions
- sample conversions
- responsive layout for mobile and web

It does not yet support:

- saving recipes
- importing recipes
- user accounts
- pantry tracking
- cooking timers
- real structured recipe creation

## What Was Verified

So far, two main checks were run:

### TypeScript check

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```

Purpose:

- verify the TypeScript code compiles cleanly
- catch type errors before runtime

### Expo web export

```powershell
.\node_modules\.bin\expo.cmd export --platform web
```

Purpose:

- verify the app can bundle for web successfully
- confirm the routed app builds correctly

## Important Development Notes

### Why commands use `corepack pnpm`

`pnpm` is not installed globally on this machine right now.

Because of that, the safest commands use `corepack`:

```powershell
corepack pnpm install
corepack pnpm sync:recipes
corepack pnpm run web
corepack pnpm run android
```

### Generated folders

Some folders are generated by tools and usually are not hand-edited:

- `node_modules/`
- `.expo/`
- `dist/`

General meaning:

- `node_modules/` holds installed packages
- `.expo/` holds Expo local development metadata
- `dist/` holds exported web build output

## Architecture Direction

The app is currently moving toward a structure like this:

1. home screen
2. recipe screen
3. recipe storage
4. structured ingredient data
5. conversions and substitutions as real features
6. cooking mode

The current routed setup is the foundation for that future work.

## Change Log So Far

High-level sequence of what has happened:

1. chose the cooking app idea
2. chose Expo for Android and web support
3. chose `pnpm` as the package manager
4. created the Expo project
5. added web support packages
6. built a first cooking-app prototype screen
7. added a README
8. converted the app to Expo Router
9. split the UI into real screens and shared component files
10. added this knowledge-base document
11. added menu routes for conversions, allergy substitutions, and My Recipes
12. connected the My Recipes page to the actual Obsidian recipe inventory
13. added generated Obsidian recipe pages with ingredients and directions parsing
14. added serving controls and ingredient scaling to recipe detail pages`r`n15. updated conversion and substitution references from the chart resource

## How To Grow This File

As the project continues, this file can be expanded with sections like:

- state management
- local storage
- recipe data modeling
- navigation patterns
- styling strategy
- Android build/release notes
- debugging notes
- lessons learned

## Working Agreement For Explanations

Going forward, new technical changes can be added here with:

1. what changed
2. why it changed
3. what files were affected
4. what concept it introduces

That way this document can become a real project knowledge base instead of a one-time note.




