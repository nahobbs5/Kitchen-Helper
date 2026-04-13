import type { RecipeSection } from '../data/obsidian-recipes';

export type DirectionSignalType =
  | 'time'
  | 'temperature'
  | 'internal-temperature'
  | 'equipment'
  | 'dimension'
  | 'surface-cook'
  | 'deep-cook'
  | 'doneness';

export type DirectionAnnotationType =
  | 'original-time'
  | 'crowding'
  | 'depth'
  | 'equipment'
  | 'doneness'
  | 'target-temp';

export type DirectionAnnotation = {
  type: DirectionAnnotationType;
  message: string;
  severity?: 'info' | 'warning';
};

export type DirectionDetectedSignal = {
  type: DirectionSignalType;
  match: string;
};

export type DirectionHighlightType = 'time' | 'temperature' | 'doneness';

export type DirectionHighlightRange = {
  start: number;
  end: number;
  type: DirectionHighlightType;
};

export type NormalizedDirectionStep = {
  id: string;
  stepNumber: number;
  sectionTitle: string | null;
  originalText: string;
  displayText: string;
  isEdited: boolean;
  annotations: DirectionAnnotation[];
  detectedSignals: DirectionDetectedSignal[];
  highlights: DirectionHighlightRange[];
};

type FlattenedStep = {
  id: string;
  stepNumber: number;
  sectionTitle: string | null;
  text: string;
};

type AnalyzeDirectionsInput = {
  baseSections: RecipeSection[];
  displaySections: RecipeSection[];
  stepOverrides?: Record<string, string>;
  scale: number;
  category?: string | null;
};

const timeRegex = /\b\d+(?:\s?[–-]\s?\d+)?\s*(?:minutes?|mins?|hours?|hrs?)\b/gi;
const temperatureRegex = /\b\d{2,3}\s*(?:°\s*)?(?:f|c)\b|\b\d{2,3}\s*(?:degrees?)\s*(?:f|c)?\b/gi;
const dimensionRegex = /\b\d+(?:\.\d+)?\s*(?:x|×|by)\s*\d+(?:\.\d+)?(?:\s*(?:inch|inches|in))?\b|\b\d+(?:-\d+)?(?:\s*inch|\s*inches|\s*in)\b/gi;
const equipmentRegex =
  /\b(?:pan|dish|skillet|pot|sheet pan|baking sheet|sheet|tray|bowl|casserole dish|muffin tin|muffin pan|loaf pan|springform pan|cast-iron skillet|oven-safe skillet)\b/gi;
const surfaceCookRegex = /\b(?:sear|brown|saute|sauté|fry|pan-fry|toast)\b/gi;
const deepCookRegex = /\b(?:bake|roast|oven|casserole|broil)\b/gi;
const donenessCueRegex =
  /\b(?:until|golden(?: brown)?|set|center|toothpick|hollow-sounding|fragrant|bubbly|tender|internal temperature|reaches?)\b/gi;
const internalTempCueRegex = /\b(?:internal(?:\s+temp(?:erature)?)?|thermometer|food safety|doneness|reaches?)\b/i;

function uniqueAnnotations(annotations: DirectionAnnotation[]) {
  const seen = new Set<string>();
  return annotations.filter((annotation) => {
    const key = `${annotation.type}:${annotation.message}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function uniqueSignals(signals: DirectionDetectedSignal[]) {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key = `${signal.type}:${signal.match.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function collectSignals(text: string) {
  const signals: DirectionDetectedSignal[] = [];
  const pushMatches = (regex: RegExp, type: DirectionSignalType) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      signals.push({ type, match: match[0] });
    }
  };

  pushMatches(timeRegex, 'time');
  pushMatches(temperatureRegex, 'temperature');
  pushMatches(dimensionRegex, 'dimension');
  pushMatches(equipmentRegex, 'equipment');
  pushMatches(surfaceCookRegex, 'surface-cook');
  pushMatches(deepCookRegex, 'deep-cook');
  pushMatches(donenessCueRegex, 'doneness');

  temperatureRegex.lastIndex = 0;
  if (temperatureRegex.test(text) && internalTempCueRegex.test(text)) {
    temperatureRegex.lastIndex = 0;
    const matches = text.match(temperatureRegex) ?? [];
    matches.forEach((match) => {
      signals.push({ type: 'internal-temperature', match });
    });
  }

  return uniqueSignals(signals);
}

function buildAnnotations(text: string, signals: DirectionDetectedSignal[], scale: number, isEdited: boolean) {
  if (scale === 1 || isEdited) {
    return [];
  }

  const annotations: DirectionAnnotation[] = [];
  const hasTime = signals.some((signal) => signal.type === 'time');
  const hasSurfaceCook = signals.some((signal) => signal.type === 'surface-cook');
  const hasDeepCook = signals.some((signal) => signal.type === 'deep-cook');
  const hasEquipment = signals.some((signal) => signal.type === 'equipment' || signal.type === 'dimension');
  const hasDonenessCue = signals.some((signal) => signal.type === 'doneness');
  const hasTargetTemp = signals.some((signal) => signal.type === 'internal-temperature');

  if (hasTime) {
    annotations.push({
      type: 'original-time',
      severity: 'info',
      message: 'Time shown is for the original recipe size. Use doneness cues to judge the scaled batch.',
    });
  }

  if (scale > 1 && hasSurfaceCook) {
    annotations.push({
      type: 'crowding',
      severity: 'warning',
      message: 'Scaled-up surface cooking can crowd the pan. Work in batches if browning starts to steam instead of sear.',
    });
  }

  if (scale > 1 && hasDeepCook) {
    annotations.push({
      type: 'depth',
      severity: 'warning',
      message: 'A larger single-vessel batch can cook deeper and slower. Check the center carefully rather than trusting the original timer.',
    });
  }

  if (hasEquipment) {
    annotations.push({
      type: 'equipment',
      severity: 'info',
      message: 'This step references vessel size or equipment. Make sure your pan or pot still matches the scaled volume.',
    });
  }

  if (hasDonenessCue) {
    annotations.push({
      type: 'doneness',
      severity: 'info',
      message: 'This step includes a doneness cue. Treat that cue as more reliable than the original timing when scaling.',
    });
  }

  if (hasTargetTemp) {
    annotations.push({
      type: 'target-temp',
      severity: 'info',
      message: 'Target temperatures do not change with scale. Use this reading as the source of truth.',
    });
  }

  return uniqueAnnotations(annotations);
}

function addHighlightRanges(text: string, regex: RegExp, type: DirectionHighlightType, ranges: DirectionHighlightRange[]) {
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length, type });
  }
}

