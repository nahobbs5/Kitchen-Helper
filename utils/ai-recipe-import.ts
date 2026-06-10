import type { RecipeSection } from '../data/obsidian-recipes';

export type AiImportTier = 'fast' | 'accurate';

export type AiRecipePhoto = {
  base64: string;
  mediaType: string;
};

export type AiImportedRecipe = {
  title: string;
  ingredientSections: RecipeSection[];
  directionSections: RecipeSection[];
  prepTime: string | null;
  cookTime: string | null;
  servings: string | null;
  notes: string | null;
  suggestedCategory: string | null;
  cuisineRegion: string | null;
  allergenTags: string[];
  allergyFriendlyTags: string[];
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function aiImportIsConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function importRecipeFromPhotos(
  photos: AiRecipePhoto[],
  tier: AiImportTier = 'fast'
): Promise<AiImportedRecipe> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'AI import needs EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (see supabase/functions/recipe-import/README.md).'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/recipe-import`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ images: photos, tier }),
    });
  } catch {
    throw new Error('Could not reach the recipe import service. Check your connection and try again.');
  }

  let payload: { recipe?: AiImportedRecipe; error?: string };
  try {
    payload = await response.json();
  } catch {
    throw new Error('The recipe import service returned an unexpected response.');
  }

  if (!response.ok || !payload.recipe) {
    throw new Error(payload.error ?? 'Recipe extraction failed. Try clearer photos or manual entry.');
  }

  return payload.recipe;
}
