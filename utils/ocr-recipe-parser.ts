export type ParsedOcrRecipe = {
  title: string;
  ingredientsText: string;
  directionsText: string;
  notesText: string;
};

const ingredientHeadingPattern = /^(ingredients?|ingredient list)$/i;
const directionsHeadingPattern = /^(directions?|instructions?|method|steps?|preparation)$/i;
const notesHeadingPattern = /^(notes?|tips?|serving notes?)$/i;

function cleanLine(line: string) {
  return line
    .replace(/\s+/g, ' ')
    .replace(/[•●▪◦]/g, '-')
    .trim();
}

function isLikelyIngredientLine(line: string) {
  return /^[-*]?\s*(\d+([./]\d+)?|\d+\s+\d+\/\d+|¼|½|¾|⅓|⅔|⅛|⅜|⅝|⅞)\b/i.test(line)
    || /^[-*]?\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|pound|pounds|gram|grams|g|kg|ml|l)\b/i.test(line)
    || /^[-*]?\s*(pinch|dash)\b/i.test(line);
}

function normalizeBlock(lines: string[]) {
  return lines
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .join('\n');
}

export function parseOcrRecipeText(rawText: string): ParsedOcrRecipe {
  const normalizedLines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const title =
    normalizedLines.find(
      (line) =>
        !ingredientHeadingPattern.test(line)
        && !directionsHeadingPattern.test(line)
        && !notesHeadingPattern.test(line)
        && line.length > 2
    ) ?? '';

  let section: 'intro' | 'ingredients' | 'directions' | 'notes' = 'intro';
  const ingredientLines: string[] = [];
  const directionLines: string[] = [];
  const notesLines: string[] = [];
  const introLines: string[] = [];

  for (const line of normalizedLines) {
    if (line === title) {
      continue;
    }

    if (ingredientHeadingPattern.test(line)) {
      section = 'ingredients';
      continue;
    }

    if (directionsHeadingPattern.test(line)) {
      section = 'directions';
      continue;
    }

    if (notesHeadingPattern.test(line)) {
      section = 'notes';
      continue;
    }

    if (section === 'ingredients') {
      ingredientLines.push(line);
      continue;
    }

    if (section === 'directions') {
      directionLines.push(line);
      continue;
    }

    if (section === 'notes') {
      notesLines.push(line);
      continue;
    }

    introLines.push(line);
  }

  if (ingredientLines.length === 0 && directionLines.length === 0) {
    const fallbackIngredients = introLines.filter(isLikelyIngredientLine);
    const fallbackDirections = introLines.filter((line) => !isLikelyIngredientLine(line));

    return {
      title,
      ingredientsText: normalizeBlock(fallbackIngredients),
      directionsText: normalizeBlock(fallbackDirections),
      notesText: '',
    };
  }

  return {
    title,
    ingredientsText: normalizeBlock(ingredientLines),
    directionsText: normalizeBlock(directionLines),
    notesText: normalizeBlock(notesLines),
  };
}
