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

function cleanDefinition(lines) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s*/, ''))
    .map(stripMarkdown)
    .filter(Boolean)
    .join('\n');
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

    const letterMatch = line.match(/^##\s+([A-Z])$/i);
    const entryMatch = line.match(/^\*\*([^*]+)\*\*\s+—\s+(.+)$/);

    if (letterMatch) {
      activeLetter = letterMatch[1].toUpperCase();
      continue;
    }

    if (entryMatch) {
      const term = stripMarkdown(entryMatch[1]).trim();
      const definition = stripMarkdown(entryMatch[2]).trim();
      const normalizedTerm = normalizeForSorting(term);
      const letter = activeLetter ?? (/^[a-z]/i.test(normalizedTerm) ? normalizedTerm[0].toUpperCase() : '#');

      entries.push({
        term,
        letter,
        definition,
      });
      continue;
    }
  }

  return entries
    .filter((entry) => entry.term && entry.definition)
    .sort((left, right) => {
      const letterCompare = left.letter.localeCompare(right.letter);

      if (letterCompare !== 0) {
        return letterCompare;
      }

      return normalizeForSorting(left.term).localeCompare(normalizeForSorting(right.term), undefined, {
        sensitivity: 'base',
      });
    });
}

async function main() {
  const markdown = await fs.readFile(sourcePath, 'utf8');
  const entries = parseEntries(markdown);

  const fileContents = `export type DictionaryEntry = {
  term: string;
  letter: string;
  definition: string;
};

export const cookingDictionaryEntries: DictionaryEntry[] = ${JSON.stringify(entries, null, 2)};\n`;

  await fs.writeFile(outputPath, fileContents, 'utf8');
  console.log(`Generated ${entries.length} dictionary entries -> ${path.relative(projectRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
