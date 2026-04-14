import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = path.join(root, 'README.md');
const knowledgeBasePath = path.join(root, 'docs', 'knowledge-base.md');
const packageJsonPath = path.join(root, 'package.json');

const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output');
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function fileContains(relativePath, text) {
  if (!fileExists(relativePath)) {
    return false;
  }

  return readText(path.join(root, relativePath)).toLowerCase().includes(text.toLowerCase());
}

function hasAny(text, tokens) {
  const normalized = text.toLowerCase();
  return tokens.some((token) => normalized.includes(token.toLowerCase()));
}

function toBulletList(items) {
  if (items.length === 0) {
    return '- None\n';
  }

  return `${items.map((item) => `- ${item}`).join('\n')}\n`;
}

function formatProposals(title, items) {
  if (items.length === 0) {
    return `## ${title}\n\n- No high-confidence changes needed.\n`;
  }

  const body = items
    .map(
      (item) => [
        `### ${item.label}`,
        `- Detected in: ${item.detectedIn.join(', ')}`,
        `- Target section: ${item.targetSection}`,
        `- Suggested wording: ${item.suggestedWording}`,
      ].join('\n')
    )
    .join('\n\n');

  return `## ${title}\n\n${body}\n`;
}

function collectMissingPaths(docText) {
  const repoPrefixes = [
    'app/',
    'components/',
    'contexts/',
    'data/',
    'docs/',
    'scripts/',
    'utils/',
    'types/',
    'assets/',
    'Cooking/',
    'README.md',
    'package.json',
    'app.json',
    'CLAUDE.md',
  ];
  const looksLikeRepoPath = (value) =>
    repoPrefixes.some((prefix) => value.startsWith(prefix)) || /\.(md|mjs|json|ts|tsx|js|jsx|pdf|png|jpg|wav)$/i.test(value);

  const inlineCodeReferences = [...docText.matchAll(/`([^`\n]+)`/g)]
    .map((match) => match[1].trim())
    .filter((value) => /[\\/]/.test(value))
    .filter((value) => !/\s/.test(value))
    .filter((value) => !value.startsWith('http'))
    .filter((value) => !value.startsWith('/'))
    .filter((value) => !value.startsWith('@'))
    .filter(looksLikeRepoPath);

  const linkReferences = [...docText.matchAll(/\]\(([^)\n]+)\)/g)]
    .map((match) => match[1].trim())
    .filter((value) => !value.startsWith('http'))
    .filter((value) => !value.startsWith('/'))
    .filter(looksLikeRepoPath);

  const uniquePaths = [...new Set([...inlineCodeReferences, ...linkReferences])];

  return uniquePaths
    .filter((relativePath) => !fileExists(relativePath.replace(/^\.\//, '')))
    .map((relativePath) => `Missing path reference: \`${relativePath}\``);
}

const readme = readText(readmePath);
const knowledgeBase = readText(knowledgeBasePath);
const packageJson = JSON.parse(readText(packageJsonPath));

