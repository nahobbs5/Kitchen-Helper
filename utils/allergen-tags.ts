export const allergenTagOptions = [
  'Contains Dairy',
  'Contains Eggs',
  'Contains Gluten',
  'Contains Nuts',
  'Contains Soy',
] as const;

export const allergyFriendlyTagOptions = [
  'Dairy Free',
  'Egg Free',
  'Gluten Free',
  'Nut Free',
  'Soy Free',
  'Wheat Free',
] as const;

type InferenceInput = {
  title?: string | null;
  ingredientsText?: string | null;
  directionsText?: string | null;
  notes?: string | null;
};

const allergenMatchers: Record<(typeof allergenTagOptions)[number], RegExp[]> = {
  'Contains Dairy': [
    /\bmilk\b/i,
    /\bbutter\b/i,
    /\bcheese\b/i,
    /\bcream\b/i,
    /\byogurt\b/i,
    /\bbuttermilk\b/i,
    /\bfeta\b/i,
    /\bmozzarella\b/i,
    /\bparmesan\b/i,
    /\bcream cheese\b/i,
    /\bsour cream\b/i,
    /\bghee\b/i,
    /\bwhey\b/i,
  ],
  'Contains Eggs': [/\beggs?\b/i, /\bmayonnaise\b/i, /\bmayo\b/i],
  'Contains Gluten': [
    /\bflour\b/i,
    /\ball-purpose\b/i,
    /\bwheat\b/i,
    /\bbread\b/i,
    /\bbuns?\b/i,
    /\bpasta\b/i,
    /\bphyllo\b/i,
    /\bbreadcrumbs?\b/i,
  ],
  'Contains Nuts': [
    /\balmond\b/i,
    /\bpeanut\b/i,
    /\bpecan\b/i,
    /\bwalnut\b/i,
    /\bcashew\b/i,
    /\bhazelnut\b/i,
    /\bpistachio\b/i,
    /\bmacadamia\b/i,
    /\bnuts?\b/i,
  ],
  'Contains Soy': [/\bsoy\b/i, /\btofu\b/i, /\bedamame\b/i, /\bmiso\b/i, /\btempeh\b/i],
};

const friendlyMatchers: Record<(typeof allergyFriendlyTagOptions)[number], RegExp[]> = {
  'Dairy Free': [/\bdairy[- ]free\b/i, /\bnon[- ]dairy\b/i],
  'Egg Free': [/\begg[- ]free\b/i],
  'Gluten Free': [/\bgluten[- ]free\b/i],
  'Nut Free': [/\bnut[- ]free\b/i],
  'Soy Free': [/\bsoy[- ]free\b/i],
  'Wheat Free': [/\bwheat[- ]free\b/i],
};

const friendlyToAllergen: Partial<Record<(typeof allergyFriendlyTagOptions)[number], (typeof allergenTagOptions)[number]>> = {
  'Dairy Free': 'Contains Dairy',
  'Egg Free': 'Contains Eggs',
  'Gluten Free': 'Contains Gluten',
  'Nut Free': 'Contains Nuts',
  'Soy Free': 'Contains Soy',
};

const allergenToFriendly: Partial<Record<(typeof allergenTagOptions)[number], (typeof allergyFriendlyTagOptions)[number][]>> = {
  'Contains Dairy': ['Dairy Free'],
  'Contains Eggs': ['Egg Free'],
  'Contains Gluten': ['Gluten Free', 'Wheat Free'],
  'Contains Nuts': ['Nut Free'],
  'Contains Soy': ['Soy Free'],
};

export function inferRecipeTags(input: InferenceInput) {
  const { title, ingredientsText, directionsText, notes } = input;

  const nonIngredientText = [title, directionsText, notes].filter(Boolean).join('\n');

  const ingredientLines = ingredientsText?.split('\n') ?? [];
  const perLineAllergens = new Set<(typeof allergenTagOptions)[number]>();

  for (const line of ingredientLines) {
    for (const tag of allergenTagOptions) {
      if (!allergenMatchers[tag].some((m) => m.test(line))) continue;

      const suppressed = allergyFriendlyTagOptions.some(
        (ft) => friendlyToAllergen[ft] === tag && friendlyMatchers[ft].some((m) => m.test(line))
      );

      if (!suppressed) {
        perLineAllergens.add(tag);
      }
    }
  }

  const nonIngredientAllergens = allergenTagOptions.filter((tag) =>
    allergenMatchers[tag].some((m) => m.test(nonIngredientText))
  );

  const wholeText = [title, ingredientsText, directionsText, notes].filter(Boolean).join('\n');
  const allergyFriendlyTags = allergyFriendlyTagOptions.filter((tag) =>
    friendlyMatchers[tag].some((m) => m.test(wholeText))
  );

  const combinedAllergens = new Set([...perLineAllergens, ...nonIngredientAllergens]);
  const allergenTags = [...combinedAllergens].filter(
    (tag) => !allergyFriendlyTags.some((ft) => friendlyToAllergen[ft] === tag)
  );

  return { allergenTags, allergyFriendlyTags };
}

export function toggleAllergenSelection(
  allergenTags: string[],
  allergyFriendlyTags: string[],
  tag: (typeof allergenTagOptions)[number]
) {
  const isActive = allergenTags.includes(tag);

  return {
    allergenTags: isActive ? allergenTags.filter((value) => value !== tag) : [...allergenTags, tag],
    allergyFriendlyTags: isActive
      ? allergyFriendlyTags
      : allergyFriendlyTags.filter(
          (value) => !(allergenToFriendly[tag] ?? []).includes(value as (typeof allergyFriendlyTagOptions)[number])
        ),
  };
}

export function toggleFriendlySelection(
  allergenTags: string[],
  allergyFriendlyTags: string[],
  tag: (typeof allergyFriendlyTagOptions)[number]
) {
  const isActive = allergyFriendlyTags.includes(tag);
  const conflictingAllergen = friendlyToAllergen[tag];

  return {
    allergenTags:
      isActive || !conflictingAllergen
        ? allergenTags
        : allergenTags.filter((value) => value !== conflictingAllergen),
    allergyFriendlyTags: isActive
      ? allergyFriendlyTags.filter((value) => value !== tag)
      : [...allergyFriendlyTags, tag],
  };
}

export function ensureAllergenTag(
  allergenTags: string[],
  allergyFriendlyTags: string[],
  tag: (typeof allergenTagOptions)[number]
) {
  return allergenTags.includes(tag)
    ? { allergenTags, allergyFriendlyTags }
    : toggleAllergenSelection(allergenTags, allergyFriendlyTags, tag);
}

export function ensureFriendlyTag(
  allergenTags: string[],
  allergyFriendlyTags: string[],
  tag: (typeof allergyFriendlyTagOptions)[number]
) {
  return allergyFriendlyTags.includes(tag)
    ? { allergenTags, allergyFriendlyTags }
    : toggleFriendlySelection(allergenTags, allergyFriendlyTags, tag);
}
