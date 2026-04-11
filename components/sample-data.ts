export type Ingredient = {
  name: string;
  amount: number;
  unit: string;
  note?: string;
};

export type Conversion = {
  from: string;
  to: string;
  result: string;
};

export type ConversionSection = {
  title: string;
  description: string;
  entries: Conversion[];
};

export type Substitute = {
  ingredient: string;
  swap: string;
  ratio: string;
  note: string;
};

export type AllergySubstitution = {
  allergy: string;
  avoid: string;
  swap: string;
  ratio: string;
  notes: string;
};

export const baseServings = 4;

export const baseIngredients: Ingredient[] = [
  { name: 'Penne pasta', amount: 12, unit: 'oz' },
  { name: 'Heavy cream', amount: 1.5, unit: 'cups' },
  { name: 'Garlic cloves', amount: 4, unit: 'cloves', note: 'minced' },
  { name: 'Parmesan', amount: 1, unit: 'cup', note: 'freshly grated' },
  { name: 'Spinach', amount: 3, unit: 'cups', note: 'loosely packed' },
  { name: 'Red pepper flakes', amount: 0.5, unit: 'tsp', note: 'optional' },
];

export const conversions: Conversion[] = [
  { from: '2 tbsp olive oil', to: 'milliliters', result: '30 ml' },
  { from: '400F oven', to: 'celsius', result: '205C' },
  { from: '1 cup parmesan', to: 'grams', result: '100 g' },
];

export const conversionSections: ConversionSection[] = [
  {
    title: 'Liquid measure',
    description: 'General kitchen liquid conversions from the Shamrock conversion chart.',
    entries: [
      { from: '1 gal', to: 'cups / fl oz / liters', result: '16 cups / 128 fl oz / 3.8 L' },
      { from: '1 qt', to: 'cups / fl oz / liters', result: '4 cups / 32 fl oz / .95 L' },
      { from: '1 cup', to: 'fl oz / tbsp / tsp', result: '8 fl oz / 16 tbsp / 48 tsp' },
      { from: '1/2 cup', to: 'fl oz / tbsp / tsp', result: '4 fl oz / 8 tbsp / 24 tsp' },
    ],
  },
  {
    title: 'Dry measure',
    description: 'Dry measuring references pulled from the same chart set.',
    entries: [
      { from: '1 cup', to: 'fluid oz / tbsp / ml', result: '8 fl oz / 16 tbsp / 237 ml' },
      { from: '3/4 cup', to: 'fluid oz / tbsp / ml', result: '6 fl oz / 12 tbsp / 177 ml' },
      { from: '1/3 cup', to: 'fluid oz / tbsp / ml', result: '2 2/3 fl oz / 5 1/3 tbsp / 79 ml' },
      { from: '1 tsp', to: 'cup / fl oz / ml', result: '1/48 cup / 1/8 fl oz / 5 ml' },
    ],
  },
  {
    title: 'Oven temperatures',
    description: 'US, metric, and gas mark references from the chart.',
    entries: [
      { from: '325F', to: 'celsius / gas mark', result: '170C / Mark 3' },
      { from: '350F', to: 'celsius / gas mark', result: '180C / Mark 4' },
      { from: '400F', to: 'celsius / gas mark', result: '200C / Mark 6' },
      { from: '450F', to: 'celsius / gas mark', result: '230C / Mark 8' },
    ],
  },
  {
    title: 'Butter to olive oil',
    description: 'Useful when baking substitutions are needed.',
    entries: [
      { from: '1 tsp butter', to: 'olive oil', result: '3/4 tsp' },
      { from: '1 tbsp butter', to: 'olive oil', result: '2 1/4 tsp' },
      { from: '1/2 cup butter', to: 'olive oil', result: '1/4 cup + 2 tbsp' },
      { from: '1 cup butter', to: 'olive oil', result: '3/4 cup' },
    ],
  },
  {
    title: 'Can and bottle sizes',
    description: 'Handy metric equivalents for common can sizes.',
    entries: [
      { from: '8 ounces', to: 'metric', result: '227 ml' },
      { from: '14 ounces', to: 'metric', result: '398 ml' },
      { from: '28 ounces', to: 'metric', result: '796 ml' },
      { from: '1 liter', to: 'cups', result: '4 1/4 cups' },
    ],
  },
];