const reviewTargets = [
  {
    key: 'recipe-creation-editing',
    label: 'Recipe creation and editing flow',
    detectedIn: ['app/add-recipe.tsx', 'app/edit-recipe/[slug].tsx', 'contexts/custom-recipes-context.tsx'],
    detect: () =>
      fileExists('app/add-recipe.tsx') &&
      fileExists('app/edit-recipe/[slug].tsx') &&
      fileExists('contexts/custom-recipes-context.tsx'),
    readmeTokens: ['adding recipes directly in the app', 'editing any recipe in the ui'],
    knowledgeTokens: ['recipe creation in app storage', 'recipe editing for both app-created and imported recipes'],
    readmeSection: 'Recipe Management',
    knowledgeSection: 'What The App Does Right Now',
    suggestedWording:
      'The app supports creating recipes in local app storage and editing both app-created and imported recipes through the same UI, with imported recipes saved as local overrides instead of modifying the original Markdown files.',
  },
  {
    key: 'website-import',
    label: 'Website import with source attribution',
    detectedIn: ['app/add-recipe.tsx', 'utils/web-recipe-import.ts', 'contexts/custom-recipes-context.tsx'],
    detect: () => fileExists('utils/web-recipe-import.ts') && fileContains('app/add-recipe.tsx', 'website'),
    readmeTokens: ['website-based recipe import', 'source attribution'],
    knowledgeTokens: ['website-based recipe import with source attribution'],
    readmeSection: 'Recipe Management',
    knowledgeSection: 'Project Goal',
    suggestedWording:
      'Website import can prefill the add-recipe form from a URL and preserves source attribution separately from recipe notes by storing website name, author, and source URL metadata.',
  },
  {
    key: 'photo-ocr-import',
    label: 'Photo OCR import',
    detectedIn: ['app/add-recipe.tsx', 'utils/ocr-recipe-parser.ts', 'package.json'],
    detect: () =>
      fileExists('utils/ocr-recipe-parser.ts') &&
      Boolean(packageJson.dependencies?.['expo-image-picker']) &&
      Boolean(packageJson.dependencies?.['@infinitered/react-native-mlkit-text-recognition']),
    readmeTokens: ['photo-based recipe import', 'local ocr-assisted prefill'],
    knowledgeTokens: ['photo-based recipe import with local ocr-assisted prefill'],
    readmeSection: 'Recipe Management',
    knowledgeSection: 'Project Goal',
    suggestedWording:
      'Photo import uses local OCR-assisted prefill to pull recipe text from an image into the manual entry form, keeping the final review and save step inside the existing recipe workflow.',
  },
  {
    key: 'scaled-directions',
    label: 'Scaled directions with per-step overrides',
    detectedIn: ['utils/scaled-directions.ts', 'components/scaled-directions-list.tsx', 'contexts/custom-recipes-context.tsx'],
    detect: () => fileExists('utils/scaled-directions.ts') && fileExists('components/scaled-directions-list.tsx'),
    readmeTokens: ['scaled directions with per-step warnings', 'local step edits'],
    knowledgeTokens: ['scaled directions with per-step annotations'],
    readmeSection: 'Recipe Management',
    knowledgeSection: 'Data Generation and Utilities',
    suggestedWording:
      'Scaled directions keep the original step text, annotate scale-sensitive cues such as timing and vessel size, and allow step-level local overrides without rewriting the underlying recipe instructions globally.',
  },
  {
    key: 'pdf-export',
    label: 'PDF export',
    detectedIn: ['components/settings-menu.tsx', 'utils/export-recipes.ts', 'package.json'],
    detect: () =>
      fileExists('utils/export-recipes.ts') &&
      Boolean(packageJson.dependencies?.['expo-print']) &&
      Boolean(packageJson.dependencies?.['expo-sharing']),
    readmeTokens: ['pdf export action', 'export all recipes to pdf'],
    knowledgeTokens: ['full-library pdf export', 'export builds a single cookbook-style pdf'],
    readmeSection: 'Settings',
    knowledgeSection: 'Settings / Shared State',
    suggestedWording:
      'Settings includes a manual export action that generates a single cookbook-style PDF from the merged recipe library, using local overrides as the effective source of truth for exported content.',
  },
  {
    key: 'cook-timer',
    label: 'Shared cook timer',
    detectedIn: ['components/cook-timer-modal.tsx', 'contexts/cook-timer-context.tsx'],
    detect: () => fileExists('components/cook-timer-modal.tsx') && fileExists('contexts/cook-timer-context.tsx'),
    readmeTokens: ['shared cook timer popup', 'up to three timers'],
    knowledgeTokens: ['shared cook-timer popup and timer state'],
    readmeSection: 'Current Status',
    knowledgeSection: 'Shared State',
    suggestedWording:
      'The cook timer is a shared popup available across recipe and reference pages, with up to three named timers, progress bars, and completion audio/alert behavior managed through app-wide state.',
  },
  {
    key: 'bulk-management',
    label: 'Bulk recipe management',
    detectedIn: ['app/my-recipes.tsx', 'contexts/custom-recipes-context.tsx', 'contexts/favorites-context.tsx'],
    detect: () => fileContains('app/my-recipes.tsx', 'bulkUpdateRecipeMetadata') && fileContains('app/my-recipes.tsx', 'Select All'),
    readmeTokens: ['bulk recipe selection', 'bulk metadata editing', 'bulk delete'],
    knowledgeTokens: ['bulk recipe management'],
    readmeSection: 'Current Status',
    knowledgeSection: 'What The App Does Right Now',
    suggestedWording:
      'My Recipes supports bulk selection with checkboxes, desktop shift-click range selection, bulk favorites, bulk metadata updates, and bulk delete, while still respecting local-only behavior for imported recipe hiding.',
  },
  {
    key: 'documentation-review',
    label: 'Documentation review workflow',
    detectedIn: ['scripts/review-documentation.mjs', 'package.json'],
    detect: () => fileExists('scripts/review-documentation.mjs') && Boolean(packageJson.scripts?.['review:docs']),
    readmeTokens: ['review:docs', 'documentation review'],
    knowledgeTokens: ['review:docs', 'documentation review workflow'],
    readmeSection: 'Scripts',
    knowledgeSection: 'Workflow',
    suggestedWording:
      'Use `corepack pnpm run review:docs` to generate a draft-only documentation delta report by inspecting the repo first, then comparing the detected app state against the README and knowledge base without editing either file.',
  },
];

