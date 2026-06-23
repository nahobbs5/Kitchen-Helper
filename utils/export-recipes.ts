import { type RefObject } from 'react';
import { Alert, Platform, type View } from 'react-native';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { type RecipeSource, type RecipeOverride, type UserRecipe } from '../contexts/custom-recipes-context';
import { obsidianRecipes, type ObsidianRecipe, type RecipeSection } from '../data/obsidian-recipes';
import { formatCookTimeTag } from './recipe-metadata';

export type ExportRecipe = {
  slug: string;
  title: string;
  category: string;
  sourceLabel: string;
  cuisineRegion: string | null;
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  allergyFriendlyTags: string[];
  allergenTags: string[];
  ingredients: RecipeSection[];
  directions: RecipeSection[];
  notes: string | null;
  sourceInfo: RecipeSource;
  rating?: number | null;
};

type ExportBuildInput = {
  customRecipes: UserRecipe[];
  recipeOverrideMap: Record<string, RecipeOverride>;
  ratings?: Record<string, number>;
  showRatings?: boolean;
};

const MAX_EXPORT_RATING = 5;

type ExportResult = {
  filename: string;
  message: string;
};

function nextFilename() {
  const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+$/, '');
  return `kitchen-helper-recipes-${timestamp}.pdf`;
}

function nextRecipeShareFilename(recipe: ExportRecipe) {
  const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+$/, '');
  const slug = recipe.slug.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'recipe';
  return `kitchen-helper-${slug}-${timestamp}.jpg`;
}

function nextRecipeShareFilenames(recipes: ExportRecipe[]) {
  const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+$/, '');

  return recipes.map((recipe) => {
    const slug = recipe.slug.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'recipe';
    return `kitchen-helper-${slug}-${timestamp}.jpg`;
  });
}

