import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const vaultRoot = path.join(projectRoot, 'Cooking');
const outputPath = path.join(projectRoot, 'data', 'obsidian-recipes.ts');

const excludedDirNames = new Set(['.obsidian', 'Resources', 'Templates']);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripMarkdown(value) {
  return value
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSectionTitle(value) {
  return stripMarkdown(value)
    .replace(/:+$/, '')
    .replace(/^[^A-Za-z0-9]+/, '')
    .trim();
}

function isIngredientHeading(line) {
  return /ingredients/i.test(stripMarkdown(line));
}

function isDirectionHeading(line) {
  return /(directions|instructions)/i.test(stripMarkdown(line));
}

function isHeading(line) {
  return /^\s*#{1,6}\s+/.test(line);
}

function headingText(line) {
  return cleanSectionTitle(line.replace(/^\s*#{1,6}\s+/, ''));
}

function normalizeItem(line) {
  return stripMarkdown(
    line
      .replace(/^\s*[-*+]\s+/, '')
      .replace(/^\s*\d+[.)]\s+/, '')
  );
}

function appendToLastSection(sections, line) {
  const item = normalizeItem(line);

  if (!item) {
    return;
  }

  if (sections.length === 0) {
    sections.push({ title: null, items: [] });
  }

  sections[sections.length - 1].items.push(item);
}

function appendToLastDirection(sections, line) {
  const item = normalizeItem(line);

  if (!item) {
    return;
  }

  if (sections.length === 0) {
    sections.push({ title: null, items: [] });
  }

  const currentSection = sections[sections.length - 1];
  const hasListItem = currentSection.items.length > 0;

  if (!hasListItem) {
    currentSection.items.push(item);
    return;
  }

  const lastIndex = currentSection.items.length - 1;
  currentSection.items[lastIndex] = `${currentSection.items[lastIndex]} ${item}`.trim();
}

function extractMetadata(content) {
  const lines = content.split(/\r?\n/);
  let prepTime = null;
  let cookTime = null;
  let totalTime = null;
  let servings = null;

  for (const line of lines) {
    const cleaned = stripMarkdown(line);

    if (!prepTime) {
      const prepMatch = cleaned.match(/^prep time\s*:\s*(.+)$/i);
      if (prepMatch) {
        prepTime = prepMatch[1];
      }
    }

    if (!cookTime) {
      const cookMatch = cleaned.match(/^cook time\s*:\s*(.+)$/i);
      if (cookMatch) {
        cookTime = cookMatch[1];
      }
    }

    if (!totalTime) {
      const totalMatch = cleaned.match(/^(total time|time)\s*:\s*(.+)$/i);
      if (totalMatch) {
        totalTime = totalMatch[2];
      }
    }

    if (!servings) {
      const servingsMatch = cleaned.match(/^(servings?|serves|yield)\s*:\s*(.+)$/i);
      if (servingsMatch) {
        servings = `${servingsMatch[1]}: ${servingsMatch[2]}`;
      }
    }
  }

  return { prepTime, cookTime, totalTime, servings };
}

function extractTimePhrase(text) {
  const match = text.match(
    /\b\d+(?:\s*[–-]\s*\d+)?\s*(?:minutes?|mins?|hours?|hrs?)\b/i
  );

  return match ? match[0].replace(/\s+/g, ' ').trim() : null;
}

function extractDurationWeight(phrase) {
  const normalized = phrase.replace(/[–—]/g, '-');
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);

  if (rangeMatch) {
    return Number(rangeMatch[2]);
  }

  const singleMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  return singleMatch ? Number(singleMatch[1]) : 0;
}

function extractTimesFromRecipe(parsedRecipe) {
  const candidates = [];

  const keywordRules = [
    { pattern: /\b(bake|baked|roast|roasted|broil|broiled)\b/i, score: 4 },
    { pattern: /\b(grill|grilled)\b/i, score: 3 },
    { pattern: /\b(simmer|boil|boiled)\b/i, score: 2 },
    { pattern: /\b(cook|cooked|saute|sauteed|sauté|sautéed|fry|fried)\b/i, score: 1 },
  ];

  function inspectText(text) {
    const phrase = extractTimePhrase(text);

    if (!phrase) {
      return;
    }

    const matchingRule = keywordRules.find((rule) => rule.pattern.test(text));

    if (!matchingRule) {
      return;
    }

    candidates.push({
      phrase,
      score: matchingRule.score,
      weight: extractDurationWeight(phrase),
    });
  }

  for (const group of [parsedRecipe.directions, parsedRecipe.ingredients]) {
    for (const section of group) {
      if (section.title) {
        inspectText(section.title);
      }

      for (const item of section.items) {
        inspectText(item);
      }
    }
  }

  candidates.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return b.weight - a.weight;
  });

  return { inferredCookTime: candidates[0]?.phrase ?? null };
}