const readmeUpdates = [];
const knowledgeUpdates = [];
const newSinceLastDocsUpdate = [];

for (const target of reviewTargets) {
  if (!target.detect()) {
    continue;
  }

  const missingReadme = !hasAny(readme, target.readmeTokens);
  const missingKnowledge = !hasAny(knowledgeBase, target.knowledgeTokens);

  if (missingReadme || missingKnowledge) {
    newSinceLastDocsUpdate.push(`${target.label} (${target.detectedIn.join(', ')})`);
  }

  if (missingReadme) {
    readmeUpdates.push({
      label: target.label,
      detectedIn: target.detectedIn,
      targetSection: target.readmeSection,
      suggestedWording: target.suggestedWording,
    });
  }

  if (missingKnowledge) {
    knowledgeUpdates.push({
      label: target.label,
      detectedIn: target.detectedIn,
      targetSection: target.knowledgeSection,
      suggestedWording: target.suggestedWording,
    });
  }
}

const staleFindings = [];

for (const scriptName of Object.keys(packageJson.scripts ?? {})) {
  const presentInReadme = readme.includes(scriptName);
  const presentInKnowledge = knowledgeBase.includes(scriptName);

  if (!presentInReadme || !presentInKnowledge) {
    staleFindings.push(
      `Script coverage gap for \`${scriptName}\`: README=${presentInReadme ? 'present' : 'missing'}, knowledge base=${presentInKnowledge ? 'present' : 'missing'}`
    );
  }
}

staleFindings.push(...collectMissingPaths(readme).map((item) => `README: ${item}`));
staleFindings.push(...collectMissingPaths(knowledgeBase).map((item) => `Knowledge base: ${item}`));

const report = [
  '# Documentation Review Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## New since last docs update',
  '',
  toBulletList(newSinceLastDocsUpdate),
  formatProposals('README changes needed', readmeUpdates),
  formatProposals('Knowledge-base changes needed', knowledgeUpdates),
  '## Potential stale statements to remove',
  '',
  toBulletList(staleFindings),
  '## Confidence / manual review notes',
  '',
  '- This report is derived from repo inspection only. It does not use chat history as evidence.',
  '- Matching is heuristic. It is strong for file-based feature detection and weaker for wording-level stale statements.',
  '- The report is draft-only by design. It does not edit `README.md` or `docs/knowledge-base.md`.',
  '- If a feature is present but intentionally undocumented, leave it out rather than force the docs to mirror every implementation detail.',
  '',
].join('\n');

if (outputPath) {
  fs.writeFileSync(path.resolve(process.cwd(), outputPath), report);
} else {
  process.stdout.write(report);
}