function compareRecipes(left: ExportRecipe, right: ExportRecipe) {
  const categoryCompare = left.category.localeCompare(right.category);

  if (categoryCompare !== 0) {
    return categoryCompare;
  }

  return left.title.localeCompare(right.title);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSectionList(sections: RecipeSection[], ordered = false) {
  if (sections.length === 0) {
    return '';
  }

  return sections
    .map((section) => {
      const wrapperTag = ordered ? 'ol' : 'ul';
      const items = section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      const title = section.title
        ? `<h4 class="recipe-subheading">${escapeHtml(section.title)}</h4>`
        : '';

      return `${title}<${wrapperTag} class="recipe-list">${items}</${wrapperTag}>`;
    })
    .join('');
}

function renderSourceInfo(sourceInfo: RecipeSource) {
  if (!sourceInfo) {
    return '';
  }

  const rows = [
    sourceInfo.websiteName ? `<p><strong>Website:</strong> ${escapeHtml(sourceInfo.websiteName)}</p>` : '',
    sourceInfo.author ? `<p><strong>Author:</strong> ${escapeHtml(sourceInfo.author)}</p>` : '',
    sourceInfo.url
      ? `<p><strong>Source:</strong> <span class="source-url">${escapeHtml(sourceInfo.url)}</span></p>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  if (!rows) {
    return '';
  }

  return `<section class="recipe-source">${rows}</section>`;
}

function renderRating(recipe: ExportRecipe) {
  if (!recipe.rating || recipe.rating <= 0) {
    return '';
  }

  const filled = Math.max(0, Math.min(MAX_EXPORT_RATING, Math.round(recipe.rating)));
  const stars = '★'.repeat(filled) + '☆'.repeat(MAX_EXPORT_RATING - filled);

  return `<div class="recipe-rating" aria-label="Rating: ${filled} of ${MAX_EXPORT_RATING} stars">${stars}</div>`;
}

function renderMetadata(recipe: ExportRecipe) {
  const items = [
    recipe.category,
    recipe.cuisineRegion ? `Cuisine: ${recipe.cuisineRegion}` : null,
    recipe.prepTime ? `Prep: ${recipe.prepTime}` : null,
    recipe.cookTime ? formatCookTimeTag(recipe, recipe.cookTime) : null,
    recipe.totalTime ? `Total: ${recipe.totalTime}` : null,
    recipe.servings ? recipe.servings : null,
  ].filter(Boolean) as string[];

  if (items.length === 0) {
    return '';
  }

  return `<div class="recipe-meta">${items
    .map((item) => `<span class="meta-chip">${escapeHtml(item)}</span>`)
    .join('')}</div>`;
}

function renderTags(recipe: ExportRecipe) {
  const tags = [...recipe.allergyFriendlyTags, ...recipe.allergenTags];

  if (tags.length === 0) {
    return '';
  }

  return `<div class="recipe-tags">${tags
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join('')}</div>`;
}

function renderRecipesPdfCss() {
  return `
    body {
      font-family: "Georgia", "Times New Roman", serif;
      color: #2a2118;
      margin: 0;
      background: #f8f3eb;
    }

    .book {
      padding: 36px;
    }

    .cover {
      border: 2px solid #e1c8a1;
      border-radius: 24px;
      background: #fffaf2;
      padding: 40px;
      margin-bottom: 28px;
      page-break-after: always;
    }

    .cover-eyebrow {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #8a5a24;
      font-weight: 700;
      margin: 0 0 16px;
    }

    .cover-title {
      font-size: 38px;
      line-height: 1.05;
      margin: 0 0 16px;
    }

    .cover-body {
      font-size: 16px;
      line-height: 1.6;
      color: #5c4d3c;
      margin: 0;
    }

    .recipe-card {
      background: #fffdf9;
      border: 1px solid #eadac0;
      border-radius: 24px;
      padding: 28px;
      margin-bottom: 28px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .recipe-card:not(:last-child) {
      page-break-after: always;
    }

    .recipe-category {
      font-size: 12px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      font-weight: 700;
      color: #8a5a24;
      margin: 0 0 10px;
    }

    .recipe-title {
      font-size: 30px;
      line-height: 1.1;
      margin: 0 0 16px;
    }

    .recipe-meta,
    .recipe-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 14px;
    }

    .recipe-rating {
      font-size: 18px;
      letter-spacing: 2px;
      color: #f0a500;
      margin: 0 0 14px;
    }

    .meta-chip,
    .tag-chip {
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 700;
    }

    .meta-chip {
      background: #f4dfba;
      color: #6f4817;
    }

    .tag-chip {
      background: #efe4d2;
      color: #5b4c3b;
    }

    .recipe-source {
      margin: 0 0 18px;
      padding: 12px 14px;
      border: 1px solid #eadac0;
      border-radius: 16px;
      background: #fff7ea;
    }

    .recipe-source p,
    .recipe-notes {
      margin: 0;
      line-height: 1.6;
      color: #5c4d3c;
    }

    .recipe-source p + p {
      margin-top: 6px;
    }

    .source-url {
      word-break: break-word;
    }

    .recipe-section + .recipe-section {
      margin-top: 20px;
    }

    .recipe-section h3 {
      font-size: 18px;
      margin: 0 0 12px;
    }

    .recipe-subheading {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 16px 0 10px;
      color: #8a5a24;
    }

    .recipe-list {
      margin: 0;
      padding-left: 20px;
    }

    .recipe-list li {
      margin-bottom: 8px;
      line-height: 1.6;
      color: #2a2118;
    }
  `;
}

function renderRecipeCards(recipes: ExportRecipe[]) {
  return recipes
    .map(
      (recipe) => `
        <article class="recipe-card">
          <header class="recipe-header">
            <p class="recipe-category">${escapeHtml(recipe.category)}</p>
            <h2 class="recipe-title">${escapeHtml(recipe.title)}</h2>
            ${renderRating(recipe)}
            ${renderMetadata(recipe)}
            ${renderTags(recipe)}
            ${renderSourceInfo(recipe.sourceInfo)}
          </header>

          <section class="recipe-section">
            <h3>Ingredients</h3>
            ${renderSectionList(recipe.ingredients)}
          </section>

          <section class="recipe-section">
            <h3>Directions</h3>
            ${renderSectionList(recipe.directions, true)}
          </section>

          ${
            recipe.notes
              ? `<section class="recipe-section"><h3>Notes</h3><p class="recipe-notes">${escapeHtml(
                  recipe.notes
                )}</p></section>`
              : ''
          }
        </article>
      `
    )
    .join('');
}

function renderRecipesPdfBody(recipes: ExportRecipe[], includeCover = true) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const coverMarkup = includeCover
    ? `
      <section class="cover">
        <p class="cover-eyebrow">Kitchen Helper</p>
        <h1 class="cover-title">Recipe Export</h1>
        <p class="cover-body">
          ${recipes.length} recipes exported on ${escapeHtml(today)}.
        </p>
      </section>
    `
    : '';

  return `
    <main class="book">
      ${coverMarkup}
      ${renderRecipeCards(recipes)}
    </main>
  `;
}

export function buildExportRecipes({
  customRecipes,
  recipeOverrideMap,
  ratings,
  showRatings = false,
}: ExportBuildInput): ExportRecipe[] {
  const ratingFor = (slug: string) => (showRatings ? ratings?.[slug] ?? null : null);

  const effectiveObsidianRecipes: ExportRecipe[] = obsidianRecipes.map((recipe: ObsidianRecipe) => {
    const override = recipeOverrideMap[recipe.slug];

    return {
      slug: recipe.slug,
      title: override?.title ?? recipe.title,
      category: override?.category ?? recipe.category,
      sourceLabel: 'Obsidian Vault',
      cuisineRegion: override?.cuisineRegion ?? null,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      servings: recipe.servings,
      allergyFriendlyTags: override?.allergyFriendlyTags ?? recipe.allergyFriendlyTags,
      allergenTags: override?.allergenTags ?? recipe.allergenTags,
      ingredients: override?.ingredients ?? recipe.ingredients,
      directions: override?.directions ?? recipe.directions,
      notes: override ? override.notes : recipe.notes,
      sourceInfo: override?.sourceInfo ?? null,
      rating: ratingFor(recipe.slug),
    };
  });

  const customExportRecipes: ExportRecipe[] = customRecipes.map((recipe) => ({
    slug: recipe.slug,
    title: recipe.title,
    category: recipe.category,
    sourceLabel: recipe.source,
    cuisineRegion: recipe.cuisineRegion,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime,
    servings: recipe.servings,
    allergyFriendlyTags: recipe.allergyFriendlyTags,
    allergenTags: recipe.allergenTags,
    ingredients: recipe.ingredients,
    directions: recipe.directions,
    notes: recipe.notes,
    sourceInfo: recipe.sourceInfo,
    rating: ratingFor(recipe.slug),
  }));

  return [...customExportRecipes, ...effectiveObsidianRecipes].sort(compareRecipes);
}

export function renderRecipesPdfHtml(recipes: ExportRecipe[]) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Kitchen Helper Cookbook</title>
        <style>${renderRecipesPdfCss()}</style>
      </head>
      <body>
        ${renderRecipesPdfBody(recipes)}
      </body>
    </html>
  `;
}

async function exportRecipesToPdfWeb(recipes: ExportRecipe[], filename: string) {
  if (typeof document === 'undefined') {
    throw new Error('Web PDF export is unavailable in this environment.');
  }

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '816px';
  container.style.opacity = '0.01';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-1';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = `<style>${renderRecipesPdfCss()}</style>${renderRecipesPdfBody(recipes)}`;
  document.body.appendChild(container);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = (html2pdfModule.default ?? html2pdfModule) as {
      (): {
        set: (options: Record<string, unknown>) => {
          from: (element: HTMLElement) => { save: () => Promise<void> };
        };
      };
    };

    await html2pdf()
      .set({
        margin: 0.4,
        filename,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(container)
      .save();

    return {
      filename,
      message: 'PDF download started.',
    } satisfies ExportResult;
  } finally {
    document.body.removeChild(container);
  }
}

async function exportRecipesToPdfNative(html: string, filename: string) {
  const file = await Print.printToFileAsync({
    html,
    base64: true,
  });

  if (Platform.OS === 'android' && file.base64) {
    const permissions = await LegacyFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      const targetUri = await LegacyFileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        'application/pdf'
      );

      await LegacyFileSystem.writeAsStringAsync(targetUri, file.base64, {
        encoding: LegacyFileSystem.EncodingType.Base64,
      });

      return {
        filename,
        message: 'PDF saved to the folder you selected.',
      } satisfies ExportResult;
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share recipe export',
      UTI: 'com.adobe.pdf',
    });

    return {
      filename,
      message: 'No folder selected. Opened the share sheet instead.',
    } satisfies ExportResult;
  }

  return {
    filename,
    message: 'PDF created successfully.',
  } satisfies ExportResult;
}

