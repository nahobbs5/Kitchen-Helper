import type { RecipeSection } from '../data/obsidian-recipes';
import { splitDirectionsText } from './scaled-directions';

type ParseRecipeSectionsOptions = {
  ordered?: boolean;
};

type FormatRecipeSectionsOptions = {
  ordered?: boolean;
};

const markdownHeadingPattern = /^\s*#{2,6}\s+(.+?)\s*#*\s*$/;
const bracketHeadingPattern = /^\s*\[([^\]]+)]\s*$/;

function cleanSectionTitle(value: string) {
  return value
    .replace(/[*_`>#]/g, '')
    .replace(/:+$/, '')
    .trim();
}

function getSectionTitle(line: string) {
  const markdownMatch = markdownHeadingPattern.exec(line);
  if (markdownMatch) {
    return cleanSectionTitle(markdownMatch[1]);
  }

  const bracketMatch = bracketHeadingPattern.exec(line);
  if (bracketMatch) {
    return cleanSectionTitle(bracketMatch[1]);
  }

  return null;
}

function normalizeRecipeItem(line: string) {
  return line.replace(/^\s*[-*+]\s+/, '').trim();
}

export function normalizeRecipeSections(sections: RecipeSection[]) {
  return sections
    .map((section) => ({
      title: section.title?.trim() ? section.title.trim() : null,
      items: section.items.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((section) => section.title || section.items.length > 0);
}

export function parseRecipeSectionsText(text: string, options: ParseRecipeSectionsOptions = {}) {
  const sections: RecipeSection[] = [];

  function ensureSection() {
    if (sections.length === 0) {
      sections.push({ title: null, items: [] });
    }

    return sections[sections.length - 1];
  }

  text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        return;
      }

      const title = getSectionTitle(line);
      if (title) {
        sections.push({ title, items: [] });
        return;
      }

      const normalizedItem = normalizeRecipeItem(line);
      const items = options.ordered ? splitDirectionsText(normalizedItem) : [normalizedItem];
      const section = ensureSection();
      section.items.push(...items);
    });

  return normalizeRecipeSections(sections);
}

export function formatRecipeSections(sections: RecipeSection[], options: FormatRecipeSectionsOptions = {}) {
  let stepNumber = 0;

  return normalizeRecipeSections(sections)
    .map((section) => {
      const lines = section.title ? [`## ${section.title}`] : [];

      for (const item of section.items) {
        if (options.ordered) {
          stepNumber += 1;
          lines.push(`${stepNumber}. ${item}`);
        } else {
          lines.push(item);
        }
      }

      return lines.join('\n');
    })
    .filter(Boolean)
    .join('\n\n');
}

export function recipeSectionsHaveItems(sections: RecipeSection[]) {
  return normalizeRecipeSections(sections).some((section) => section.items.length > 0);
}

export function countRecipeSectionItems(sections: RecipeSection[]) {
  return normalizeRecipeSections(sections).reduce((total, section) => total + section.items.length, 0);
}
