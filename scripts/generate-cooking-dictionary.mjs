import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, 'Cooking', 'Resources', 'Cooking Dictionary.md');
const outputPath = path.join(projectRoot, 'data', 'cooking-dictionary.ts');

function stripMarkdown(value) {
  return value
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function cleanBlock(lines) {
  return lines
    .map((line) => line.replace(/\u00a0/g, ' ').trim())
    .filter((line) => line && line !== '–' && line !== '&nbsp;')
    .filter((line) => !/^###\s+Sign Up for our Newsletter/i.test(line))
    .filter((line) => !/^###\s+Seasonal Recipes/i.test(line))
    .filter((line) => !/^###\s+Newest Recipes/i.test(line))
    .filter((line) => !/^###\s+Most Viewed Recipes/i.test(line))
    .filter((line) => !/^Search for:/i.test(line))
    .filter((line) => !/^America's most trusted culinary resource/i.test(line))
    .filter((line) => !/^Home$/i.test(line))
    .filter((line) => !/^Recipe Indexes$/i.test(line))
    .filter((line) => !/^Food History$/i.test(line))
    .filter((line) => !/^Cooking Articles$/i.test(line))
    .filter((line) => !/^Culinary Dictionary Index$/i.test(line))
    .filter((line) => !/^Pin\d*$/i.test(line))
    .filter((line) => !/^Share$/i.test(line))
    .filter((line) => !/^Tweet$/i.test(line))
    .filter((line) => !/^Yum\d*$/i.test(line))
    .filter((line) => !/^Email$/i.test(line))
    .filter((line) => !/^Top$/i.test(line))
    .filter((line) => !/^What's Cooking America/i.test(line))
    .map((line) => stripMarkdown(line))
    .filter(Boolean);
}

function parseEntries(markdown) {
  const lines = markdown.split(/\r?\n/);
  const entries = [];
  let active = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (/^###\s+Sign Up for our Newsletter/i.test(line)) {
      break;
    }

    const termMatch = line.match(/^\*\*([^*]+)\*\*$/);
    if (termMatch) {
      if (active) {
        entries.push(active);
      }

      active = {
        term: stripMarkdown(termMatch[1]),
        lines: [],
      };
      continue;
    }

    if (active) {
      active.lines.push(rawLine);
    }
  }

  if (active) {
    entries.push(active);
  }

  return entries
    .map((entry) => {
      const cleanedLines = cleanBlock(entry.lines);
      const definition = cleanedLines.join('\n');
      const firstLetter = /^[a-z]/i.test(entry.term) ? entry.term[0].toUpperCase() : '#';

      return {
        term: entry.term,
        letter: firstLetter,
        definition,
      };
    })
    .filter((entry) => entry.definition.length > 0)
    .filter(
      (entry) =>
        !(
          entry.term ===
            'An outstanding and large culinary dictionary and glossary that includes the definitions and history of cooking, food, and beverage terms.' ||
          /Please click on a letter below to alphabetically search/i.test(entry.definition)
        )
    );
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