async function waitForRecipeCardPaint() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function captureRecipeCardNative(cardRef: RefObject<View | null>) {
  if (!cardRef.current) {
    throw new Error('Recipe share card is not ready yet.');
  }

  await waitForRecipeCardPaint();

  return captureRef(cardRef, {
    format: 'jpg',
    quality: 0.95,
    result: 'tmpfile',
  });
}

async function captureRecipeCardDataUriNative(cardRef: RefObject<View | null>) {
  if (!cardRef.current) {
    throw new Error('Recipe share card is not ready yet.');
  }

  await waitForRecipeCardPaint();

  return captureRef(cardRef, {
    format: 'jpg',
    quality: 0.95,
    result: 'data-uri',
  });
}

async function captureRecipeCardWeb(cardRef: RefObject<View | null>) {
  if (!cardRef.current) {
    throw new Error('Recipe share card is not ready yet.');
  }

  await waitForRecipeCardPaint();

  // The public captureRef wrapper calls findNodeHandle, which React Native Web does not support.
  // Its web backend accepts the DOM node directly, so use that backend only on web.
  // @ts-expect-error react-native-view-shot does not publish types for this platform backend.
  const rnViewShotModule = await import('react-native-view-shot/src/RNViewShot');
  const rnViewShot = rnViewShotModule.default as {
    captureRef: (
      view: unknown,
      options: { format: 'jpg'; quality: number; result: 'data-uri' }
    ) => Promise<string>;
  };

  return rnViewShot.captureRef(cardRef.current, {
    format: 'jpg',
    quality: 0.95,
    result: 'data-uri',
  });
}

