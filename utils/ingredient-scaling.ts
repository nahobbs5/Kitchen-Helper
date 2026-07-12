const unicodeFractionMap: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅐': 1 / 7,
  '⅑': 1 / 9,
  '⅒': 0.1,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

const unicodeFractionChars = Object.keys(unicodeFractionMap).join('');

const mixedSeparator = '(?:\\s*&\\s*|\\s+and\\s+)';

const numberPattern =
  `(?:\\d+${mixedSeparator}\\d+/\\d+|\\d+${mixedSeparator}[${unicodeFractionChars}]|\\d+\\s+\\d+/\\d+|\\d+\\s+[${unicodeFractionChars}]|\\d+[${unicodeFractionChars}]|\\d+/\\d+|\\d+(?:\\.\\d+)?|[${unicodeFractionChars}])`;

const qualitativeAmountPattern =
  '(?:pinches|pinch|dashes|dash|sprinkles|sprinkle|splashes|splash|drizzles|drizzle|handfuls|handful|knobs|knob)';

const unitWordMap: Record<string, { singular: string; plural: string }> = {
  teaspoon: { singular: 'teaspoon', plural: 'teaspoons' },
  teaspoons: { singular: 'teaspoon', plural: 'teaspoons' },
  tsp: { singular: 'tsp', plural: 'tsp' },
  tablespoon: { singular: 'tablespoon', plural: 'tablespoons' },
  tablespoons: { singular: 'tablespoon', plural: 'tablespoons' },
  tbsp: { singular: 'tbsp', plural: 'tbsp' },
  cup: { singular: 'cup', plural: 'cups' },
  cups: { singular: 'cup', plural: 'cups' },
  ounce: { singular: 'ounce', plural: 'ounces' },
  ounces: { singular: 'ounce', plural: 'ounces' },
  oz: { singular: 'oz', plural: 'oz' },
  pound: { singular: 'pound', plural: 'pounds' },
  pounds: { singular: 'pound', plural: 'pounds' },
  lb: { singular: 'lb', plural: 'lb' },
  gram: { singular: 'gram', plural: 'grams' },
  grams: { singular: 'gram', plural: 'grams' },
  g: { singular: 'g', plural: 'g' },
  kilogram: { singular: 'kilogram', plural: 'kilograms' },
  kilograms: { singular: 'kilogram', plural: 'kilograms' },
  kg: { singular: 'kg', plural: 'kg' },
  milliliter: { singular: 'milliliter', plural: 'milliliters' },
  milliliters: { singular: 'milliliter', plural: 'milliliters' },
  ml: { singular: 'ml', plural: 'ml' },
  liter: { singular: 'liter', plural: 'liters' },
  liters: { singular: 'liter', plural: 'liters' },
  l: { singular: 'l', plural: 'l' },
  clove: { singular: 'clove', plural: 'cloves' },
  cloves: { singular: 'clove', plural: 'cloves' },
  egg: { singular: 'egg', plural: 'eggs' },
  eggs: { singular: 'egg', plural: 'eggs' },
  can: { singular: 'can', plural: 'cans' },
  cans: { singular: 'can', plural: 'cans' },
  package: { singular: 'package', plural: 'packages' },
  packages: { singular: 'package', plural: 'packages' },
  stick: { singular: 'stick', plural: 'sticks' },
  sticks: { singular: 'stick', plural: 'sticks' },
  onion: { singular: 'onion', plural: 'onions' },
  onions: { singular: 'onion', plural: 'onions' },
  shallot: { singular: 'shallot', plural: 'shallots' },
  shallots: { singular: 'shallot', plural: 'shallots' },
  scallion: { singular: 'scallion', plural: 'scallions' },
  scallions: { singular: 'scallion', plural: 'scallions' },
  carrot: { singular: 'carrot', plural: 'carrots' },
  carrots: { singular: 'carrot', plural: 'carrots' },
  potato: { singular: 'potato', plural: 'potatoes' },
  potatoes: { singular: 'potato', plural: 'potatoes' },
  tomato: { singular: 'tomato', plural: 'tomatoes' },
  tomatoes: { singular: 'tomato', plural: 'tomatoes' },
  pepper: { singular: 'pepper', plural: 'peppers' },
  peppers: { singular: 'pepper', plural: 'peppers' },
  chile: { singular: 'chile', plural: 'chiles' },
  chiles: { singular: 'chile', plural: 'chiles' },
  cucumber: { singular: 'cucumber', plural: 'cucumbers' },
  cucumbers: { singular: 'cucumber', plural: 'cucumbers' },
  zucchini: { singular: 'zucchini', plural: 'zucchini' },
  mushroom: { singular: 'mushroom', plural: 'mushrooms' },
  mushrooms: { singular: 'mushroom', plural: 'mushrooms' },
  avocado: { singular: 'avocado', plural: 'avocados' },
  avocados: { singular: 'avocado', plural: 'avocados' },
  apple: { singular: 'apple', plural: 'apples' },
  apples: { singular: 'apple', plural: 'apples' },
  banana: { singular: 'banana', plural: 'bananas' },
  bananas: { singular: 'banana', plural: 'bananas' },
  lemon: { singular: 'lemon', plural: 'lemons' },
  lemons: { singular: 'lemon', plural: 'lemons' },
  lime: { singular: 'lime', plural: 'limes' },
  limes: { singular: 'lime', plural: 'limes' },
  orange: { singular: 'orange', plural: 'oranges' },
  oranges: { singular: 'orange', plural: 'oranges' },
  stalk: { singular: 'stalk', plural: 'stalks' },
  stalks: { singular: 'stalk', plural: 'stalks' },
  sprig: { singular: 'sprig', plural: 'sprigs' },
  sprigs: { singular: 'sprig', plural: 'sprigs' },
  leaf: { singular: 'leaf', plural: 'leaves' },
  leaves: { singular: 'leaf', plural: 'leaves' },
  slice: { singular: 'slice', plural: 'slices' },
  slices: { singular: 'slice', plural: 'slices' },
  strip: { singular: 'strip', plural: 'strips' },
  strips: { singular: 'strip', plural: 'strips' },
  piece: { singular: 'piece', plural: 'pieces' },
  pieces: { singular: 'piece', plural: 'pieces' },
  head: { singular: 'head', plural: 'heads' },
  heads: { singular: 'head', plural: 'heads' },
  bunch: { singular: 'bunch', plural: 'bunches' },
  bunches: { singular: 'bunch', plural: 'bunches' },
  ear: { singular: 'ear', plural: 'ears' },
  ears: { singular: 'ear', plural: 'ears' },
  slab: { singular: 'slab', plural: 'slabs' },
  slabs: { singular: 'slab', plural: 'slabs' },
  fillet: { singular: 'fillet', plural: 'fillets' },
  fillets: { singular: 'fillet', plural: 'fillets' },
};