export const substitutions: Substitute[] = [
  {
    ingredient: 'Heavy cream',
    swap: 'Evaporated milk + butter',
    ratio: '1 cup = 3/4 cup evaporated milk + 1/4 cup butter',
    note: 'Best for sauces and soups, a little lighter than cream.',
  },
  {
    ingredient: 'Parmesan',
    swap: 'Pecorino Romano',
    ratio: '1:1',
    note: 'Saltier and sharper, so it is worth tasting before adding extra salt.',
  },
  {
    ingredient: 'Spinach',
    swap: 'Kale or arugula',
    ratio: '1:1',
    note: 'Kale needs a longer cook, arugula wilts almost immediately.',
  },
];

export const allergySubstitutions: AllergySubstitution[] = [
  {
    allergy: 'Dairy-free',
    avoid: 'Milk',
    swap: 'Unsweetened oat milk',
    ratio: '1:1',
    notes: 'Works well in sauces and baking when you want a neutral flavor.',
  },
  {
    allergy: 'Dairy-free',
    avoid: 'Butter',
    swap: 'Vegan butter or olive oil',
    ratio: '1:1 for vegan butter, 3/4 amount for oil',
    notes: 'Oil changes texture in baking, but is fine for sauteing and roasting.',
  },
  {
    allergy: 'Egg-free',
    avoid: '1 egg',
    swap: '1 tbsp ground flax + 3 tbsp water',
    ratio: '1 egg replacement',
    notes: 'Best for binding in muffins, pancakes, and quick breads.',
  },
  {
    allergy: 'Gluten-free',
    avoid: 'Soy sauce',
    swap: 'Tamari labeled gluten-free',
    ratio: '1:1',
    notes: 'Always check the bottle because not all tamari is gluten-free.',
  },
  {
    allergy: 'Nut-free',
    avoid: 'Peanut butter',
    swap: 'Sunflower seed butter',
    ratio: '1:1',
    notes: 'A strong option for sandwiches, sauces, and baking.',
  },
  {
    allergy: 'Soy-free',
    avoid: 'Tofu',
    swap: 'Chickpeas or roasted mushrooms',
    ratio: 'Use by texture and portion',
    notes: 'Best when the goal is protein or savory bulk rather than a direct match.',
  },
];

export const chartSubstitutions: Substitute[] = [
  {
    ingredient: 'Baking powder',
    swap: 'Baking soda + buttermilk',
    ratio: '1 tsp = 1/4 tsp baking soda + 1/2 cup buttermilk',
    note: 'Chart-based pantry substitute from the Shamrock reference.',
  },
  {
    ingredient: 'Chocolate',
    swap: 'Cocoa + shortening',
    ratio: '1 oz = 3 tbsp cocoa + 1 tbsp shortening',
    note: 'Useful when a recipe calls for baking chocolate.',
  },
  {
    ingredient: 'Corn starch',
    swap: 'Flour',
    ratio: '1 tbsp = 2 tbsp flour',
    note: 'Works as a thickener, though the final texture can differ.',
  },
  {
    ingredient: 'Milk, sour',
    swap: 'Milk + lemon juice or vinegar',
    ratio: '1 cup = 1 tbsp lemon juice or vinegar + milk to make 1 cup',
    note: 'A practical buttermilk-style workaround for baking.',
  },
  {
    ingredient: 'Brown sugar',
    swap: 'Granulated sugar + molasses',
    ratio: '1 cup = 3/4 cup sugar + 1/4 cup molasses',
    note: 'Helpful when you have white sugar but no brown sugar.',
  },
  {
    ingredient: 'Sour cream',
    swap: 'Yogurt',
    ratio: '1 cup = 1 cup yogurt',
    note: 'A simple 1:1 swap for many baking and savory recipes.',
  },
];

export function formatAmount(value: number) {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  const rounded = Math.round(value * 100) / 100;
  return rounded.toString();
}