async function shareRecipeImageWeb(recipe: ExportRecipe, cardRef: RefObject<View | null>) {
  if (typeof document === 'undefined') {
    throw new Error('Recipe image sharing is unavailable in this environment.');
  }

  const filename = nextRecipeShareFilename(recipe);
  const dataUri = await captureRecipeCardWeb(cardRef);
  const blob = await fetch(dataUri).then((response) => response.blob());
  const file = new File([blob], filename, { type: 'image/jpeg' });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  const shareData = {
    files: [file],
    title: recipe.title,
  } as ShareData;

  function downloadImage() {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  if (nav.share && (!nav.canShare || nav.canShare(shareData))) {
    try {
      await nav.share(shareData);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
    }
  }

  downloadImage();
}

async function captureRecipeShareUriNative(filename: string, cardRef: RefObject<View | null>) {
  const capturedUri = await captureRecipeCardNative(cardRef);
  const shareUri = LegacyFileSystem.cacheDirectory
    ? `${LegacyFileSystem.cacheDirectory}${filename}`
    : capturedUri;

  if (shareUri !== capturedUri) {
    await LegacyFileSystem.copyAsync({
      from: capturedUri,
      to: shareUri,
    });
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is unavailable on this device.');
  }

  return shareUri;
}

async function shareRecipeImageNative(recipe: ExportRecipe, cardRef: RefObject<View | null>) {
  const filename = nextRecipeShareFilename(recipe);
  const shareUri = await captureRecipeShareUriNative(filename, cardRef);

  await Sharing.shareAsync(shareUri, {
    mimeType: 'image/jpeg',
    dialogTitle: `Share ${recipe.title}`,
    UTI: 'public.jpeg',
  });
}

export async function shareRecipe(recipe: ExportRecipe, cardRef: RefObject<View | null>) {
  if (Platform.OS === 'web') {
    await shareRecipeImageWeb(recipe, cardRef);
    return;
  }

  await shareRecipeImageNative(recipe, cardRef);
}

async function shareRecipeImagesWeb(recipes: ExportRecipe[], cardRefs: RefObject<View | null>[]) {
  if (typeof document === 'undefined') {
    throw new Error('Recipe image sharing is unavailable in this environment.');
  }

  const filenames = nextRecipeShareFilenames(recipes);
  const files: File[] = [];

  // Capture one card at a time: concurrent html2canvas runs each clone the
  // whole document and can produce blank canvases.
  for (const [index, recipe] of recipes.entries()) {
    const dataUri = await captureRecipeCardWeb(cardRefs[index]);
    const blob = await fetch(dataUri).then((response) => response.blob());

    if (blob.size === 0) {
      throw new Error(`Could not capture a share image for "${recipe.title}".`);
    }

    files.push(new File([blob], filenames[index], { type: 'image/jpeg' }));
  }
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  const shareData = {
    files,
    title: recipes.length === 1 ? recipes[0].title : `${recipes.length} Kitchen Helper recipes`,
  } as ShareData;

  function downloadImages() {
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 0);
    });
  }

  if (nav.share && (!nav.canShare || nav.canShare(shareData))) {
    try {
      await nav.share(shareData);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
    }
  }

  downloadImages();
}

