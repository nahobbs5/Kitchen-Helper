import { splitDirectionsText } from './scaled-directions';
import type { RecipeSection } from '../data/obsidian-recipes';
import { extractRecipeMetadata, normalizeIsoDuration } from './recipe-metadata';
import { formatRecipeSections, normalizeRecipeSections } from './recipe-sections';

type ImportedRecipe = {
  title: string;
  source: {
    websiteName: string;
    author: string;
    url: string;
  } | null;
  ingredientsText: string;
  directionsText: string;
  prepTime: string | null;
  cookTime: string | null;
  servings: string | null;
  suggestedCategory: string | null;
};

const NAMED_ENTITIES: Record<string, string> = {
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  deg: '°',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  eacute: 'é',
  trade: '™',
  reg: '®',
  copy: '©',
};

function codePointToString(codePoint: number): string | null {
  if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
    return null;
  }

  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return null;
  }
}

function decodeHtml(value: string) {
  return (
    value
      // Numeric hex entities, e.g. &#x2019;
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
        const decoded = codePointToString(parseInt(hex, 16));
        return decoded ?? match;
      })
      // Numeric decimal entities, e.g. &#8217;
      .replace(/&#(\d+);/g, (match, dec) => {
        const decoded = codePointToString(parseInt(dec, 10));
        return decoded ?? match;
      })
      // Named entities (unknown names are left untouched)
      .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, name) => {
        return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name)
          ? NAMED_ENTITIES[name]
          : match;
      })
      // Decode &amp; last so sequences like "Salt &amp; Pepper" resolve without
      // double-decoding any entities revealed above.
      .replace(/&amp;/g, '&')
  );
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? stripHtml(value) : '';
}

function normalizeYield(value: unknown): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return normalizeText(String(value));
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeYield(item)).filter(Boolean).join(', ');
  }

  return '';
}

function normalizeAuthor(author: unknown): string {
  if (!author) {
    return '';
  }

  if (typeof author === 'string') {
    return author.trim();
  }

  if (Array.isArray(author)) {
    return author
      .map((item) => normalizeAuthor(item))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof author === 'object' && 'name' in author && typeof author.name === 'string') {
    return author.name.trim();
  }

  return '';
}

function extractMetaContent(html: string, key: string) {
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  return normalizeText(regex.exec(html)?.[1] ?? '');
}

function flattenJsonLd(node: unknown): Record<string, any>[] {
  if (!node) {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((item) => flattenJsonLd(item));
  }

  if (typeof node === 'object') {
    const record = node as Record<string, any>;
    const nestedGraph = record['@graph'] ? flattenJsonLd(record['@graph']) : [];
    return [record, ...nestedGraph];
  }

  return [];
}

function hasRecipeType(value: unknown): boolean {
  if (!value) {
    return false;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'recipe';
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasRecipeType(entry));
  }

  return false;
}

function hasHowToSectionType(value: unknown): boolean {
  if (!value) {
    return false;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'howtosection';
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasHowToSectionType(entry));
  }

  return false;
}

function mergeInstructionSections(sections: RecipeSection[]) {
  const merged: RecipeSection[] = [];

  for (const section of normalizeRecipeSections(sections)) {
    const previous = merged[merged.length - 1];

    if (!section.title && previous && !previous.title) {
      previous.items.push(...section.items);
      continue;
    }

    merged.push(section);
  }

  return merged;
}

function extractInstructionSections(value: unknown): RecipeSection[] {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    const items = splitDirectionsText(normalizeText(value));
    return items.length > 0 ? [{ title: null, items }] : [];
  }

  if (Array.isArray(value)) {
    return mergeInstructionSections(value.flatMap((item) => extractInstructionSections(item)));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, any>;

    if (hasHowToSectionType(record['@type']) || record.itemListElement) {
      const childSections = extractInstructionSections(record.itemListElement);
      const sectionTitle = normalizeText(record.name);

      if (sectionTitle && childSections.length > 0) {
        return [
          {
            title: sectionTitle,
            items: childSections.flatMap((section) => section.items),
          },
        ];
      }

      if (childSections.length > 0) {
        return childSections;
      }
    }

    if (typeof record.text === 'string') {
      const items = splitDirectionsText(normalizeText(record.text));
      return items.length > 0 ? [{ title: null, items }] : [];
    }
  }

  return [];
}

function mapCategory(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes('dessert')) {
    return 'Dessert';
  }

  if (normalized.includes('appetizer')) {
    return 'Appetizers';
  }

  if (normalized.includes('breakfast')) {
    return 'Breakfast';
  }

  if (normalized.includes('side')) {
    return 'Side';
  }

  if (normalized.includes('entree') || normalized.includes('main') || normalized.includes('dinner')) {
    return 'Entree';
  }

  return null;
}

export function parseRecipeFromHtml(url: string, html: string): ImportedRecipe {
  const scriptMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const recipeNodes = scriptMatches.flatMap((match) => {
    try {
      return flattenJsonLd(JSON.parse(match[1]));
    } catch {
      return [];
    }
  });

  const recipeNode = recipeNodes.find((node) => hasRecipeType(node['@type']));
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  })();

  const title = normalizeText(recipeNode?.name) || extractMetaContent(html, 'og:title') || hostname;
  const websiteName =
    normalizeText(recipeNode?.isPartOf?.name)
    || normalizeText(recipeNode?.publisher?.name)
    || extractMetaContent(html, 'og:site_name')
    || extractMetaContent(html, 'application-name')
    || hostname;
  const author = normalizeAuthor(recipeNode?.author);
  const ingredientsText = Array.isArray(recipeNode?.recipeIngredient)
    ? recipeNode.recipeIngredient.map((item: unknown) => normalizeText(item)).filter(Boolean).join('\n')
    : '';
  const directionsText = formatRecipeSections(extractInstructionSections(recipeNode?.recipeInstructions), {
    ordered: true,
  });
  const extractedMetadata = extractRecipeMetadata({ ingredientsText, directionsText });
  const prepTime = normalizeIsoDuration(recipeNode?.prepTime) || extractedMetadata.prepTime;
  const cookTime = normalizeIsoDuration(recipeNode?.cookTime) || extractedMetadata.cookTime;
  const servings = normalizeYield(recipeNode?.recipeYield) || extractedMetadata.servings;
  const suggestedCategory = mapCategory(normalizeText(recipeNode?.recipeCategory));

  return {
    title,
    source: websiteName || author || url
      ? {
          websiteName,
          author,
          url,
        }
      : null,
    ingredientsText: extractedMetadata.ingredientsText,
    directionsText: extractedMetadata.directionsText,
    prepTime: prepTime || null,
    cookTime: cookTime || null,
    servings: servings || null,
    suggestedCategory,
  };
}