// Size words that describe a count of whole items (e.g. "4 large", "2 medium
// onions"). The number is a quantity and must scale, but the word itself stays
// as-is. Kept separate from units so non-quantity numbers (temperatures, times,
// ratios) are never touched.
const countDescriptors = new Set([
  'large',
  'medium',
  'small',
  'jumbo',
  'whole',
  'extra-large',
]);

function normalizeUnitWord(word: string): string {
  return word.toLowerCase().replace(/\.$/, '');
}

function parseSingleAmount(value: string): number | null {
  const trimmed = value.trim().replace(/\s*&\s*|\s+and\s+/i, ' ');

  if (unicodeFractionMap[trimmed] !== undefined) {
    return unicodeFractionMap[trimmed];
  }

  if (/^\d+\s+\d+\/\d+$/.test(trimmed)) {
    const [whole, fraction] = trimmed.split(/\s+/);
    const fractionValue = parseSingleAmount(fraction);
    return fractionValue === null ? null : Number(whole) + fractionValue;
  }

  if (new RegExp(`^\\d+\\s+[${unicodeFractionChars}]$`).test(trimmed)) {
    const [whole, fractionChar] = trimmed.split(/\s+/);
    const fractionValue = parseSingleAmount(fractionChar);
    return fractionValue === null ? null : Number(whole) + fractionValue;
  }

  if (new RegExp(`^\\d+[${unicodeFractionChars}]$`).test(trimmed)) {
    const whole = trimmed.slice(0, -1);
    const fractionChar = trimmed.slice(-1);
    const fractionValue = parseSingleAmount(fractionChar);
    return fractionValue === null ? null : Number(whole) + fractionValue;
  }

  if (/^\d+\/\d+$/.test(trimmed)) {
    const [numerator, denominator] = trimmed.split('/');
    return Number(numerator) / Number(denominator);
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatScaledAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;

  if (Number.isInteger(rounded)) {
    return `${rounded}`;
  }

  const friendlyFractions = [
    { value: 0.125, label: '1/8' },
    { value: 0.25, label: '1/4' },
    { value: 1 / 3, label: '1/3' },
    { value: 0.375, label: '3/8' },
    { value: 0.5, label: '1/2' },
    { value: 0.625, label: '5/8' },
    { value: 2 / 3, label: '2/3' },
    { value: 0.75, label: '3/4' },
    { value: 0.875, label: '7/8' },
  ];

  const whole = Math.floor(rounded);
  const fraction = rounded - whole;
  const closeFraction = friendlyFractions.find((entry) => Math.abs(entry.value - fraction) < 0.03);

  if (closeFraction) {
    if (whole === 0) {
      return closeFraction.label;
    }

    return `${whole} ${closeFraction.label}`;
  }

  return `${rounded}`;
}

function scaleQualitativeAmountText(text: string, multiplier: number): string | null {
  const pattern = new RegExp(`^(\\s*)(?:(?:a|an)\\s+)?(${qualitativeAmountPattern})(\\b.*)$`, 'i');
  const match = text.match(pattern);

  if (!match) {
    return null;
  }

  const [, whitespace, qualitativeAmount, rest] = match;
  return `${whitespace}(${formatScaledAmount(multiplier)}x) ${qualitativeAmount}${scaleParentheticalMeasurements(
    rest,
    multiplier
  )}`;
}

function shouldUseSingular(quantity: number): boolean {
  return quantity <= 1.01;
}

function pluralizeLeadingUnit(remainder: string, quantity: number): string {
  const match = remainder.match(/^(\s*)([A-Za-z]+(?:-[A-Za-z]+)*)(\b.*)$/);

  if (!match) {
    return remainder;
  }

  const [, whitespace, word, rest] = match;
  const normalizedWord = normalizeUnitWord(word);

  // Skip a size descriptor ("4 large eggs") so the count noun after it gets
  // singularized/pluralized instead of the adjective.
  if (countDescriptors.has(normalizedWord)) {
    return `${whitespace}${word}${pluralizeLeadingUnit(rest, quantity)}`;
  }

  const unit = unitWordMap[normalizedWord];

  if (!unit) {
    return remainder;
  }

  const replacement = shouldUseSingular(quantity) ? unit.singular : unit.plural;
  return `${whitespace}${replacement}${rest}`;
}

function scaleMeasurementText(
  measurementMatch: string,
  firstAmount: string,
  rangeText: string | undefined,
  secondAmount: string | undefined,
  unitSpacing: string,
  unitWord: string,
  multiplier: number
) {
  const normalizedWord = normalizeUnitWord(unitWord);
  const unit = unitWordMap[normalizedWord];
  const isCountDescriptor = !unit && countDescriptors.has(normalizedWord);

  if (!unit && !isCountDescriptor) {
    return measurementMatch;
  }

  const firstValue = parseSingleAmount(firstAmount);

  if (firstValue === null) {
    return measurementMatch;
  }

  const scaledFirstValue = firstValue * multiplier;
  let scaledAmount = formatScaledAmount(scaledFirstValue);
  let quantityForUnit = scaledFirstValue;

  if (rangeText && secondAmount) {
    const secondValue = parseSingleAmount(secondAmount);

    if (secondValue !== null) {
      const separator = rangeText.includes('–') ? '–' : '-';
      const scaledSecondValue = secondValue * multiplier;
      scaledAmount = `${scaledAmount}${separator}${formatScaledAmount(scaledSecondValue)}`;
      quantityForUnit = Math.max(scaledFirstValue, scaledSecondValue);
    }
  }

  const spacing = unitSpacing || ' ';

  if (isCountDescriptor) {
    return `${scaledAmount}${spacing}${unitWord}`;
  }

  const replacementUnit = shouldUseSingular(quantityForUnit) ? unit!.singular : unit!.plural;
  return `${scaledAmount}${spacing}${replacementUnit}`;
}

function scaleInlineMeasurements(text: string, multiplier: number) {
  const measurementPattern = new RegExp(
    `(${numberPattern})(\\s*[-–]\\s*(${numberPattern}))?(\\s*)([A-Za-z]+\\.?)\\b`,
    'g'
  );

  return text.replace(
    measurementPattern,
    (measurementMatch, firstAmount, rangeText, secondAmount, unitSpacing, unitWord) =>
      scaleMeasurementText(
        measurementMatch,
        firstAmount,
        rangeText,
        secondAmount,
        unitSpacing,
        unitWord,
        multiplier
      )
  );
}

/**
 * Scales every recognized measurement (amount + unit, e.g. "2 cups") found
 * anywhere within free-form text, such as a recipe direction sentence.
 * Unlike scaleIngredientLine, it does not assume the text starts with a
 * quantity, and it leaves numbers without a recognized unit (times,
 * temperatures, plain word counts) untouched.
 */
export function scaleMeasurementsInText(text: string, multiplier: number): string {
  if (multiplier === 1) {
    return text;
  }

  return scaleInlineMeasurements(text, multiplier);
}

function scaleParentheticalMeasurements(text: string, multiplier: number): string {
  const parentheticalPattern = /\(([^)]*)\)/g;

  return text.replace(parentheticalPattern, (fullMatch, content: string) => {
    const scaledContent = scaleInlineMeasurements(content, multiplier);
    return `(${scaledContent})`;
  });
}

