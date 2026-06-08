

import type { ScrapedProduct } from '../shared/types';
import { isKnownFashionDomain } from '../api/brand-detector';

const CLOTHING_CATEGORIES = new Set([
  'top', 'bottom', 'dress', 'outerwear', 'activewear', 'footwear', 'underwear', 'swimwear',
]);

const GENERAL_MARKETPLACES = [
  'amazon.', 'walmart.com', 'target.com', 'ebay.', 'etsy.com', 'aliexpress.', 'wish.com',
];

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

function containsWord(haystack: string, words: string[]): boolean {
  for (const w of words) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^a-z0-9])${esc}(?:[^a-z0-9]|$)`, 'i').test(haystack)) return true;
  }
  return false;
}

function collectCategoryStrings(node: any, out: string[], depth = 0): void {
  if (!node || depth > 4) return;
  if (typeof node === 'string') { out.push(node); return; }
  if (Array.isArray(node)) { node.forEach((n) => collectCategoryStrings(n, out, depth + 1)); return; }
  if (typeof node === 'object') {
    if (node.category) collectCategoryStrings(node.category, out, depth + 1);
    if (node['@type']) out.push(String(node['@type']));
    if (node.name && depth > 0) out.push(String(node.name));
    if (node.itemListElement) collectCategoryStrings(node.itemListElement, out, depth + 1);
    if (node.item) collectCategoryStrings(node.item, out, depth + 1);
    if (node['@graph']) collectCategoryStrings(node['@graph'], out, depth + 1);
  }
}

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

export function isApparelContext(product: ScrapedProduct, hostname: string): boolean {
  const fashionOnly = isKnownFashionDomain(hostname) && !isGeneralMarketplace(hostname);
  const hasTextiles = product.materials.some((m) => m.fiber !== 'unknown');
  const clothingCategory = CLOTHING_CATEGORIES.has(product.category);
  const { apparel, nonApparel } = pageTextSignals();
  const strongClothing = clothingCategory || apparel;

  if (nonApparel && !apparel && !hasTextiles) return false;

  if (strongClothing) return true;

  if (hasTextiles && fashionOnly) return true;

  return false;
}
