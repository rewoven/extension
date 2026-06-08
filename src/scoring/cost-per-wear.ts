import type { MaterialComposition, GarmentCategory } from '../shared/types';
import { BASE_WEARS } from '../shared/constants';
import { MATERIAL_DATABASE } from './material-database';

export function calculateCostPerWear(
  price: number,
  materials: MaterialComposition[],
  category: GarmentCategory
): { costPerWear: number | null; estimatedWears: number | null } {
  // We only estimate wears when we know the garment category AND have at least
  // one recognised fibre to base durability on. Otherwise we'd be guessing.
  const recognised = materials.filter((m) => m.fiber !== 'unknown' && MATERIAL_DATABASE[m.fiber]);
  if (category === 'unknown' || recognised.length === 0) {
    return { costPerWear: null, estimatedWears: null };
  }

  const baseWears = BASE_WEARS[category] || BASE_WEARS.unknown;

  let weightedDurability = 0;
  let totalPct = 0;
  for (const mat of recognised) {
    const impact = MATERIAL_DATABASE[mat.fiber];
    weightedDurability += impact.durability * (mat.percentage / 100);
    totalPct += mat.percentage;
  }
  if (totalPct > 0 && totalPct < 100) {
    weightedDurability = weightedDurability * (100 / totalPct);
  }
  if (weightedDurability === 0) weightedDurability = 5;

  const durabilityFactor = 0.5 + weightedDurability / 10;
  const estimatedWears = Math.round(baseWears * durabilityFactor);

  // Cost per wear needs a real price - never show $0.00 for an unknown price.
  const costPerWear = price > 0 ? price / estimatedWears : null;

  return { costPerWear, estimatedWears };
}

export function getCostPerWearLabel(cpw: number): string {
  if (cpw < 0.1) return 'Excellent value';
  if (cpw < 0.3) return 'Great value';
  if (cpw < 0.5) return 'Good value';
  if (cpw < 1.0) return 'Fair value';
  if (cpw < 2.0) return 'Consider carefully';
  return 'Poor value';
}
