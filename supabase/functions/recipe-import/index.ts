import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type ImportTier = 'fast' | 'accurate';

type RequestPhoto = {
  base64: string;
  mediaType: string;
};

type ImportRequestBody = {
  images: RequestPhoto[];
  tier?: ImportTier;
};

const allowedMediaTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const recipeSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    ingredientSections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          items: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'items'],
        additionalProperties: false,
      },
    },
    directionSections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          items: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'items'],
        additionalProperties: false,
      },
    },
    prepTime: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    cookTime: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    servings: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    notes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    suggestedCategory: {
      anyOf: [
        { type: 'string', enum: ['Appetizers', 'Breakfast', 'Side', 'Entree', 'Dessert'] },
        { type: 'null' },
      ],
    },
    cuisineRegion: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    allergenTags: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['Contains Dairy', 'Contains Eggs', 'Contains Gluten', 'Contains Nuts', 'Contains Soy'],
      },
    },
    allergyFriendlyTags: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['Dairy Free', 'Egg Free', 'Gluten Free', 'Nut Free', 'Soy Free', 'Wheat Free'],
      },
    },
  },
  required: [
    'title',
    'ingredientSections',
    'directionSections',
    'prepTime',
    'cookTime',
    'servings',
    'notes',
    'suggestedCategory',
    'cuisineRegion',
    'allergenTags',
    'allergyFriendlyTags',
  ],
  additionalProperties: false,
} as const;

const extractionInstructions = `Transcribe the recipe shown in the image(s) into the requested JSON shape.

Rules:
- Preserve the recipe's own wording for ingredients and steps. Do not paraphrase, reorder, or invent content.
- If there are multiple images, they are parts of one recipe, in order.
- Use section titles only when the recipe itself has labeled sub-sections (e.g. "Sauce", "Filling"); otherwise use a single section with title null.
- Each ingredient is one item. Each direction step is one item, without leading step numbers.
- Use null for any field not present in the recipe. Do not guess prep/cook times that are not shown.
- suggestedCategory: pick the best fit for the dish.
- cuisineRegion: a short region label (e.g. "Mexican", "Mediterranean") only if reasonably clear, else null.
- allergenTags: tag allergens actually present in the ingredients. allergyFriendlyTags: only when the recipe is clearly free of that allergen or labeled as such. Never list a tag in both.`;

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, x-client-info, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'ANTHROPIC_API_KEY secret is not set on this function.' }, 500);
  }

  let body: ImportRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be JSON.' }, 400);
  }

  const images = Array.isArray(body.images) ? body.images.slice(0, 2) : [];
  if (
    images.length === 0
    || images.some((image) => !image?.base64 || !allowedMediaTypes.includes(image.mediaType))
  ) {
    return jsonResponse({ error: 'Provide 1-2 images as { base64, mediaType }.' }, 400);
  }

  const tier: ImportTier = body.tier === 'accurate' ? 'accurate' : 'fast';
  const model = tier === 'accurate'
    ? (Deno.env.get('ACCURATE_MODEL') ?? 'claude-sonnet-4-6')
    : (Deno.env.get('FAST_MODEL') ?? 'claude-haiku-4-5');

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            ...images.map((image) => ({
              type: 'image',
              source: { type: 'base64', media_type: image.mediaType, data: image.base64 },
            })),
            { type: 'text', text: extractionInstructions },
          ],
        },
      ],
      output_config: { format: { type: 'json_schema', schema: recipeSchema } },
    }),
  });

  if (!anthropicResponse.ok) {
    const detail = await anthropicResponse.text();
    console.error(`Anthropic API error ${anthropicResponse.status}: ${detail}`);
    return jsonResponse(
      {
        error: anthropicResponse.status === 429
          ? 'Rate limited — try again shortly.'
          : 'Recipe extraction failed upstream.',
      },
      502
    );
  }

  const message = (await anthropicResponse.json()) as {
    stop_reason: string;
    content: { type: string; text?: string }[];
    usage: unknown;
  };

  if (message.stop_reason === 'refusal') {
    return jsonResponse({ error: 'The model declined to process this image.' }, 422);
  }

  if (message.stop_reason === 'max_tokens') {
    return jsonResponse({ error: 'The recipe was too long to extract in one pass.' }, 422);
  }

  const text = message.content.find((block) => block.type === 'text')?.text;
  if (!text) {
    return jsonResponse({ error: 'No recipe text was produced.' }, 422);
  }

  try {
    return jsonResponse({ recipe: JSON.parse(text), model, usage: message.usage }, 200);
  } catch {
    return jsonResponse({ error: 'Extraction returned malformed data.' }, 502);
  }
});
