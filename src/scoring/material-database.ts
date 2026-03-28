import type { FiberType, MaterialImpact } from '../shared/types';

export const MATERIAL_DATABASE: Record<FiberType, MaterialImpact> = {
  cotton: {
    co2PerKg: 16.4,
    waterPerKg: 10000,
    durability: 6,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  organic_cotton: {
    co2PerKg: 8.2,
    waterPerKg: 5000,
    durability: 6,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  recycled_cotton: {
    co2PerKg: 4.1,
    waterPerKg: 200,
    durability: 5,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  polyester: {
    co2PerKg: 14.2,
    waterPerKg: 60,
    durability: 8,
    biodegradable: false,
    renewable: false,
    microplasticRisk: true,
  },
  recycled_polyester: {
    co2PerKg: 5.0,
    waterPerKg: 20,
    durability: 7,
    biodegradable: false,
    renewable: false,
    microplasticRisk: true,
  },
  nylon: {
    co2PerKg: 24.0,
    waterPerKg: 150,
    durability: 9,
    biodegradable: false,
    renewable: false,
    microplasticRisk: true,
  },
  recycled_nylon: {
    co2PerKg: 8.0,
    waterPerKg: 50,
    durability: 8,
    biodegradable: false,
    renewable: false,
    microplasticRisk: true,
  },
  linen: {
    co2PerKg: 3.5,
    waterPerKg: 2000,
    durability: 7,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  hemp: {
    co2PerKg: 2.8,
    waterPerKg: 2700,
    durability: 8,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  tencel: {
    co2PerKg: 3.0,
    waterPerKg: 1500,
    durability: 7,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  lyocell: {
    co2PerKg: 3.0,
    waterPerKg: 1500,
    durability: 7,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  modal: {
    co2PerKg: 4.5,
    waterPerKg: 2000,
    durability: 6,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  viscose: {
    co2PerKg: 8.0,
    waterPerKg: 5000,
    durability: 5,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  rayon: {
    co2PerKg: 8.0,
    waterPerKg: 5000,
    durability: 5,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  wool: {
    co2PerKg: 20.0,
    waterPerKg: 15000,
    durability: 9,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  silk: {
    co2PerKg: 25.0,
    waterPerKg: 10000,
    durability: 5,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  acrylic: {
    co2PerKg: 18.0,
    waterPerKg: 100,
    durability: 4,
    biodegradable: false,
    renewable: false,
    microplasticRisk: true,
  },
  spandex: {
    co2PerKg: 15.0,
    waterPerKg: 80,
    durability: 3,
    biodegradable: false,
    renewable: false,
    microplasticRisk: true,
  },
  elastane: {
    co2PerKg: 15.0,
    waterPerKg: 80,
    durability: 3,
    biodegradable: false,
    renewable: false,
    microplasticRisk: true,
  },
  cashmere: {
    co2PerKg: 28.0,
    waterPerKg: 20000,
    durability: 6,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  leather: {
    co2PerKg: 17.0,
    waterPerKg: 17000,
    durability: 9,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  faux_leather: {
    co2PerKg: 16.0,
    waterPerKg: 50,
    durability: 4,
    biodegradable: false,
    renewable: false,
    microplasticRisk: true,
  },
  down: {
    co2PerKg: 22.0,
    waterPerKg: 14000,
    durability: 8,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  recycled_down: {
    co2PerKg: 5.0,
    waterPerKg: 100,
    durability: 7,
    biodegradable: true,
    renewable: true,
    microplasticRisk: false,
  },
  unknown: {
    co2PerKg: 12.0,
    waterPerKg: 5000,
    durability: 5,
    biodegradable: false,
    renewable: false,
    microplasticRisk: true,
  },
};

// Normalize a raw fiber name string to our FiberType enum
export function normalizeFiber(raw: string): FiberType {
  const lower = raw.toLowerCase().trim();

  // Check for recycled/organic qualifiers first
  if (lower.includes('recycled') && lower.includes('cotton')) return 'recycled_cotton';
  if (lower.includes('recycled') && lower.includes('polyester')) return 'recycled_polyester';
  if (lower.includes('recycled') && lower.includes('nylon')) return 'recycled_nylon';
  if (lower.includes('recycled') && lower.includes('down')) return 'recycled_down';
  if (lower.includes('organic') && lower.includes('cotton')) return 'organic_cotton';
  if (lower.includes('bci') && lower.includes('cotton')) return 'organic_cotton'; // BCI cotton treated as organic

  const map: Record<string, FiberType> = {
    cotton: 'cotton',
    polyester: 'polyester',
    nylon: 'nylon',
    polyamide: 'nylon',
    linen: 'linen',
    flax: 'linen',
    hemp: 'hemp',
    tencel: 'tencel',
    lyocell: 'lyocell',
    modal: 'modal',
    viscose: 'viscose',
    rayon: 'rayon',
    wool: 'wool',
    merino: 'wool',
    silk: 'silk',
    acrylic: 'acrylic',
    spandex: 'spandex',
    elastane: 'elastane',
    lycra: 'elastane',
    cashmere: 'cashmere',
    leather: 'leather',
    'faux leather': 'faux_leather',
    'vegan leather': 'faux_leather',
    'pu leather': 'faux_leather',
    down: 'down',
  };

  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }

  return 'unknown';
}
