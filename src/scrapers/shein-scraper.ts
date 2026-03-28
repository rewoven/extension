import { BaseScraper } from './base-scraper';
import type { ScrapedProduct } from '../shared/types';

export class SheinScraper extends BaseScraper {
  retailerName = 'SHEIN';

  isProductPage(): boolean {
    return !!(
      document.querySelector('.product-intro') ||
      document.querySelector('[class*="product-intro"]') ||
      window.location.pathname.includes('-p-')
    );
  }

  extract(): ScrapedProduct | null {
    const jsonLd = this.getJsonLd();

    const name =
      jsonLd?.name ||
      document.querySelector('.product-intro__head-name, h1[class*="product"]')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() ||
      '';

    if (!name) return null;

    let price = 0;
    let currency = 'USD';

    if (jsonLd?.offers) {
      const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
      price = parseFloat(offer.price || '0');
      currency = offer.priceCurrency || 'USD';
    } else {
      const priceEl = document.querySelector(
        '.product-intro__head-mainprice, [class*="original-price"], .from.original'
      );
      if (priceEl) {
        const parsed = this.parsePrice(priceEl.textContent || '');
        price = parsed.price;
        currency = parsed.currency;
      }
    }

    const materials = this.extractMaterials();

    return {
      name,
      price,
      currency,
      materials,
      brand: 'SHEIN',
      category: this.detectCategory(name),
      imageUrl: jsonLd?.image?.[0] || document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined,
      url: window.location.href,
    };
  }

  private extractMaterials() {
    // SHEIN shows materials in product description section
    const selectors = [
      '.product-intro__description-table',
      '[class*="product-intro__description"]',
      '.product-middle-info',
      '[class*="description"]',
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
