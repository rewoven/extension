import type { Grade } from './types';

export const SUPPORTED_RETAILERS = [
  { name: 'Zara', patterns: ['zara.com'] },
  { name: 'H&M', patterns: ['hm.com', 'www2.hm.com'] },
  { name: 'ASOS', patterns: ['asos.com'] },
  { name: 'Nike', patterns: ['nike.com'] },
  { name: 'SHEIN', patterns: ['shein.com'] },
  { name: 'Uniqlo', patterns: ['uniqlo.com'] },
  { name: 'Gap', patterns: ['gap.com'] },
  { name: 'Forever 21', patterns: ['forever21.com'] },
  { name: 'Urban Outfitters', patterns: ['urbanoutfitters.com'] },
  { name: 'Nordstrom', patterns: ['nordstrom.com'] },
  { name: 'Boohoo', patterns: ['boohoo.com'] },
  { name: 'PrettyLittleThing', patterns: ['prettylittlething.com'] },
  { name: 'Fashion Nova', patterns: ['fashionnova.com'] },
  { name: 'Mango', patterns: ['mango.com'] },
] as const;

export const GRADE_THRESHOLDS: { max: number; grade: Grade }[] = [
  { max: 20, grade: 'A' },
  { max: 35, grade: 'B' },
  { max: 50, grade: 'C' },
  { max: 65, grade: 'D' },
  { max: 100, grade: 'F' },
];

export const GRADE_COLORS: Record<Grade, { bg: string; text: string; label: string }> = {
  A: { bg: '#16A34A', text: '#FFFFFF', label: 'Excellent' },
  B: { bg: '#65A30D', text: '#FFFFFF', label: 'Good' },
  C: { bg: '#EAB308', text: '#000000', label: 'Average' },
  D: { bg: '#EA580C', text: '#FFFFFF', label: 'Poor' },
  F: { bg: '#DC2626', text: '#FFFFFF', label: 'Very Poor' },
};

export const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#81C784',
  primaryDark: '#1B5E20',
  background: '#F1F8E9',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  accent: '#4CAF50',
};

// Average garment weight in kg by category
export const GARMENT_WEIGHTS: Record<string, number> = {
  top: 0.2,
  bottom: 0.4,
  dress: 0.35,
  outerwear: 0.8,
  activewear: 0.25,
  footwear: 0.7,
  accessory: 0.1,
  underwear: 0.08,
  swimwear: 0.15,
  unknown: 0.3,
};

// Base number of wears before garment end-of-life
export const BASE_WEARS: Record<string, number> = {
  top: 80,
  bottom: 120,
  dress: 50,
  outerwear: 200,
  activewear: 100,
  footwear: 250,
  accessory: 300,
  underwear: 60,
  swimwear: 40,
  unknown: 80,
};
