import type { AiImportedRecipe } from './ai-recipe-import';
import { directionsHeadingPattern, ingredientHeadingPattern, notesHeadingPattern } from './ocr-recipe-parser';
import { extractRecipeMetadata } from './recipe-metadata';
import { parseRecipeSectionsText } from './recipe-sections';

const categoryHeadingPattern = /^(category|course)$/i;
const cuisineHeadingPattern = /^(cuisine|cuisine region|region)$/i;

const categoryLinePattern = /^\*{0,2}(category|course)\*{0,2}\s*:\s*(.+)$/i;
const cuisineLinePattern = /^\*{0,2}(cuisine(?:\s*region)?|region)\*{0,2}\s*:\s*(.+)$/i;

const frontmatterPattern = /^---\s*\n[\s\S]*?\n---\s*\n?/;
const h1Pattern = /^#\s+(.+?)\s*#*\s*$/;
const markdownHeadingPattern = /^#{2,6}\s+(.+?)\s*#*\s*$/;
const boldOnlyHeadingPattern = /^\*\*(.+?)\*\*:?\s*$/;
const bareHeadingPattern = /^([A-Za-z][A-Za-z\s/]{1,40}):\s*$/;

type SectionBucket = 'ingredients' | 'directions' | 'notes' | 'category' | 'cuisine';

function cleanHeading(value: string) {
  return value.replace(/[*_`]/g, '').trim();
}

function stripInlineEmphasis(value: string) {
  return value.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1');
}

function headingText(line: string): string | null {
  const markdownMatch = markdownHeadingPattern.exec(line);
  if (markdownMatch) {
    return cleanHeading(markdownMatch[1]);
  }

  const boldMatch = boldOnlyHeadingPattern.exec(line);
  if (boldMatch) {
    return cleanHeading(boldMatch[1]);
  }

  const bareMatch = bareHeadingPattern.exec(line);
  if (bareMatch) {
    return cleanHeading(bareMatch[1]);
  }

  return null;
}

function classifyHeading(heading: string): SectionBucket | null {
  if (ingredientHeadingPattern.test(heading)) return 'ingredients';
  if (directionsHeadingPattern.test(heading)) return 'directions';
  if (notesHeadingPattern.test(heading)) return 'notes';
  if (categoryHeadingPattern.test(heading)) return 'category';
  if (cuisineHeadingPattern.test(heading)) return 'cuisine';
  return null;
}

function extractInlineField(lines: string[], pattern: RegExp) {
  let value: string | null = null;
  const rest: string[] = [];

  for (const line of lines) {
    if (!value) {
      const match = pattern.exec(line.trim());
      if (match) {
        value = match[2].replace(/[*_`]/g, '').trim();
        continue;
      }
    }

    rest.push(line);
  }

  return { value, rest };
}

export function parseRecipeFromMarkdown(markdown: string): AiImportedRecipe {
  const lines = markdown
    .replace(frontmatterPattern, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  let title = '';
  let currentBucket: SectionBucket | null = null;
  let foundAnySection = false;
  const preambleLines: string[] = [];
  const buckets: Record<SectionBucket, string[]> = {
    ingredients: [],
    directions: [],
    notes: [],
    category: [],
    cuisine: [],
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const h1Match = h1Pattern.exec(line);
    if (h1Match && !title) {
      title = cleanHeading(h1Match[1]);
      continue;
    }

    const heading = headingText(line);
    if (heading) {
      const bucket = classifyHeading(heading);

      if (bucket) {
        currentBucket = bucket;
        foundAnySection = true;
        continue;
      }

      if (currentBucket) {
        // An unrecognized heading inside a known section is a sub-heading
        // (e.g. "### For the Crust") — keep it verbatim so parseRecipeSectionsText
        // can split it back out as a sub-section.
        buckets[currentBucket].push(line);
        continue;
      }

      if (!title && !foundAnySection) {
        title = heading;
      }

      continue;
    }

    if (currentBucket) {
      buckets[currentBucket].push(stripInlineEmphasis(line));
      continue;
    }

    if (!foundAnySection) {
      preambleLines.push(stripInlineEmphasis(line));
    }
  }

  const categoryFromPreamble = extractInlineField(preambleLines, categoryLinePattern);
  const cuisineFromPreamble = extractInlineField(categoryFromPreamble.rest, cuisineLinePattern);

  const ingredientsRaw = buckets.ingredients.join('\n');
  const directionsRaw = buckets.directions.join('\n');
  const notesRaw = [cuisineFromPreamble.rest.join('\n'), buckets.notes.join('\n')].filter(Boolean).join('\n');

  const ingredientSections = parseRecipeSectionsText(ingredientsRaw);
  const directionSections = parseRecipeSectionsText(directionsRaw, { ordered: true });

  if (ingredientSections.length === 0 && directionSections.length === 0) {
    throw new Error(
      'No ingredients or directions were found in that markdown. Check that it has Ingredients and Instructions sections.'
    );
  }

  const extracted = extractRecipeMetadata({
    ingredientsText: ingredientsRaw,
    directionsText: directionsRaw,
    notesText: notesRaw,
  });

  const suggestedCategory = buckets.category.join(' ').trim() || categoryFromPreamble.value || null;
  const cuisineRegion = buckets.cuisine.join(' ').trim() || cuisineFromPreamble.value || null;

  return {
    title,
    ingredientSections,
    directionSections,
    prepTime: extracted.prepTime,
    cookTime: extracted.cookTime,
    servings: extracted.servings,
    notes: extracted.notesText.trim() || null,
    suggestedCategory,
    cuisineRegion,
    allergenTags: [],
    allergyFriendlyTags: [],
  };
}
