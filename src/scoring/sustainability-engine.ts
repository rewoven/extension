import type { ScrapedProduct, ScoringResult, Grade, FiberType } from '../shared/types';
import { GRADE_THRESHOLDS, GARMENT_WEIGHTS } from '../shared/constants';
import { MATERIAL_DATABASE } from './material-database';
import { getBrandRating, getBrandModifier } from './brand-ratings';
import { calculateCostPerWear } from './cost-per-wear';
import { getAlternatives, getTips } from './alternatives';

// Max values for normalization (worst case fibers)
const MAX_CO2 = 28.0;   // cashmere
const MAX_WATER = 20000; // cashmere

// Scoring weights
const W_CARBON = 0.35;
const W_WATER = 0.25;
const W_DURABILITY = 0.20;
const W_BIODEG = 0.10;
const W_BRAND = 0.10;

function scoreToGrade(score: number): Grade {
  for (const threshold of GRADE_THRESHOLDS) {
    if (score <= threshold.max) return threshold.grade;
  }
  return 'F';
}

export function scoreProduct(product: ScrapedProduct): ScoringResult {
  const { materials, category, price, brand } = product;
  const garmentWeight = GARMENT_WEIGHTS[category] || GARMENT_WEIGHTS.unknown;

  // Calculate weighted environmental metrics
  let weightedCO2 = 0;
  let weightedWater = 0;
  let weightedDurability = 0;
  let biodegPenalty = 0;
  let totalPct = 0;

  const materialBreakdown: ScoringResult['materialBreakdown'] = [];

  for (const mat of materials) {
    const impact = MATERIAL_DATABASE[mat.fiber];
    if (!impact) continue;

    const pctFraction = mat.percentage / 100;
    weightedCO2 += impact.co2PerKg * pctFraction;
    weightedWater += impact.waterPerKg * pctFraction;
    weightedDurability += impact.durability * pctFraction;

    if (!impact.biodegradable) {
      biodegPenalty += pctFraction;
    }

    totalPct += mat.percentage;

    // Determine impact level for this material
    const matScore = (impact.co2PerKg / MAX_CO2) * 50 + (impact.waterPerKg / MAX_WATER) * 50;
    materialBreakdown.push({
      fiber: mat.fiber,
      percentage: mat.percentage,
      impact: matScore < 30 ? 'low' : matScore < 60 ? 'medium' : 'high',
    });
  }

  // If no materials detected, use worst-case defaults
  if (totalPct === 0) {
    weightedCO2 = 12;
    weightedWater = 5000;
    weightedDurability = 5;
    biodegPenalty = 0.5;
    materialBreakdown.push({ fiber: 'unknown' as FiberType, percentage: 100, impact: 'medium' });
  }

  // Calculate composite score (0-100, lower = better)
  const carbonScore = (weightedCO2 / MAX_CO2) * 100;
  const waterScore = (weightedWater / MAX_WATER) * 100;
  const durabilityScore = (1 - weightedDurability / 10) * 100;
  const biodegScore = biodegPenalty * 100;

  let compositeScore =
    W_CARBON * carbonScore +
    W_WATER * waterScore +
    W_DURABILITY * durabilityScore +
    W_BIODEG * biodegScore;

  // Brand modifier
  const brandMod = getBrandModifier(brand);
  compositeScore += W_BRAND * brandMod * 10;

  // Clamp to 0-100
  compositeScore = Math.max(0, Math.min(100, compositeScore));

  // Absolute footprint estimates for this garment
  const co2Estimate = Math.round(weightedCO2 * garmentWeight * 100) / 100;
  const waterEstimate = Math.round(weightedWater * garmentWeight);

  // Cost per wear
  const { costPerWear, estimatedWears } = calculateCostPerWear(price, materials, category);

  // Alternatives
  const alternatives = getAlternatives(materialBreakdown, category);

  // Tips
  const tips = getTips(materialBreakdown, compositeScore);

  return {
    grade: scoreToGrade(compositeScore),
    score: Math.round(compositeScore),
    co2Estimate,
    waterEstimate,
    costPerWear: Math.round(costPerWear * 100) / 100,
    estimatedWears,
    materialBreakdown,
    brandRating: getBrandRating(brand) || undefined,
    alternatives,
    tips,
  };
}