function normalizeHighlights(text: string, scale: number) {
  if (scale === 1) {
    return [];
  }

  const ranges: DirectionHighlightRange[] = [];
  addHighlightRanges(text, timeRegex, 'time', ranges);
  addHighlightRanges(text, temperatureRegex, 'temperature', ranges);
  addHighlightRanges(text, donenessCueRegex, 'doneness', ranges);

  ranges.sort((left, right) => left.start - right.start || left.end - right.end);

  const merged: DirectionHighlightRange[] = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (!previous || range.start >= previous.end) {
      merged.push(range);
      continue;
    }

    if (range.end > previous.end) {
      previous.end = range.end;
    }
  }

  return merged;
}

export function splitDirectionsText(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (!normalized) {
    return [];
  }

  const lines = normalized
    .split('\n')
    .flatMap((line) => line.split(/(?=\s*\d+[.)]\s+)/))
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);

  return lines;
}

export function toDirectionSections(text: string): RecipeSection[] {
  const items = splitDirectionsText(text);
  return items.length > 0 ? [{ title: null, items }] : [];
}

export function flattenDirectionSections(sections: RecipeSection[]): FlattenedStep[] {
  let stepNumber = 0;
  return sections.flatMap((section) =>
    section.items
      .map((item) => item.trim())
      .filter(Boolean)
      .map((text) => {
        stepNumber += 1;
        return {
          id: `step-${stepNumber}`,
          stepNumber,
          sectionTitle: section.title ?? null,
          text,
        };
      })
  );
}

export function buildDirectionStepOverrides(baseSections: RecipeSection[], displaySections: RecipeSection[]) {
  const baseSteps = flattenDirectionSections(baseSections);
  const displaySteps = flattenDirectionSections(displaySections);
  const maxLength = Math.max(baseSteps.length, displaySteps.length);
  const overrides: Record<string, string> = {};

  for (let index = 0; index < maxLength; index += 1) {
    const stepId = `step-${index + 1}`;
    const baseText = baseSteps[index]?.text ?? '';
    const displayText = displaySteps[index]?.text ?? '';

    if (baseText !== displayText) {
      overrides[stepId] = displayText;
    }
  }

  return overrides;
}

export function replaceDirectionStepText(sections: RecipeSection[], stepId: string, nextText: string) {
  const index = Number(stepId.replace('step-', '')) - 1;

  if (!Number.isFinite(index) || index < 0) {
    return sections;
  }

  let currentIndex = 0;
  let replaced = false;

  const nextSections = sections.map((section) => {
    const nextItems = section.items.map((item) => {
      const itemIndex = currentIndex;
      currentIndex += 1;

      if (itemIndex !== index) {
        return item;
      }

      replaced = true;
      return nextText.trim();
    });

    return {
      ...section,
      items: nextItems.filter((item) => item.trim().length > 0),
    };
  });

  if (replaced) {
    return nextSections.filter((section) => section.title || section.items.length > 0);
  }

  if (!nextText.trim()) {
    return sections;
  }

  if (nextSections.length === 0) {
    return [{ title: null, items: [nextText.trim()] }];
  }

  const lastSection = nextSections[nextSections.length - 1];
  return [
    ...nextSections.slice(0, -1),
    {
      ...lastSection,
      items: [...lastSection.items, nextText.trim()],
    },
  ];
}

export function analyzeScaledDirections({
  baseSections,
  displaySections,
  stepOverrides = {},
  scale,
}: AnalyzeDirectionsInput): NormalizedDirectionStep[] {
  const baseSteps = flattenDirectionSections(baseSections);
  const displaySteps = flattenDirectionSections(displaySections);
  const maxLength = Math.max(baseSteps.length, displaySteps.length);
  const steps: NormalizedDirectionStep[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const baseStep = baseSteps[index];
    const displayStep = displaySteps[index];
    const stepId = `step-${index + 1}`;
    const originalText = baseStep?.text ?? '';
    const displayText = displayStep?.text ?? stepOverrides[stepId] ?? originalText;

    if (!displayText.trim()) {
      continue;
    }

    const isEdited =
      Object.prototype.hasOwnProperty.call(stepOverrides, stepId) && stepOverrides[stepId] !== originalText;
    const detectedSignals = collectSignals(displayText);

    steps.push({
      id: stepId,
      stepNumber: index + 1,
      sectionTitle: displayStep?.sectionTitle ?? baseStep?.sectionTitle ?? null,
      originalText,
      displayText,
      isEdited,
      annotations: buildAnnotations(displayText, detectedSignals, scale, isEdited),
      detectedSignals,
      highlights: normalizeHighlights(displayText, scale),
    });
  }

  return steps;
}
