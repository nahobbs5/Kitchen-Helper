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

const numberPattern =
  `(?:\\d+\\s+\\d+/\\d+|\\d+\\s+[${unicodeFractionChars}]|\\d+[${unicodeFractionChars}]|\\d+/\\d+|\\d+(?:\\.\\d+)?|[${unicodeFractionChars}])`;

const unitWordMap: Record<string, { singular: string; plural: string }> = {
  teaspoon: { singular: 'teaspoon', plural: 'teaspoons' },
  teaspoons: { singular: 'teaspoon', plural: 'teaspoons' },
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
};

function normalizeUnitWord(word: string): string {
  return word.toLowerCase().replace(/\.$/, '');
}

function parseSingleAmount(value: string): number | null {
  const trimmed = value.trim();

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

function shouldUseSingular(quantity: number): boolean {
  return quantity <= 1.01;
}

function pluralizeLeadingUnit(remainder: string, quantity: number): string {
  const match = remainder.match(/^(\s*)([A-Za-z]+)(\b.*)$/);

  if (!match) {
    return remainder;
  }

  const [, whitespace, word, rest] = match;
  const normalizedWord = normalizeUnitWord(word);
  const unit = unitWordMap[normalizedWord];

  if (!unit) {
    return remainder;
  }

  const replacement = shouldUseSingular(quantity) ? unit.singular : unit.plural;
  return `${whitespace}${replacement}${rest}`;
}

function scaleParentheticalMeasurements(text: string, multiplier: number): string {
  const pattern = new RegExp(
    `\\(\\s*(${numberPattern})(\\s*[-–]\\s*(${numberPattern}))?(\\s+)([A-Za-z]+\\.?)([^)]*)\\)`,
    'g'
  );

  return text.replace(
    pattern,
    (fullMatch, firstAmount, rangeText, secondAmount, unitSpacing, unitWord, rest) => {
      const unit = unitWordMap[normalizeUnitWord(unitWord)];

      if (!unit) {
        return fullMatch;
      }

      const firstValue = parseSingleAmount(firstAmount);

      if (firstValue === null) {
        return fullMatch;
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

      const replacementUnit = shouldUseSingular(quantityForUnit) ? unit.singular : unit.plural;
      return `(${scaledAmount}${unitSpacing}${replacementUnit}${rest})`;
    }
  );
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

  const trimmed = line.trim();
  const pattern = new RegExp(`^(${numberPattern})(\\s*[-–]\\s*(${numberPattern}))?(.*)$`);
  const match = trimmed.match(pattern);

  if (!match) {
    return line;
  }

  const [, firstAmount, rangeText, secondAmount, remainder] = match;
  const firstValue = parseSingleAmount(firstAmount);

  if (firstValue === null) {
    return line;
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
