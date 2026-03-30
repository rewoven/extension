/**
 * WASM Sustainability Scorer wrapper
 *
 * Loads the Rust-compiled WASM module and exposes a clean API
 * for scoring fabric/material compositions.
 */

// The wasm-pack generated JS glue (copied into dist/ at build time)
// We import initSync + the exported functions so we can initialize
// the module synchronously from pre-fetched bytes.
import init, { score_materials, parse_materials, initSync } from '../../wasm-scorer/pkg/rewoven_wasm_scorer.js';

export interface WasmMaterialBreakdown {
  fiber: string;
  percentage: number;
  impact: string;
  co2_per_kg: number;
  water_per_kg: number;
  biodegradable: boolean;
  renewable: boolean;
  microplastic_risk: boolean;
  durability: number;
}

export interface WasmEnvironmentalMetrics {
  water_rating: string;
  carbon_rating: string;
  biodegradability_rating: string;
  microplastic_risk: string;
}

export interface WasmScoringResult {
  score: number;
  grade: string;
  breakdown: WasmMaterialBreakdown[];
  environmental_metrics: WasmEnvironmentalMetrics;
  recommendations: string[];
  weighted_co2: number;
  weighted_water: number;
  weighted_durability: number;
}

export interface WasmParsedMaterial {
  name: string;
  normalized: string;
  percentage: number;
}

let initialized = false;

/**
 * Initialize the WASM module. Must be called before scoring.
 * In a Chrome extension context, fetches the .wasm file via chrome.runtime.getURL.
 */
export async function initWasmScorer(): Promise<void> {
  if (initialized) return;

  try {
    // In Chrome extension context, use chrome.runtime.getURL
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const wasmUrl = chrome.runtime.getURL('rewoven_wasm_scorer_bg.wasm');
      const response = await fetch(wasmUrl);
      const bytes = await response.arrayBuffer();
      initSync({ module: bytes });
    } else {
      // Fallback for non-extension contexts (e.g. testing)
      await init();
    }
    initialized = true;
    console.log('[Rewoven] WASM sustainability scorer initialized');
  } catch (err) {
    console.error('[Rewoven] Failed to initialize WASM scorer:', err);
    throw err;
  }
}

/**
 * Score a composition string like "60% polyester, 40% cotton".
 * Returns detailed sustainability scoring data.
 */
export function scoreMaterials(compositionString: string): WasmScoringResult | null {
  if (!initialized) {
    console.warn('[Rewoven] WASM scorer not initialized. Call initWasmScorer() first.');
    return null;
  }

  try {
    return score_materials(compositionString) as WasmScoringResult;
  } catch (err) {
    console.error('[Rewoven] WASM scoring error:', err);
    return null;
  }
}

/**
 * Parse a composition string into structured material data.
 */
export function parseMaterials(compositionString: string): WasmParsedMaterial[] | null {
  if (!initialized) {
    console.warn('[Rewoven] WASM scorer not initialized. Call initWasmScorer() first.');
    return null;
  }

  try {
    return parse_materials(compositionString) as WasmParsedMaterial[];
  } catch (err) {
    console.error('[Rewoven] WASM parsing error:', err);
    return null;
  }
}

/**
 * Check if the WASM scorer has been initialized.
 */
export function isWasmReady(): boolean {
  return initialized;
}
