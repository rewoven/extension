import { BaseScraper } from './base-scraper';
import type { ScrapedProduct } from '../shared/types';

export class AsosScraper extends BaseScraper {
  retailerName = 'ASOS';

  isProductPage(): boolean {
    return !!(
      document.querySelector('[data-test-id="product-hero"]') ||
      document.querySelector('#product-details') ||
      window.location.pathname.includes('/prd/')
    );
  }

  extract(): ScrapedProduct | null {
    const jsonLd = this.getJsonLd();

    const name =
      jsonLd?.name ||
      document.querySelector('[data-test-id="product-hero"] h1, .product-hero h1, h1')?.textContent?.trim() ||
      '';

    if (!name) return null;

    let price = 0;
    let currency = 'GBP';

    if (jsonLd?.offers) {
      const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
      price = parseFloat(offer.price || '0');
      currency = offer.priceCurrency || 'GBP';
    } else {
      const priceEl = document.querySelector('[data-test-id*="current-price"], .product-price span');
      if (priceEl) {
        const parsed = this.parsePrice(priceEl.textContent || '');
        price = parsed.price;
        currency = parsed.currency;
      }
    }

    // ASOS puts material info in product details / about me section
    const materials = this.extractMaterials();

    // Extract brand from breadcrumb or product info
    const brand =
      document.querySelector('[data-test-id="product-brand-link"], [class*="brand-link"]')?.textContent?.trim() ||
      'ASOS';

    return {
      name,
      price,
      currency,
      materials,
      brand,
      category: this.detectCategory(name),
      imageUrl: jsonLd?.image?.[0] || document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined,
      url: window.location.href,
    };
  }

  private extractMaterials() {
    // ASOS puts material info in product details accordion
    const selectors = [
      '[data-test-id="product-details-content"]',
      '.product-description',
      '#product-details',
      '[class*="product-details"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent || '';
        const materials = this.parseMaterialString(text);
        if (materials.length > 0) return materials;
      }
    }

    return [];
  }
}
