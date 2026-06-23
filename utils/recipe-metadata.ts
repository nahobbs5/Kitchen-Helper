export type RecipeMetadata = {
  prepTime: string | null;
  cookTime: string | null;
  servings: string | null;
};

type ExtractMetadataInput = {
  ingredientsText?: string;
  directionsText?: string;
  notesText?: string;
};

type ExtractedMetadata = RecipeMetadata & {
  ingredientsText: string;
  directionsText: string;
  notesText: string;
};

const emptyMetadata: RecipeMetadata = {
  prepTime: null,
  cookTime: null,
  servings: null,
};

function cleanMetadataValue(value: string) {
  return value.replace(/\s+/g, ' ').replace(/[.;,]+$/g, '').trim();
}

function normalizeTextBlock(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function matchStandaloneMetadata(line: string): RecipeMetadata | null {
  const trimmed = line.replace(/^[-*]\s*/, '').trim();
  const prepMatch = trimmed.match(/^prep(?:aration)?(?:\s*time)?\s*[:–-]\s*(.+)$/i);
  const cookMatch = trimmed.match(/^(?:cook|bake|roast|simmer)(?:\s*time)?\s*[:–-]\s*(.+)$/i);
  const servingsMatch = trimmed.match(/^(servings?|serves|yield)\s*[:–-]?\s*(.+)$/i);

  if (prepMatch) {
    return { ...emptyMetadata, prepTime: cleanMetadataValue(prepMatch[1]) };
  }

  if (cookMatch) {
    return { ...emptyMetadata, cookTime: cleanMetadataValue(cookMatch[1]) };
  }

  if (servingsMatch) {
    return { ...emptyMetadata, servings: cleanMetadataValue(servingsMatch[2]) };
  }

  return null;
}

function extractIngredientHeadingServings(text: string) {
  const match = text.match(/\bingredients?\s*\(([^)]*\bservings?\b[^)]*)\)/i);

  return match ? cleanMetadataValue(match[1]) : null;
}

function extractCookTimeFromDirections(text: string) {
  const match = text.match(
    /\b(?:bake|cook|roast|simmer|boil|broil|grill|saute|sauté)\b[^.\n]{0,60}?\b(?:for\s+)?(\d+(?:\s?[–-]\s?\d+)?\s*(?:minutes?|mins?|hours?|hrs?))/i
  );

  return match ? cleanMetadataValue(match[1]) : null;
}

function mergeMetadata(base: RecipeMetadata, next: RecipeMetadata) {
  return {
    prepTime: base.prepTime ?? next.prepTime,
    cookTime: base.cookTime ?? next.cookTime,
    servings: base.servings ?? next.servings,
  };
}

function stripStandaloneMetadataLines(text: string) {
  let metadata: RecipeMetadata = { ...emptyMetadata };
  const lines = text.split(/\r?\n/);
  const keptLines: string[] = [];
  let removedMetadataLine = false;

  lines.forEach((line) => {
    const lineMetadata = matchStandaloneMetadata(line);

    if (lineMetadata) {
      metadata = mergeMetadata(metadata, lineMetadata);
      removedMetadataLine = true;
      return;
    }

    keptLines.push(line);
  });

  return {
    metadata,
    text: removedMetadataLine ? normalizeTextBlock(keptLines.join('\n')) : text,
  };
}

export function extractRecipeMetadata(input: ExtractMetadataInput): ExtractedMetadata {
  const ingredients = stripStandaloneMetadataLines(input.ingredientsText ?? '');
  const directions = stripStandaloneMetadataLines(input.directionsText ?? '');
  const notes = stripStandaloneMetadataLines(input.notesText ?? '');
  const headingServings = extractIngredientHeadingServings(input.ingredientsText ?? '');
  const directionCookTime = extractCookTimeFromDirections(input.directionsText ?? '');
  const merged = [ingredients.metadata, directions.metadata, notes.metadata].reduce(
    (current, next) => mergeMetadata(current, next),
    { ...emptyMetadata }
  );

  return {
    prepTime: merged.prepTime,
    cookTime: merged.cookTime ?? directionCookTime,
    servings: merged.servings ?? headingServings,
    ingredientsText: ingredients.text,
    directionsText: directions.text,
    notesText: notes.text,
  };
}

export function normalizeRecipeMetadata(input: RecipeMetadata): RecipeMetadata {
  return {
    prepTime: input.prepTime?.trim() ? input.prepTime.trim() : null,
    cookTime: input.cookTime?.trim() ? input.cookTime.trim() : null,
    servings: input.servings?.trim() ? input.servings.trim() : null,
  };
}

type CookVerbInput = {
  title?: string | null;
  category?: string | null;
  directions?: { items: string[] }[] | null;
};

export function resolveCookVerb(input: CookVerbInput): 'Bake' | 'Cook' {
  const title = (input.title ?? '').toLowerCase();
  const directionsText = (input.directions ?? [])
    .flatMap((section) => section.items ?? [])
    .join(' ')
    .toLowerCase();

  const noBake = /\bno[-\s]?bake\b/;
  const bakeWord = /\b(baked|baking|bake|roast(?:ed|ing)?)\b/;
  const ovenCue = /\b(preheat|oven|bake|roast)\b|\b\d{3}\s*(?:°|degrees?|f\b|c\b)|°[fc]/;
  const chilledCue = /\b(no[-\s]?bake|icebox|refrigerat\w*|chill\w*|freez\w*|frozen)\b/;

  // 1. Title is authoritative
  if (noBake.test(title)) return 'Cook';
  if (bakeWord.test(title)) return 'Bake';

  // 2. Oven cues in directions (unless directions explicitly say no-bake)
  if (!noBake.test(directionsText) && ovenCue.test(directionsText)) return 'Bake';

  // 3. Dessert fallback: flip clearly non-baked desserts to Cook
  if (input.category === 'Dessert') {
    if (chilledCue.test(title) || chilledCue.test(directionsText)) return 'Cook';
    return 'Bake'; // preserve current default for desserts we can't disambiguate
  }

  // 4. Default
  return 'Cook';
}

export function formatCookTimeTag(recipe: CookVerbInput, cookTime: string) {
  return `${resolveCookVerb(recipe)}: ${cookTime}`;
}

export function parseRecipeTimeMinutes(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(days?|d|hours?|hrs?|hr|h|minutes?|mins?|min|m)\b/g, '$2 $3')
    .replace(/\s+/g, ' ')
    .trim();
  const matches = [...normalized.matchAll(/\b(\d+(?:\.\d+)?)\s*(days?|d|hours?|hrs?|hr|h|minutes?|mins?|min|m)\b/g)];

  if (matches.length === 0) {
    return null;
  }

  const totalMinutes = matches.reduce((total, match) => {
    const amount = Number(match[1]);
    const unit = match[2];

    if (!Number.isFinite(amount)) {
      return total;
    }

    if (unit.startsWith('d')) {
      return total + amount * 24 * 60;
    }

    if (unit.startsWith('h')) {
      return total + amount * 60;
    }

    return total + amount;
  }, 0);

  return totalMinutes > 0 ? totalMinutes : null;
}

export function normalizeIsoDuration(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/i);

  if (!match) {
    return cleanMetadataValue(trimmed);
  }

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }

  return parts.join(' ');
}