function collectRecipeText(title, content, parsedRecipe) {
  const parts = [title, content];

  for (const group of [parsedRecipe.ingredients, parsedRecipe.directions]) {
    for (const section of group) {
      if (section.title) {
        parts.push(section.title);
      }

      parts.push(...section.items);
    }
  }

  return parts.join('\n').toLowerCase();
}

function extractAllergyTags(title, content, parsedRecipe) {
  const text = collectRecipeText(title, content, parsedRecipe);
  const allergyFriendlyTags = [];
  const allergenTags = [];

  const freeFromRules = [
    { label: 'Dairy Free', pattern: /\b(dairy[- ]free|cow'?s milk free|milk[- ]free)\b/i },
    { label: 'Egg Free', pattern: /\b(egg[- ]free)\b/i },
    { label: 'Gluten Free', pattern: /\b(gluten[- ]free)\b/i },
    { label: 'Wheat Free', pattern: /\b(wheat[- ]free)\b/i },
    { label: 'Nut Free', pattern: /\b(nut[- ]free)\b/i },
    { label: 'Soy Free', pattern: /\b(soy[- ]free)\b/i },
  ];

  for (const rule of freeFromRules) {
    if (rule.pattern.test(text)) {
      allergyFriendlyTags.push(rule.label);
    }
  }

  const hasFriendly = (tag) => allergyFriendlyTags.includes(tag);

  const allergenRules = [
    {
      label: 'Contains Dairy',
      suppressedBy: ['Dairy Free'],
      pattern:
        /\b(butter|milk|cream cheese|cream\b|cheddar|jack cheese|cheese\b|feta|parmesan|pecorino|yogurt|sour cream|buttermilk|custard)\b/i,
    },
    {
      label: 'Contains Eggs',
      suppressedBy: ['Egg Free'],
      pattern: /\b(egg|eggs|mayo|mayonnaise)\b/i,
    },
    {
      label: 'Contains Gluten',
      suppressedBy: ['Gluten Free', 'Wheat Free'],
      pattern:
        /\b(all-purpose flour|flour\b|bread\b|pretzels|phyllo|baguette|crusty bread|breadcrumbs?|muffin|cookie|pasta|soy sauce)\b/i,
    },
    {
      label: 'Contains Nuts',
      suppressedBy: ['Nut Free'],
      pattern: /\b(peanut|almond|walnut|pecan|cashew|pistachio|hazelnut|nuts?\b)\b/i,
    },
    {
      label: 'Contains Soy',
      suppressedBy: ['Soy Free'],
      pattern: /\b(soy sauce|soy milk|tofu|edamame|soy\b)\b/i,
    },
  ];

  for (const rule of allergenRules) {
    if (rule.suppressedBy.some((tag) => hasFriendly(tag))) {
      continue;
    }

    if (rule.pattern.test(text)) {
      allergenTags.push(rule.label);
    }
  }

  return { allergyFriendlyTags, allergenTags };
}

function parseRecipe(content) {
  const lines = content.split(/\r?\n/);
  const ingredients = [];
  const directions = [];
  let mode = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const cleaned = stripMarkdown(line);

    if (!cleaned || cleaned === '---') {
      continue;
    }

    if (isHeading(line)) {
      const text = headingText(line);

      if (isIngredientHeading(text)) {
        mode = 'ingredients';
        ingredients.push({ title: null, items: [] });
        continue;
      }

      if (isDirectionHeading(text)) {
        mode = 'directions';
        directions.push({ title: null, items: [] });
        continue;
      }

      if (mode === 'ingredients') {
        ingredients.push({ title: text, items: [] });
        continue;
      }

      if (mode === 'directions') {
        directions.push({ title: text, items: [] });
        continue;
      }
    }

    if (!mode) {
      if (isIngredientHeading(line)) {
        mode = 'ingredients';
        ingredients.push({ title: null, items: [] });
        continue;
      }

      if (isDirectionHeading(line)) {
        mode = 'directions';
        directions.push({ title: null, items: [] });
        continue;
      }
    }

    if (mode === 'ingredients') {
      if (isDirectionHeading(cleaned)) {
        mode = 'directions';
        directions.push({ title: null, items: [] });
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        appendToLastSection(ingredients, line);
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(line)) {
        appendToLastSection(ingredients, line);
        continue;
      }

      if (!/^(original recipe|submitted by|add photo)/i.test(cleaned)) {
        ingredients.push({ title: cleanSectionTitle(cleaned), items: [] });
      }
      continue;
    }

    if (mode === 'directions') {
      if (isIngredientHeading(cleaned)) {
        mode = 'ingredients';
        ingredients.push({ title: null, items: [] });
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(line)) {
        appendToLastSection(directions, line);
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        appendToLastDirection(directions, line);
        continue;
      }

      appendToLastDirection(directions, line);
    }
  }

  const normalizedIngredients = ingredients.filter(
    (section) => section.title || section.items.length > 0
  );
  const normalizedDirections = directions.filter(
    (section) => section.title || section.items.length > 0
  );

  return {
    ingredients: normalizedIngredients,
    directions: normalizedDirections,
  };
}

function walkRecipes(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (excludedDirNames.has(entry.name)) {
        continue;
      }

      files.push(...walkRecipes(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

const markdownFiles = walkRecipes(vaultRoot);

const recipes = markdownFiles
  .map((filePath) => {
    const relativePath = path.relative(vaultRoot, filePath).replace(/\\/g, '/');
    const category = relativePath.split('/')[0] ?? 'Uncategorized';
    const title = path.basename(filePath, '.md');
    const content = fs.readFileSync(filePath, 'utf8');
    const metadata = extractMetadata(content);
    const parsed = parseRecipe(content);
    const inferredTimes = extractTimesFromRecipe(parsed);
    const allergyTags = extractAllergyTags(title, content, parsed);

    return {
      slug: slugify(title),
      title,
      category,
      source: `Cooking/${relativePath.replace(/\.md$/, '')}`,
      prepTime: metadata.prepTime,
      cookTime: metadata.cookTime ?? inferredTimes.inferredCookTime,
      totalTime: metadata.totalTime,
      servings: metadata.servings,
      allergyFriendlyTags: allergyTags.allergyFriendlyTags,
      allergenTags: allergyTags.allergenTags,
      ...parsed,
    };
  })
  .sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }

    return a.title.localeCompare(b.title);
  });

const fileContents = `export type RecipeSection = {
  title: string | null;
  items: string[];
};

export type ObsidianRecipe = {
  slug: string;
  title: string;
  category: string;
  source: string;
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  allergyFriendlyTags: string[];
  allergenTags: string[];
  ingredients: RecipeSection[];
  directions: RecipeSection[];
};

export const obsidianRecipes: ObsidianRecipe[] = ${JSON.stringify(recipes, null, 2)} as ObsidianRecipe[];

export const obsidianRecipeMap = Object.fromEntries(
  obsidianRecipes.map((recipe) => [recipe.slug, recipe])
) as Record<string, ObsidianRecipe>;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileContents);

console.log(`Generated ${recipes.length} recipes into ${path.relative(projectRoot, outputPath)}`);
