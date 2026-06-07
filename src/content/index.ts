import { getScraperForSite } from '../scrapers/scraper-registry';
import { isApparelContext } from '../scrapers/apparel-detector';
import type { UserSettings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { createOverlay, removeOverlay } from './overlay';
import { scoreProduct } from '../scoring/sustainability-engine';
import { detectBrandSlug } from '../api/brand-detector';
import { fetchBrandRating, searchBrand } from '../api/brand-client';
import type { BrandRating } from '../api/brand-client';

let currentUrl = window.location.href;
let scrapeTimeout: ReturnType<typeof setTimeout> | null = null;
let isActive = false;

// ─── Settings cache ─────────────────────────────────────────────────
// Read settings ONCE directly from chrome.storage (no service-worker
// round-trip, which in MV3 can incur a wake-up delay on every page) and keep
// them in memory, refreshing only when they actually change.
let cachedSettings: UserSettings = DEFAULT_SETTINGS;
let settingsLoaded = false;

async function getSettings(): Promise<UserSettings> {
  if (settingsLoaded) return cachedSettings;
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get('settings', (data) => {
        // Don't clobber a value that an onChanged event already freshened
        // while this async read was in flight.
        if (!settingsLoaded) {
          cachedSettings = { ...DEFAULT_SETTINGS, ...(data?.settings || {}) };
          settingsLoaded = true;
        }
        resolve(cachedSettings);
      });
    } catch {
      resolve(cachedSettings);
    }
  });
}

// Keep the cache fresh if the user changes settings in the popup.
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) {
      cachedSettings = { ...DEFAULT_SETTINGS, ...(changes.settings.newValue || {}) };
      settingsLoaded = true;
      onUrlChange(true);
    }
  });
} catch {
  /* storage events unavailable — non-fatal */
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
  if (!product || !product.name) {
    // Maybe the page hasn't finished loading — retry once. Track the timer in
    // scrapeTimeout so a navigation cancels it (no stray fire on the next page).
    if (!isActive) {
      isActive = true;
      if (scrapeTimeout) clearTimeout(scrapeTimeout);
      scrapeTimeout = setTimeout(tryScrapePage, 2000);
    }
    return;
  }

  // APPAREL GATE — only run on clothing/fashion products. This is what keeps
  // the Lens off non-fashion pages like apple.com.
  if (!isApparelContext(product, hostname)) {
    console.log('[Rewoven] Not a clothing product — skipping:', product.name);
    removeOverlay();
    return;
  }

  // Many fashion PDPs lazy-load the fabric composition after first paint.
  // Give it exactly one retry before we settle for a brand-only card.
  if (product.materials.length === 0 && !isActive) {
    isActive = true;
    if (scrapeTimeout) clearTimeout(scrapeTimeout);
    scrapeTimeout = setTimeout(tryScrapePage, 2000);
    return;
  }

  isActive = true;
  console.log('[Rewoven] Apparel product detected:', product.name);
  console.log('[Rewoven] Materials:', product.materials);

  // Fetch the real brand rating from the Rewoven API (graceful degradation).
  // Only the curated fashion-domain map or an API name search can match — so
  // non-fashion brands simply return nothing.
  let apiBrandRating: BrandRating | null = null;
  try {
    const slug = detectBrandSlug(hostname);
    if (slug) {
      apiBrandRating = await fetchBrandRating(slug);
    }
    if (!apiBrandRating && product.brand && product.brand !== 'Unknown') {
      const results = await searchBrand(product.brand);
      if (results.length > 0) apiBrandRating = results[0];
    }
    if (apiBrandRating) {
      console.log('[Rewoven] Brand rating from API:', apiBrandRating.name, apiBrandRating.grade);
    }
  } catch (err) {
    console.warn('[Rewoven] Brand rating fetch failed (graceful degradation):', err);
  }

  // Score locally — the engine is pure/synchronous, so there's no need to
  // round-trip to the service worker (which can be asleep in MV3).
  const result = scoreProduct(product);

  // NOTHING-REAL GATE — only show the overlay if we actually have real data:
  // a detected material composition OR a real brand rating from the API.
  // Prevents an empty/invented card.
  if (!result.materialsKnown && !apiBrandRating) {
    console.log('[Rewoven] No material composition or brand rating — skipping.');
    removeOverlay();
    return;
  }

  createOverlay(result, product, apiBrandRating);
}

function onUrlChange(force = false) {
  const newUrl = window.location.href;
  if (!force && newUrl === currentUrl) return;
  currentUrl = newUrl;
  isActive = false;

  // Debounce to let the new view settle.
  if (scrapeTimeout) clearTimeout(scrapeTimeout);
  scrapeTimeout = setTimeout(tryScrapePage, 1200);
}

// Initial scrape once the page settles.
setTimeout(tryScrapePage, 1200);

// ─── SPA navigation detection ────────────────────────────────────────
// Content scripts run in an isolated world, so we can't reliably intercept the
// page's own history.pushState. Instead we react to the signals we CAN observe
// — and onUrlChange() is a no-op when the URL is unchanged, so all of this is
// effectively free (no scraping happens until the URL actually changes).
const fireNav = () => onUrlChange();
window.addEventListener('popstate', fireNav);
window.addEventListener('hashchange', fireNav);

// Most SPA route changes update the document title — observe it (cheap).
const titleEl = document.querySelector('title');
if (titleEl) {
  new MutationObserver(fireNav).observe(titleEl, { childList: true, characterData: true, subtree: true });
}

// Catch-all for SPA routes that change nothing observable above. This only does
// a string comparison of location.href every 2s — negligible cost, and it never
// triggers work unless the URL genuinely changed.
setInterval(fireNav, 2000);