export function formatScaleLabel(multiplier: number): string {
  return `${formatScaledAmount(multiplier)}x`;
}

export function extractBaseServings(servingsText: string | null): number | null {
  if (!servingsText) {
    return null;
  }

  const normalized = servingsText.replace(/[–—]/g, '-');
  const match = normalized.match(/(\d+(?:\.\d+)?)/);

  return match ? Number(match[1]) : null;
}

export function scaleIngredientLine(line: string, multiplier: number): string {
  if (multiplier === 1) {
    return line;
  }

  const optionalPrefixMatch = line.match(/^(\s*(?:\(\s*optional\s*\)|optional)\s*:?\s*)(.+)$/i);

  if (optionalPrefixMatch) {
    const [, optionalPrefix, optionalText] = optionalPrefixMatch;
    const scaledQualitativeText = scaleQualitativeAmountText(optionalText, multiplier);

    if (scaledQualitativeText) {
      return `${optionalPrefix}${scaledQualitativeText}`;
    }

    return `${optionalPrefix}${scaleInlineMeasurements(optionalText, multiplier)}`;
  }

  const scaledQualitativeLine = scaleQualitativeAmountText(line, multiplier);

  if (scaledQualitativeLine) {
    return scaledQualitativeLine;
  }

  const trimmed = line.trim();
  const pattern = new RegExp(`^(${numberPattern})(\\s*[-–]\\s*(${numberPattern}))?(.*)$`);
  const match = trimmed.match(pattern);

  if (!match) {
    return scaleParentheticalMeasurements(line, multiplier);
  }

  const [, firstAmount, rangeText, secondAmount, remainder] = match;
  const firstValue = parseSingleAmount(firstAmount);

  if (firstValue === null) {
    return scaleParentheticalMeasurements(line, multiplier);
  }

  const scaledFirst = formatScaledAmount(firstValue * multiplier);

  if (rangeText && secondAmount) {
    const secondValue = parseSingleAmount(secondAmount);

    if (secondValue === null) {
      const scaledRemainder = pluralizeLeadingUnit(remainder, firstValue * multiplier);
      return `${scaledFirst}${scaleParentheticalMeasurements(scaledRemainder, multiplier)}`;
    }

    const separator = rangeText.includes('–') ? '–' : '-';
    const scaledSecondValue = secondValue * multiplier;
    const scaledRemainder = pluralizeLeadingUnit(
      remainder,
      Math.max(firstValue * multiplier, scaledSecondValue)
    );

    return `${scaledFirst}${separator}${formatScaledAmount(scaledSecondValue)}${scaleParentheticalMeasurements(
      scaledRemainder,
      multiplier
    )}`;
  }

  const scaledRemainder = pluralizeLeadingUnit(remainder, firstValue * multiplier);
  return `${scaledFirst}${scaleParentheticalMeasurements(scaledRemainder, multiplier)}`;
}
