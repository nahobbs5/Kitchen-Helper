import { parseRecipeTimeMinutes } from './recipe-metadata';

/** Categories a recipe can be saved under. `value` is what's stored; `label` is what's shown. */
export const RECIPE_CATEGORY_OPTIONS = [
  { label: 'Appetizer', value: 'Appetizers' },
  { label: 'Breakfast', value: 'Breakfast' },
  { label: 'Entrée', value: 'Entree' },
  { label: 'Side', value: 'Side' },
  { label: 'Dessert', value: 'Dessert' },
  { label: 'Other', value: 'Other' },
] as const;

export const RECIPE_CATEGORY_VALUES = RECIPE_CATEGORY_OPTIONS.map((option) => option.value);

/** Display text for a stored category. Stored values stay as-is ("Entree"); only the label gets the accent. */
export function formatCategoryLabel(category: string): string {
  return /^entree$/i.test(category.trim()) ? 'Entrée' : category;
}

export const CUISINE_OPTIONS = [
  'American',
  'Asian',
  'European',
  'Mediterranean',
  'Mexican',
  'Latin American',
  'Middle Eastern',
  'Indian',
  'African',
] as const;

/** "15", "15 min", "15 minutes", "1 hr 20 min" → minutes. Anything else (ranges, words) → null. */
export function parseMinutes(text: string | null | undefined): number | null {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  // Ranges like "20-25 minutes" or vague text would lose meaning as a single number.
  if (/\d\s*(-|–|to)\s*\d/i.test(trimmed)) return null;
  if (!/^[\d\s.]*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b[\s\d.a-z]*$/i.test(trimmed)) return null;
  const minutes = parseRecipeTimeMinutes(trimmed);
  return minutes !== null && Number.isInteger(minutes) && minutes > 0 ? minutes : null;
}

export function formatMinutes(minutes: number): string {
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/** "4", "Serves 4", "4 servings" → 4. Ranges and other text → null. */
export function parseServings(text: string | null | undefined): number | null {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(?:serves\s+)?(\d+)(?:\s+(?:servings?|people|portions?))?$/i);
  return match ? Number(match[1]) : null;
}

const MINUTE_UNIT = '(?:m|min|mins|minute|minutes)?\\.?';
const BOX_PATTERN = new RegExp(`^(\\d+)(?:\\s*(?:-|–|to)\\s*(\\d*))?\\s*${MINUTE_UNIT}$`, 'i');

/**
 * What the prep/cook minutes box shows for a stored value: "15", "20–25", or "" when empty.
 * Returns null when the box can't represent it ("1 hr 20 min", "overnight") so a text box is used instead.
 */
export function minutesBoxValue(text: string | null | undefined): string | null {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(BOX_PATTERN);
  if (match) return match[2] !== undefined ? `${match[1]}–${match[2]}` : match[1];
  return null;
}

/** Turns what was typed in the minutes box ("20-25", "15") into the stored value ("20–25 minutes"). */
export function minutesFromBox(typed: string): string {
  const cleaned = typed.replace(/[^\d\-–]/g, '').replace(/-/g, '–');
  const [first = '', ...rest] = cleaned.split('–');
  const second = rest.join('');
  if (!first) return '';
  if (!cleaned.includes('–')) return formatMinutes(Number(first));
  if (!second) return `${first}–`; // still typing the second number
  return `${first}–${second} minutes`;
}

/** Drops a half-typed range ("20–") before saving. */
export function cleanTimeValue(value: string): string {
  const trimmed = value.trim();
  const dangling = trimmed.match(/^(\d+)\s*[-–]$/);
  return dangling ? formatMinutes(Number(dangling[1])) : value;
}
