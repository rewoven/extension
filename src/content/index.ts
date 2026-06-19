import { getScraperForSite } from '../scrapers/scraper-registry';
import { isApparelContext, isGeneralMarketplace } from '../scrapers/apparel-detector';
import type { UserSettings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { getHiddenSites, isSiteHidden } from '../shared/hidden-sites';
import { createOverlay, removeOverlay } from './overlay';
import { scoreProduct } from '../scoring/sustainability-engine';
import { detectBrandSlug } from '../api/brand-detector';
import { fetchBrandRating, searchBrand } from '../api/brand-client';
import type { BrandRating } from '../api/brand-client';

let currentUrl = window.location.href;
let scrapeTimeout: ReturnType<typeof setTimeout> | null = null;
let isActive = false;

let cachedSettings: UserSettings = DEFAULT_SETTINGS;
let settingsLoaded = false;

async function getSettings(): Promise<UserSettings> {
  if (settingsLoaded) return cachedSettings;
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get('settings', (data) => {

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

try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) {
      cachedSettings = { ...DEFAULT_SETTINGS, ...(changes.settings.newValue || {}) };
      settingsLoaded = true;
      if (!cachedSettings.enabled) {
        removeOverlay();
        return;
      }
      onUrlChange(true);
    }
  });
} catch {
}

async function tryScrapePage() {
  const hostname = window.location.hostname.toLowerCase();

  const hiddenSites = await getHiddenSites();
  if (isSiteHidden(hostname, hiddenSites)) {
    removeOverlay();
    return;
  }

  const settings = await getSettings();
  if (!settings.enabled) {
    removeOverlay();
    return;
  }

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

    if (!isActive) {
      isActive = true;
      if (scrapeTimeout) clearTimeout(scrapeTimeout);
      scrapeTimeout = setTimeout(tryScrapePage, 2000);
    }
    return;
  }

  if (!isApparelContext(product, hostname)) {
    console.log('[Rewoven] Not a clothing product - skipping:', product.name);
    removeOverlay();
    return;
  }

  if (product.materials.length === 0 && !isActive) {
    isActive = true;
    if (scrapeTimeout) clearTimeout(scrapeTimeout);
    scrapeTimeout = setTimeout(tryScrapePage, 2000);
    return;
  }

  isActive = true;
  console.log('[Rewoven] Apparel product detected:', product.name);
  console.log('[Rewoven] Materials:', product.materials);

  let apiBrandRating: BrandRating | null = null;
  try {
    const slug = detectBrandSlug(hostname);
    const onMarketplace = isGeneralMarketplace(hostname);

    if (onMarketplace && product.brand && product.brand !== 'Unknown') {
      const results = await searchBrand(product.brand);
      if (results.length > 0) apiBrandRating = results[0];
    }
    if (!apiBrandRating && slug) {
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

  const result = scoreProduct(product);

  if (!result.materialsKnown && !apiBrandRating) {
    console.log('[Rewoven] No material composition or brand rating - skipping.');
    removeOverlay();
    return;
  }

  createOverlay(result, product, apiBrandRating, settings.overlayPosition);
}

function onUrlChange(force = false) {
  const newUrl = window.location.href;
  if (!force && newUrl === currentUrl) return;
  currentUrl = newUrl;
  isActive = false;

  if (scrapeTimeout) clearTimeout(scrapeTimeout);
  scrapeTimeout = setTimeout(tryScrapePage, 1200);
}

async function init() {
  const hiddenSites = await getHiddenSites();
  if (isSiteHidden(window.location.hostname, hiddenSites)) return;

  setTimeout(tryScrapePage, 1200);

  const fireNav = () => onUrlChange();
  window.addEventListener('popstate', fireNav);
  window.addEventListener('hashchange', fireNav);

  const titleEl = document.querySelector('title');
  if (titleEl) {
    new MutationObserver(fireNav).observe(titleEl, { childList: true, characterData: true, subtree: true });
  }

  setInterval(fireNav, 2000);
}

init();
