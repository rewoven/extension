import type { ScrapedProduct, ScoringResult, Grade } from '../shared/types';
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

  // Calculate weighted environmental metrics — ONLY from recognised fibres.
  let weightedCO2 = 0;
  let weightedWater = 0;
  let weightedDurability = 0;
  let biodegPenalty = 0;
  let totalPct = 0;

  const materialBreakdown: ScoringResult['materialBreakdown'] = [];

  for (const mat of materials) {
    // 'unknown' has a placeholder DB entry — never let it produce a real
    // footprint. Only genuinely identified fibres count.
    if (mat.fiber === 'unknown') continue;
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

    const matScore = (impact.co2PerKg / MAX_CO2) * 50 + (impact.waterPerKg / MAX_WATER) * 50;
    materialBreakdown.push({
      fiber: mat.fiber,
      percentage: mat.percentage,
      impact: matScore < 30 ? 'low' : matScore < 60 ? 'medium' : 'high',
    });
  }

  // NO MATERIALS FOUND → we do not invent a footprint. Return a result with
  // everything environmental set to null. The overlay shows an honest
  // "composition not listed" state (and may still show the real brand rating).
  if (totalPct === 0) {
    return {
      materialsKnown: false,
      grade: null,
      score: null,
      co2Estimate: null,
      waterEstimate: null,
      costPerWear: null,
      estimatedWears: null,
      materialBreakdown: [],
      brandRating: getBrandRating(brand) || undefined,
      alternatives: getAlternatives([], category),
      tips: getTips([], null),
    };
  }

  // Normalise weighted metrics to the recognised portion so a partial match
  // (e.g. only 60% identified) isn't understated.
  if (totalPct > 0 && totalPct < 100) {
    const scale = 100 / totalPct;
    weightedCO2 *= scale;
    weightedWater *= scale;
    weightedDurability *= scale;
    biodegPenalty *= scale;
  }

  // Calculate composite score (0-100, lower = better)
  const carbonScore = (weightedCO2 / MAX_CO2) * 100;
  const waterScore = (weightedWater / MAX_WATER) * 100;
  const durabilityScore = (1 - weightedDurability / 10) * 100;
  const biodegScore = Math.min(1, biodegPenalty) * 100;

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

  const { costPerWear, estimatedWears } = calculateCostPerWear(price, materials, category);

  const alternatives = getAlternatives(materialBreakdown, category);
  const tips = getTips(materialBreakdown, compositeScore);

  return {
    materialsKnown: true,
    grade: scoreToGrade(compositeScore),
    score: Math.round(compositeScore),
    co2Estimate,
    waterEstimate,
    costPerWear: costPerWear === null ? null : Math.round(costPerWear * 100) / 100,
    estimatedWears,
    materialBreakdown,
    brandRating: getBrandRating(brand) || undefined,
    alternatives,
    tips,
  };
}
