export type CookingTip = {
  title: string;
  lines: string[];
};

export type CookingTipCategory = {
  category: string;
  tips: CookingTip[];
};

export const cookingTips: CookingTipCategory[] = [
  {
    category: 'Rice',
    tips: [
      {
        title: 'Basmati rice — water ratio',
        lines: [
          'Rice to water ratio: 1 : 1.5',
          '3/4 cup rice → 1 1/8 cup water (1 cup + 2 tbsp)',
          '1/2 cup rice → 3/4 cup + 2 tbsp water',
        ],
      },
    ],
  },
];
