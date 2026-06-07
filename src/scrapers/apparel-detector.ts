/**
 * Apparel gate — decides whether the current page is actually a clothing /
 * fashion product before the Shopping Lens shows anything.
 *
 * This is what stops the overlay from appearing on non-fashion pages such as
 * apple.com, and — crucially — on the non-clothing aisles of general
 * marketplaces like Amazon/Walmart (electronics, books, groceries, furniture).
 * We require a positive apparel signal; ambiguous or non-apparel pages are
 * skipped. Precision is favoured over recall by design.
 */

import type { ScrapedProduct } from '../shared/types';
import { isKnownFashionDomain } from '../api/brand-detector';

// Garment categories that, on their own, are strong evidence of clothing.
// 'accessory' is intentionally excluded — "watch"/"bag" match electronics and
// other goods (e.g. Apple Watch) and are too weak alone.
const CLOTHING_CATEGORIES = new Set([
  'top', 'bottom', 'dress', 'outerwear', 'activewear', 'footwear', 'underwear', 'swimwear',
]);

// General marketplaces sell every category, so being on one is NOT evidence of
// clothing — we require an explicit apparel signal there.
const GENERAL_MARKETPLACES = [
  'amazon.', 'walmart.com', 'target.com', 'ebay.', 'etsy.com', 'aliexpress.', 'wish.com',
];

// Specific apparel terms (generic words like "fashion"/"cloth" are excluded —
// they collide with "fashion seating", "tablecloth", etc.). Matched as whole
// words only.
const APPAREL_KEYWORDS = [
  'clothing', 'apparel', 'menswear', 'womenswear', 'kidswear', 'footwear', 'shoe', 'shoes',
  'sneaker', 'sneakers', 'dress', 'dresses', 'shirt', 't-shirt', 'tshirt', 'jacket', 'coat',
  'jeans', 'denim', 'trouser', 'trousers', 'knitwear', 'sweater', 'jumper', 'hoodie', 'activewear',
  'sportswear', 'lingerie', 'underwear', 'swimwear', 'outerwear', 'skirt', 'blouse', 'loungewear',
  'pajamas', 'pyjamas', 'socks', 'leggings',
];

const NON_APPAREL_KEYWORDS = [
  'electronics', 'computer', 'laptop', 'tablet', 'smartphone', 'cell phone', 'camera',
  'television', 'appliance', 'kitchen', 'software', 'grocery', 'furniture', 'sofa', 'mattress',
  'bedding', 'towel', 'rug', 'curtain', 'upholstery', 'automotive', 'car seat', 'video game',
  'console', 'headphone', 'speaker', 'book', 'books', 'toy', 'toys', 'tool', 'tools', 'garden',
  'wallpaper', 'decor', 'paint', 'flooring', 'lighting', 'stationery', 'cosmetics',
];

/** Whole-word match (avoids "dress" matching "dresser", "tee" matching "canteen"). */
function containsWord(haystack: string, words: string[]): boolean {
  for (const w of words) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^a-z0-9])${esc}(?:[^a-z0-9]|$)`, 'i').test(haystack)) return true;
  }
  return false;
}

/** Pull category-ish strings out of a JSON-LD node (string | array | nested). */
function collectCategoryStrings(node: any, out: string[], depth = 0): void {
  if (!node || depth > 4) return;
  if (typeof node === 'string') { out.push(node); return; }
  if (Array.isArray(node)) { node.forEach((n) => collectCategoryStrings(n, out, depth + 1)); return; }
  if (typeof node === 'object') {
    if (node.category) collectCategoryStrings(node.category, out, depth + 1);
    if (node['@type']) out.push(String(node['@type']));
    if (node.name && depth > 0) out.push(String(node.name)); // breadcrumb item names
    if (node.itemListElement) collectCategoryStrings(node.itemListElement, out, depth + 1);
    if (node.item) collectCategoryStrings(node.item, out, depth + 1);
    if (node['@graph']) collectCategoryStrings(node['@graph'], out, depth + 1);
  }
}

/** Scan breadcrumbs / JSON-LD categories / meta for apparel vs non-apparel hints. */
function pageTextSignals(): { apparel: boolean; nonApparel: boolean } {
  const hay: string[] = [];

  document
    .querySelectorAll('[class*="breadcrumb" i], nav[aria-label*="readcrumb" i], [itemtype*="BreadcrumbList"]')
    .forEach((el) => hay.push((el.textContent || '').toLowerCase()));

  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      const cats: string[] = [];
      collectCategoryStrings(JSON.parse(s.textContent || ''), cats);
      hay.push(cats.join(' ').toLowerCase());
    } catch {
      /* ignore malformed JSON-LD */
    }
  });

  const metaCat =
    document.querySelector('meta[property="product:category"]')?.getAttribute('content') ||
    document.querySelector('meta[name="category"]')?.getAttribute('content');
  if (metaCat) hay.push(metaCat.toLowerCase());

  const text = hay.join(' | ');
  return {
    apparel: containsWord(text, APPAREL_KEYWORDS),
    nonApparel: containsWord(text, NON_APPAREL_KEYWORDS),
  };
}

function isGeneralMarketplace(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return GENERAL_MARKETPLACES.some((d) => host.includes(d));
}

/**
 * Returns true only when we are confident the page is a clothing / footwear /
 * fashion product.
 *
 * Decision order:
 *  1. Explicit non-apparel context with no clothing evidence → HIDE.
 *  2. A clear garment signal (garment category or apparel breadcrumb) → SHOW.
 *  3. Textile composition alone counts only on a dedicated fashion store
 *     (not a general marketplace, where textiles also appear on towels, bags,
 *     furniture, etc.) → SHOW.
 *  4. Otherwise → HIDE.
 */
export function isApparelContext(product: ScrapedProduct, hostname: string): boolean {
  const fashionOnly = isKnownFashionDomain(hostname) && !isGeneralMarketplace(hostname);
  const hasTextiles = product.materials.some((m) => m.fiber !== 'unknown');
  const clothingCategory = CLOTHING_CATEGORIES.has(product.category);
  const { apparel, nonApparel } = pageTextSignals();
  const strongClothing = clothingCategory || apparel;

  // 1. Explicit non-apparel context wins unless there's a hard positive signal
  //    (an apparel breadcrumb keyword or a real textile composition). A garment
  //    category guessed from the product NAME alone (e.g. "Denim Wallpaper")
  //    does NOT override it.
  if (nonApparel && !apparel && !hasTextiles) return false;
  // 2. A clear garment signal → show.
  if (strongClothing) return true;
  // 3. Textile composition alone only counts on a dedicated fashion store.
  if (hasTextiles && fashionOnly) return true;
  // 4. Otherwise → hide.
  return false;
}
