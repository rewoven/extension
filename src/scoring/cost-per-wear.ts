import type { MaterialComposition, GarmentCategory } from '../shared/types';
import { BASE_WEARS } from '../shared/constants';
import { MATERIAL_DATABASE } from './material-database';

export function calculateCostPerWear(
  price: number,
  materials: MaterialComposition[],
  category: GarmentCategory
): { costPerWear: number; estimatedWears: number } {
  const baseWears = BASE_WEARS[category] || BASE_WEARS.unknown;

  // Calculate weighted durability from materials
  let weightedDurability = 0;
  let totalPct = 0;

  for (const mat of materials) {
    const impact = MATERIAL_DATABASE[mat.fiber];
    if (impact) {
      weightedDurability += impact.durability * (mat.percentage / 100);
      totalPct += mat.percentage;
    }
  }

  // Normalize if we didn't account for all materials
  if (totalPct > 0 && totalPct < 100) {
    weightedDurability = weightedDurability * (100 / totalPct);
  }

  // Fallback durability
  if (weightedDurability === 0) weightedDurability = 5;

  // Durability factor: 0.5x to 1.5x of base wears
  const durabilityFactor = 0.5 + (weightedDurability / 10);
  const estimatedWears = Math.round(baseWears * durabilityFactor);
  const costPerWear = price / estimatedWears;

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
