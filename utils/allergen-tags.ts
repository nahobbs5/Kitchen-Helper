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

function combinedText(input: InferenceInput) {
  return [input.title, input.ingredientsText, input.directionsText, input.notes]
    .filter(Boolean)
    .join('\n');
}

export function inferRecipeTags(input: InferenceInput) {
  const text = combinedText(input);

  const allergyFriendlyTags = allergyFriendlyTagOptions.filter((tag) =>
    friendlyMatchers[tag].some((matcher) => matcher.test(text))
  );

  const allergenTags = allergenTagOptions
    .filter((tag) => allergenMatchers[tag].some((matcher) => matcher.test(text)))
    .filter((tag) => !allergyFriendlyTags.some((friendlyTag) => friendlyToAllergen[friendlyTag] === tag));

  return {
    allergenTags,
    allergyFriendlyTags,
  };
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
