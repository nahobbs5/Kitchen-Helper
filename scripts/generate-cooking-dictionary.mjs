import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, 'Cooking', 'Resources', 'New Custom Cooking Dictionary.md');
const outputPath = path.join(projectRoot, 'data', 'cooking-dictionary.ts');

function stripMarkdown(value) {
  return value
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function normalizeForSorting(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseEntries(markdown) {
  const lines = markdown.split(/\r?\n/);
  const entries = [];
  let activeLetter = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line === '---') {
      continue;
    }

    const letterMatch = line.match(/^##\s+([A-Z])$/i) ?? line.match(/^\*\*([A-Z])\*\*$/i);
    const entryMatch = line.match(/^-?\s*\*\*([^*]+)\*\*(?:\s+_\(([^)]+)\)_)?\s+—\s+(.+)$/);

    if (letterMatch) {
      activeLetter = letterMatch[1].toUpperCase();
      continue;
    }

    if (entryMatch) {
      const term = stripMarkdown(entryMatch[1]).trim();
      const typePrefix = entryMatch[2] ? `${stripMarkdown(entryMatch[2])}: ` : '';
      const definition = `${typePrefix}${stripMarkdown(entryMatch[3])}`.trim();
      const normalizedTerm = normalizeForSorting(term);
      const letter = activeLetter ?? (/^[a-z]/i.test(normalizedTerm) ? normalizedTerm[0].toUpperCase() : '#');

      entries.push({ term, letter, definition });
      continue;
    }
  }

  return entries
    .filter((entry) => entry.term && entry.definition)
    .sort((left, right) => {
      const letterCompare = left.letter.localeCompare(right.letter);
      if (letterCompare !== 0) return letterCompare;
      return normalizeForSorting(left.term).localeCompare(normalizeForSorting(right.term), undefined, {
        sensitivity: 'base',
      });
    });
}

function parseBreadEntries(markdown) {
  const lines = markdown.split(/\r?\n/);
  const entries = [];
  let currentEntry = null;

  function finishCurrentEntry() {
    if (!currentEntry?.term) {
      return;
    }

    const metadata = [
      currentEntry.origin ? `Origin: ${currentEntry.origin}.` : null,
      currentEntry.type ? `Type: ${currentEntry.type}.` : null,
    ].filter(Boolean);
    const definition = [...metadata, currentEntry.description.join(' ')].filter(Boolean).join(' ');
    const normalizedTerm = normalizeForSorting(currentEntry.term);
    const letter = /^[a-z]/i.test(normalizedTerm) ? normalizedTerm[0].toUpperCase() : '#';

    entries.push({
      term: currentEntry.term,
      letter,
      definition: stripMarkdown(definition),
    });
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line === '---') {
      continue;
    }

    const headingMatch = line.match(/^##\s+(.+)$/);
    const originMatch = line.match(/^\*\*Origin:\*\*\s+(.+)$/);
    const typeMatch = line.match(/^\*\*Type:\*\*\s+(.+)$/);

    if (headingMatch) {
      finishCurrentEntry();
      currentEntry = {
        term: stripMarkdown(headingMatch[1]).trim(),
        origin: '',
        type: '',
        description: [],
      };
      continue;
    }

    if (!currentEntry) {
      continue;
    }

    if (originMatch) {
      currentEntry.origin = stripMarkdown(originMatch[1]);
      continue;
    }

    if (typeMatch) {
      currentEntry.type = stripMarkdown(typeMatch[1]);
      continue;
    }

    currentEntry.description.push(stripMarkdown(line));
  }

  finishCurrentEntry();

  return entries
    .filter((entry) => entry.term && entry.definition)
    .sort((left, right) => {
      const letterCompare = left.letter.localeCompare(right.letter);
      if (letterCompare !== 0) return letterCompare;
      return normalizeForSorting(left.term).localeCompare(normalizeForSorting(right.term), undefined, {
        sensitivity: 'base',
      });
    });
}

function splitIntoSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = { general: [], spices: [], oils: [], cheeses: [], alcohol: [], instruments: [], breads: [] };
  let currentSection = 'general';

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (/^##\s+Oils$/i.test(line)) {
      currentSection = 'oils';
      continue;
    }

    if (/^##\s+Cheeses?$/i.test(line)) {
      currentSection = 'cheeses';
      continue;
    }

    // Single # headings mark section boundaries — detect and switch, don't pass through
    if (/^#\s+/.test(line) && !/^##/.test(line)) {
      if (/spic/i.test(line)) {
        currentSection = 'spices';
      } else if (/alcohol/i.test(line)) {
        currentSection = 'alcohol';
      } else if (/instrument/i.test(line)) {
        currentSection = 'instruments';
      } else if (/bread/i.test(line)) {
        currentSection = 'breads';
      }
      continue;
    }

    sections[currentSection].push(rawLine);
  }

  return sections;
}

async function main() {
  const markdown = await fs.readFile(sourcePath, 'utf8');
  const sections = splitIntoSections(markdown);

  const generalEntries = parseEntries(sections.general.join('\n'));
  const spicesEntries = parseEntries(sections.spices.join('\n'));
  const oilsEntries = parseEntries(sections.oils.join('\n'));
  const cheesesEntries = parseEntries(sections.cheeses.join('\n'));
  const alcoholEntries = parseEntries(sections.alcohol.join('\n'));
  const instrumentsEntries = parseEntries(sections.instruments.join('\n'));
  const breadsEntries = parseBreadEntries(sections.breads.join('\n'));

  const allEntries = [
    ...generalEntries,
    ...spicesEntries,
    ...oilsEntries,
    ...cheesesEntries,
    ...alcoholEntries,
    ...instrumentsEntries,
    ...breadsEntries,
  ].sort((left, right) => {
    const letterCompare = left.letter.localeCompare(right.letter);
    if (letterCompare !== 0) return letterCompare;
    return normalizeForSorting(left.term).localeCompare(normalizeForSorting(right.term), undefined, {
      sensitivity: 'base',
    });
  });

  const fileContents = `export type DictionaryEntry = {
  term: string;
  letter: string;
  definition: string;
};

export const generalDictionaryEntries: DictionaryEntry[] = ${JSON.stringify(generalEntries, null, 2)};

export const spicesDictionaryEntries: DictionaryEntry[] = ${JSON.stringify(spicesEntries, null, 2)};

export const oilsDictionaryEntries: DictionaryEntry[] = ${JSON.stringify(oilsEntries, null, 2)};

export const cheesesDictionaryEntries: DictionaryEntry[] = ${JSON.stringify(cheesesEntries, null, 2)};

export const alcoholDictionaryEntries: DictionaryEntry[] = ${JSON.stringify(alcoholEntries, null, 2)};

export const instrumentsDictionaryEntries: DictionaryEntry[] = ${JSON.stringify(instrumentsEntries, null, 2)};

export const breadsDictionaryEntries: DictionaryEntry[] = ${JSON.stringify(breadsEntries, null, 2)};

export const cookingDictionaryEntries: DictionaryEntry[] = ${JSON.stringify(allEntries, null, 2)};\n`;

  await fs.writeFile(outputPath, fileContents, 'utf8');
  console.log(`Generated entries -> ${path.relative(projectRoot, outputPath)}`);
  console.log(`  General:     ${generalEntries.length}`);
  console.log(`  Spices:      ${spicesEntries.length}`);
  console.log(`  Oils:        ${oilsEntries.length}`);
  console.log(`  Cheeses:     ${cheesesEntries.length}`);
  console.log(`  Alcohol:     ${alcoholEntries.length}`);
  console.log(`  Instruments: ${instrumentsEntries.length}`);
  console.log(`  Breads:      ${breadsEntries.length}`);
  console.log(`  All:         ${allEntries.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
