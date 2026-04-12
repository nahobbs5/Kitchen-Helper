type ImportedRecipe = {
  title: string;
  source: {
    websiteName: string;
    author: string;
    url: string;
  } | null;
  ingredientsText: string;
  directionsText: string;
  suggestedCategory: string | null;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? stripHtml(value) : '';
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

function extractInstructions(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((line) => normalizeText(line))
      .filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractInstructions(item));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, any>;

    if (typeof record.text === 'string') {
      return [normalizeText(record.text)];
    }

    if (record.itemListElement) {
      return extractInstructions(record.itemListElement);
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
  const directionsText = extractInstructions(recipeNode?.recipeInstructions).join('\n');
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
    ingredientsText,
    directionsText,
    suggestedCategory,
  };
}
