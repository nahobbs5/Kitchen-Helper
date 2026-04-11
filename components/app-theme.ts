export type AppPalette = {
  surface: string;
  background: string;
  elevated: string;
  elevatedAlt: string;
  elevatedDark: string;
  border: string;
  borderAlt: string;
  text: string;
  textMuted: string;
  textSoft: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  accentContrastText: string;
  inverseText: string;
  inverseMuted: string;
  tag: string;
  tagText: string;
  searchPlaceholder: string;
  headerBackground: string;
};

export const lightPalette: AppPalette = {
  surface: '#fff7ea',
  background: '#f4efe6',
  elevated: '#fffdf9',
  elevatedAlt: '#fdf3df',
  elevatedDark: '#7a2f1d',
  border: '#e8dccb',
  borderAlt: '#ead2ab',
  text: '#2a2118',
  textMuted: '#5c4d3c',
  textSoft: '#8f775b',
  accent: '#7a2f1d',
  accentSoft: '#e4b66b',
  accentText: '#8a5a24',
  accentContrastText: '#fff6eb',
  inverseText: '#fff6eb',
  inverseMuted: '#f2d7c3',
  tag: '#f4dfba',
  tagText: '#6f4817',
  searchPlaceholder: '#8f775b',
  headerBackground: '#fff7ea',
};

export const darkPalette: AppPalette = {
  surface: '#1d1712',
  background: '#120f0c',
  elevated: '#231c16',
  elevatedAlt: '#2a2119',
  elevatedDark: '#3a281e',
  border: '#4a3b2f',
  borderAlt: '#5c4736',
  text: '#f5eadf',
  textMuted: '#d7c1ac',
  textSoft: '#b89b81',
  accent: '#f0b35f',
  accentSoft: '#f0b35f',
  accentText: '#f0b35f',
  accentContrastText: '#1d1712',
  inverseText: '#fff6eb',
  inverseMuted: '#e3cdb6',
  tag: '#3a2d22',
  tagText: '#f5d8aa',
  searchPlaceholder: '#a88d74',
  headerBackground: '#1d1712',
};
