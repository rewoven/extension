import { getScraperForSite } from '../scrapers/scraper-registry';
import type { ScrapedProduct, ScoringResult, UserSettings, Message } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { createOverlay, updateOverlay, removeOverlay } from './overlay';
import { initWasmScorer, scoreMaterials, isWasmReady } from './wasm-scorer';
import type { WasmScoringResult } from './wasm-scorer';
import { detectBrandSlug } from '../api/brand-detector';
import { fetchBrandRating, searchBrand } from '../api/brand-client';
import type { BrandRating } from '../api/brand-client';

let currentUrl = window.location.href;
let scrapeTimeout: ReturnType<typeof setTimeout> | null = null;
let isActive = false;

// Initialize the WASM scorer in the background
initWasmScorer().catch((err) => {
  console.warn('[Rewoven] WASM scorer unavailable, using JS fallback:', err);
});

async function getSettings(): Promise<UserSettings> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' } as Message, (response) => {
      resolve(response?.payload || DEFAULT_SETTINGS);
    });
  });
}

async function scoreProduct(product: ScrapedProduct): Promise<ScoringResult> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'SCORE_PRODUCT', payload: product } as Message, (response) => {
      resolve(response?.payload);
    });
  });
}

async function tryScrapePage() {
  const settings = await getSettings();
  if (!settings.enabled) {
    removeOverlay();
    return;
  }

  const hostname = window.location.hostname.toLowerCase();
  if (settings.disabledSites.some((s) => hostname.includes(s))) {
    removeOverlay();
    return;
  }

  const scraper = getScraperForSite();

  if (!scraper.isProductPage()) {
    removeOverlay();
    return;
  }

  const product = scraper.extract();
  if (!product || (!product.name && product.materials.length === 0)) {
    // Maybe the page hasn't finished loading — retry once
    if (!isActive) {
      isActive = true;
      setTimeout(tryScrapePage, 2000);
    }
    return;
  }

  isActive = true;
  console.log('[Rewoven] Product detected:', product.name);
  console.log('[Rewoven] Materials:', product.materials);

  const result = await scoreProduct(product);
  if (result) {
    // Enrich with WASM environmental metrics if available
    if (isWasmReady() && product.materials.length > 0) {
      const compositionStr = product.materials
        .map((m) => `${m.percentage}% ${m.fiber.replace(/_/g, ' ')}`)
        .join(', ');
      const wasmResult = scoreMaterials(compositionStr);
      if (wasmResult) {
        (result as any).wasmMetrics = wasmResult.environmental_metrics;
        (result as any).wasmRecommendations = wasmResult.recommendations;
        console.log('[Rewoven] WASM scorer enriched result:', wasmResult.grade, wasmResult.score);
      }
    }

    // Fetch brand rating from Rewoven API (non-blocking, graceful degradation)
    let apiBrandRating: BrandRating | null = null;
    try {
      const slug = detectBrandSlug(window.location.hostname, document.title);
      if (slug) {
        apiBrandRating = await fetchBrandRating(slug);
        // If direct slug lookup fails, try a search by brand name
        if (!apiBrandRating && product.brand) {
          const results = await searchBrand(product.brand);
          if (results.length > 0) {
            apiBrandRating = results[0];
          }
        }
        if (apiBrandRating) {
          console.log('[Rewoven] Brand rating from API:', apiBrandRating.name, apiBrandRating.grade);
        }
      }
    } catch (err) {
      console.warn('[Rewoven] Brand rating fetch failed (graceful degradation):', err);
    }

    createOverlay(result, product, apiBrandRating);
  }
}

function onUrlChange() {
  const newUrl = window.location.href;
  if (newUrl === currentUrl) return;
  currentUrl = newUrl;
  isActive = false;

  // Debounce to let the page load
  if (scrapeTimeout) clearTimeout(scrapeTimeout);
  scrapeTimeout = setTimeout(tryScrapePage, 1500);
}

// Initial scrape after page load
setTimeout(tryScrapePage, 1500);

// Watch for SPA navigation
const observer = new MutationObserver(() => onUrlChange());
observer.observe(document.querySelector('title') || document.head, {
  childList: true,
  subtree: true,
  characterData: true,
});

// Also watch popstate and hashchange
window.addEventListener('popstate', onUrlChange);
window.addEventListener('hashchange', onUrlChange);

// URL polling fallback for stubborn SPAs
setInterval(onUrlChange, 2000);
