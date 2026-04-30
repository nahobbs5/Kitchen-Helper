export type Ingredient = {
  name: string;
  amount: number;
  unit: string;
  note?: string;
};

export type Conversion = {
  from: string;
  result: string;
};

export type ConversionSection = {
  title: string;
  description: string;
  entries: Conversion[];
  table?: {
    columns: string[];
    rows: string[][];
    note: string;
  };
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
  { from: '2 tbsp olive oil', result: '30 ml' },
  { from: '400F oven', result: '205C' },
  { from: '1 cup parmesan', result: '100 g' },
];

export const conversionSections: ConversionSection[] = [
  {
    title: 'Liquid measure',
    description: 'General kitchen liquid conversions from the Shamrock conversion chart.',
    entries: [
      { from: '1 gal', result: '16 cups' },
      { from: '1 qt', result: '4 cups' },
      { from: '1 cup', result: '8 fl oz' },
      { from: '1/2 cup', result: '4 fl oz' },
    ],
  },
  {
    title: 'Dry measure',
    description: 'Dry measuring references pulled from the same chart set.',
    entries: [
      { from: '1 cup', result: '8 fl oz' },
      { from: '3/4 cup', result: '6 fl oz' },
      { from: '1/3 cup', result: '2 2/3 fl oz' },
      { from: '1 tsp', result: '5 ml' },
    ],
  },
  {
    title: 'Oven temperatures',
    description: 'US, metric, and gas mark references from the chart.',
    entries: [
      { from: '325F', result: '170C' },
      { from: '350F', result: '180C' },
      { from: '400F', result: '200C' },
      { from: '450F', result: '230C' },
    ],
  },
  {
    title: 'Butter to olive oil',
    description: 'Useful when baking substitutions are needed.',
    entries: [
      { from: '1 tsp butter', result: '3/4 tsp olive oil' },
      { from: '1 tbsp butter', result: '2 1/4 tsp olive oil' },
      { from: '1/2 cup butter', result: '1/4 cup + 2 tbsp olive oil' },
      { from: '1 cup butter', result: '3/4 cup olive oil' },
    ],
  },
  {
    title: 'Butter sticks',
    description: 'Quick reference for US butter sticks, tablespoons, cups, teaspoons, and grams.',
    entries: [],
    table: {
      columns: ['Amount', 'Tbsp', 'Cups', 'Tsp', 'Grams'],
      rows: [
        ['1 tsp', '1/3', '-', '1', '4.7 g'],
        ['1 tbsp', '1', '1/16', '3', '14.2 g'],
        ['1/4 stick', '2', '1/8', '6', '28 g'],
        ['1/2 stick', '4', '1/4', '12', '57 g'],
        ['1 stick', '8', '1/2', '24', '113 g'],
        ['1 1/2 sticks', '12', '3/4', '36', '170 g'],
        ['2 sticks', '16', '1', '48', '227 g'],
      ],
      note: '1 US stick = 8 tbsp = 1/2 cup = 4 oz = 113 g',
    },
  },
  {
    title: 'Can and bottle sizes',
    description: 'Handy metric equivalents for common can sizes.',
    entries: [
      { from: '8 ounces', result: '227 ml' },
      { from: '14 ounces', result: '398 ml' },
      { from: '28 ounces', result: '796 ml' },
      { from: '1 liter', result: '4 1/4 cups' },
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
    allergy: 'Egg-free',
    avoid: '1 egg',
    swap: '1/4 cup applesauce',
    ratio: '1 egg replacement',
    notes: 'Keeps baked goods moist; best for denser cakes and muffins.',
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