async function shareRecipeImagesNative(recipes: ExportRecipe[], cardRefs: RefObject<View | null>[]) {
  const filenames = nextRecipeShareFilenames(recipes);

  try {
    const ReactNativeShare = (await import('react-native-share')).default;
    const dataUris: string[] = [];

    for (const cardRef of cardRefs) {
      dataUris.push(await captureRecipeCardDataUriNative(cardRef));
    }

    // Pass data URIs, not file:// cache paths: receiving apps cannot read this
    // app's private files on Android. RNShare materializes data URIs itself and
    // shares readable content:// URIs through its FileProvider.
    await ReactNativeShare.open({
      failOnCancel: false,
      filenames,
      title: recipes.length === 1 ? recipes[0].title : `${recipes.length} Kitchen Helper recipes`,
      type: 'image/jpeg',
      urls: dataUris,
      useInternalStorage: true,
    });
    return;
  } catch {
    // Expo Go does not include RNShare. Fall back to the existing Expo share sheet.
  }

  for (const [index, recipe] of recipes.entries()) {
    const shareUri = await captureRecipeShareUriNative(filenames[index], cardRefs[index]);

    await Sharing.shareAsync(shareUri, {
      mimeType: 'image/jpeg',
      dialogTitle: `Share ${index + 1} of ${recipes.length}: ${recipe.title}`,
      UTI: 'public.jpeg',
    });

    if (index < recipes.length - 1) {
      await new Promise<void>((resolve) => {
        Alert.alert('Share next recipe', `${recipes.length - index - 1} recipe image${recipes.length - index - 1 === 1 ? '' : 's'} left to share.`, [
          { text: 'Continue', onPress: () => resolve() },
        ]);
      });
    }
  }
}

export async function shareRecipes(recipes: ExportRecipe[], cardRefs: RefObject<View | null>[]) {
  if (recipes.length === 0) {
    throw new Error('There are no selected recipes to share.');
  }

  if (recipes.length !== cardRefs.length) {
    throw new Error('Recipe share cards are not ready yet.');
  }

  if (Platform.OS === 'web') {
    await shareRecipeImagesWeb(recipes, cardRefs);
    return;
  }

  await shareRecipeImagesNative(recipes, cardRefs);
}

export async function exportRecipesToPdf(recipes: ExportRecipe[]) {
  if (recipes.length === 0) {
    throw new Error('There are no recipes to export.');
  }

  const html = renderRecipesPdfHtml(recipes);
  const filename = nextFilename();

  if (Platform.OS === 'web') {
    return exportRecipesToPdfWeb(recipes, filename);
  }

  return exportRecipesToPdfNative(html, filename);
}
