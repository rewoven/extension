import { BaseScraper } from './base-scraper';
import type { ScrapedProduct } from '../shared/types';

export class ZaraScraper extends BaseScraper {
  retailerName = 'Zara';

  isProductPage(): boolean {
    return !!(
      document.querySelector('.product-detail-view') ||
      document.querySelector('[class*="product-detail"]') ||
      window.location.pathname.includes('-p')
    );
  }

  extract(): ScrapedProduct | null {

    const jsonLd = this.getJsonLd();

    const name =
      jsonLd?.name ||
      document.querySelector('.product-detail-info__header-name, h1[class*="product-detail"]')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() ||
      '';

    if (!name) return null;

    let price = 0;
    let currency = 'USD';

    if (jsonLd?.offers) {
      const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
      price = parseFloat(offer.price || offer.lowPrice || '0');
      currency = offer.priceCurrency || 'USD';
    } else {
      const priceEl = document.querySelector(
        '.money-amount__main, [class*="price"][class*="current"], .product-detail-info__price'
      );
      if (priceEl) {
        const parsed = this.parsePrice(priceEl.textContent || '');
        price = parsed.price;
        currency = parsed.currency;
      }
    }

    const materials = this.extractMaterials();

    const imageUrl =
      jsonLd?.image?.[0] ||
      document.querySelector('.media-image__image, .product-detail-image img')?.getAttribute('src') ||
      undefined;

    return {
      name,
      price,
      currency,
      materials,
      brand: 'Zara',
      category: this.detectCategory(name),
      imageUrl,
      url: window.location.href,
    };
  }

  private extractMaterials() {

    const selectors = [
      '.product-detail-extra-detail .structured-component-text',
      '[class*="product-detail-composition"]',
      '[class*="structured-component"] [class*="composition"]',
    ];

    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const text = el.textContent || '';
        if (text.match(/\d+\s*%/)) {
          const materials = this.parseMaterialString(text);
          if (materials.length > 0) return materials;
        }
      }
    }

    const detailSections = document.querySelectorAll(
      '.product-detail-extra-detail, [class*="product-detail-description"]'
    );
    for (const section of detailSections) {
      const text = section.textContent || '';
      const materials = this.parseMaterialString(text);
      if (materials.length > 0) return materials;
    }

    return [];
  }
}
