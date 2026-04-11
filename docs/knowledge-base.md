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

## App Architecture

The app is currently organized into four main layers:

1. routes
2. shared context/state
3. data and parsing
4. shared components and styles

### 1. Routes

Routes live in the [`app/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app) folder.

Important route files:

- [`app/_layout.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\_layout.tsx)
- [`app/index.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\index.tsx)
- [`app/conversions.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\conversions.tsx)
- [`app/allergy-substitutions.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\allergy-substitutions.tsx)
- [`app/my-recipes.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\my-recipes.tsx)
- [`app/recipe.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\recipe.tsx)
- [`app/recipes/[slug].tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\recipes\[slug].tsx)

What this layer does:

- defines the screens users can visit
- maps files to URLs and navigation routes
- renders page-level UI
- pulls in shared data, styles, and context as needed

The route layer should mostly answer:

- what screen is this
- what data does it show
- what actions can the user take here

### 2. Shared Context and State

Shared app-wide state lives in the [`contexts/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts) folder.

Important files:

- [`contexts/favorites-context.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts\favorites-context.tsx)
- [`contexts/settings-context.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts\settings-context.tsx)

What this layer does:

- stores favorite recipe state
- stores saved app settings
- persists that state with AsyncStorage
- makes the state available to any screen wrapped by the providers

This is the first real app-wide state layer in the project.

It is useful because it prevents every screen from having to manage the same settings or favorites logic separately.

### 3. Data and Parsing

Recipe and utility data currently come from a mix of static shared data and generated data.

Important files:

- [`components/sample-data.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\sample-data.ts)
- [`data/obsidian-recipes.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\data\obsidian-recipes.ts)
- [`scripts/generate-obsidian-recipes.mjs`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\scripts\generate-obsidian-recipes.mjs)
- [`utils/ingredient-scaling.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\utils\ingredient-scaling.ts)
- [`Cooking/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\Cooking)

How this layer works:

- the `Cooking/` folder contains the Obsidian Markdown source files
- `scripts/generate-obsidian-recipes.mjs` parses those notes
- the script writes structured output into `data/obsidian-recipes.ts`
- route files read from that generated data to render recipe lists and recipe detail screens
- `utils/ingredient-scaling.ts` handles ingredient amount scaling on recipe pages
- `components/sample-data.ts` still powers the prototype-only data such as sample conversions and demo recipe content

This separation matters because it keeps source content, generation logic, and UI rendering from all blurring together in one file.

### 4. Shared Components and Styles

Reusable visual building blocks live in the [`components/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components) folder.

Important files:

- [`components/kitchen-styles.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\kitchen-styles.ts)
- [`components/settings-menu.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\settings-menu.tsx)
- [`components/app-theme.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\app-theme.ts)

What this layer does:

- centralizes visual styles
- provides theme palettes for light and dark mode
- defines reusable UI pieces like the shared settings modal and gear button

This layer helps keep route files focused on screen behavior instead of repeating the same style or modal code everywhere.

### Simple Flow

One useful mental model is:

1. Markdown recipes live in [`Cooking/`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\Cooking)
2. the generator script turns them into [`data/obsidian-recipes.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\data\obsidian-recipes.ts)
3. route files render that data on recipe pages
4. shared contexts provide cross-app behavior like favorites and settings
5. shared components/styles keep the UI consistent

That is the current backbone of the app.

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
- a shared settings menu with a gear icon in the header on every page
- a saved dark mode preference
- a saved cook mode preference that keeps the screen awake while the app is open
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

## Settings System

The app now has a shared settings menu that can be opened from any screen.

### How it is accessed

The settings menu is opened from a gear icon in the header.

That gear icon lives in the shared layout, which means it appears across the routed screens instead of being added one page at a time.

Important files:

- [`app/_layout.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\app\_layout.tsx)
- [`components/settings-menu.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\settings-menu.tsx)

### What settings exist right now

There are currently two saved settings:

- `Dark mode`
- `Keep screen awake`

These are meant to be practical first settings for a cooking app:

- dark mode helps with reading comfort and overall preference
- keep-awake mode helps when someone is actively cooking and does not want the screen turning off

### How settings are stored

Settings are stored locally on the device using AsyncStorage.

That means:

- the values persist between app launches
- they are local to the device/browser storage
- they do not require a backend or user account

Important file:

- [`contexts/settings-context.tsx`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\contexts\settings-context.tsx)

This context is responsible for:

- loading saved settings on app startup
- exposing the current values to the UI
- saving changes when the user toggles a setting
- opening and closing the settings modal

### How dark mode works

Dark mode is handled through a shared theme palette.

Important file:

- [`components/app-theme.ts`](C:\Users\Nathan\Documents\App Ideas\kitchen-helper\components\app-theme.ts)

This file defines:

- a light palette
- a dark palette

The settings context chooses which palette is active, and screens read from that palette when setting:

- page background colors
- card backgrounds
- text colors
- border colors
- header colors

This is a useful pattern because it keeps theme values centralized instead of scattering hard-coded dark-mode colors across many files.

### How keep-awake cook mode works

The keep-awake setting uses Expo's keep-awake package.

Dependency:

- `expo-keep-awake`

When the setting is enabled, the app requests that the screen stay awake while the app remains open.

This is most useful on Android while cooking from a recipe screen.

On web, support can depend more on the browser and device, so it is best understood as:

- stronger on native
- more limited on web

### Why this system matters

This is one of the first examples in the project where we added true app-wide state, not just screen-local state.

That makes it a good learning milestone because it introduces:

- shared context
- persisted preferences
- theme switching
- device behavior integration

It also creates a clear place to add future settings later, such as:

- text size
- default measurement system
- always-open recipe in cook mode
- favorite landing page

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
14. added serving controls and ingredient scaling to recipe detail pages
15. updated conversion and substitution references from the chart resource
16. added a shared settings menu with saved dark mode and keep-awake cook mode

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




