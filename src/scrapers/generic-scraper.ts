import { BaseScraper } from './base-scraper';
import type { ScrapedProduct } from '../shared/types';

export class GenericScraper extends BaseScraper {
  retailerName = 'Unknown';

  isProductPage(): boolean {
    // Check for common product page signals
    return !!(
      this.getJsonLd() ||
      document.querySelector('meta[property="og:type"][content="product"]') ||
      document.querySelector('[itemtype*="schema.org/Product"]') ||
      document.querySelector('[data-product-id]') ||
      document.querySelector('.product-detail, .product-page, .pdp-main, #product-detail')
    );
  }

  extract(): ScrapedProduct | null {
    // Try JSON-LD first
    const jsonLd = this.getJsonLd();
    if (jsonLd) return this.extractFromJsonLd(jsonLd);

    // Try meta tags + DOM scraping
    return this.extractFromDom();
  }

  private extractFromJsonLd(data: any): ScrapedProduct | null {
    const name = data.name || '';
    let price = 0;
    let currency = 'USD';

    if (data.offers) {
      const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
      price = parseFloat(offer.price || offer.lowPrice || '0');
      currency = offer.priceCurrency || 'USD';
    }

    // Try to find material composition in the page
    const materials = this.findMaterialsInPage();
    const brand = data.brand?.name || this.getBrandFromMeta() || 'Unknown';

    if (!name) return null;

    return {
      name,
      price,
      currency,
      materials,
      brand,
      category: this.detectCategory(name),
      imageUrl: data.image?.[0] || data.image || undefined,
      url: window.location.href,
    };
  }

  private extractFromDom(): ScrapedProduct | null {
    const name =
      document.querySelector('h1')?.textContent?.trim() ||
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      '';

    if (!name) return null;

    const priceEl =
      document.querySelector('[class*="price" i][class*="current" i], [class*="price" i][class*="sale" i], [class*="price" i]') ||
      document.querySelector('meta[property="product:price:amount"]');

    let price = 0;
    let currency = 'USD';

    if (priceEl) {
      if (priceEl.tagName === 'META') {
        price = parseFloat(priceEl.getAttribute('content') || '0');
        currency = document.querySelector('meta[property="product:price:currency"]')?.getAttribute('content') || 'USD';
      } else {
        const parsed = this.parsePrice(priceEl.textContent || '');
        price = parsed.price;
        currency = parsed.currency;
      }
    }

    const materials = this.findMaterialsInPage();
    const brand = this.getBrandFromMeta() || 'Unknown';

    return {
      name,
      price,
      currency,
      materials,
      brand,
      category: this.detectCategory(name),
      imageUrl: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined,
      url: window.location.href,
    };
  }

  protected findMaterialsInPage() {
    // Search for composition text in common locations
    const selectors = [
      '[class*="composition" i]',
      '[class*="material" i]',
      '[class*="fabric" i]',
      '[data-testid*="material"]',
      '[data-testid*="composition"]',
      '.product-description',
      '.product-details',
      '#product-details',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent || '';
        const materials = this.parseMaterialString(text);
        if (materials.length > 0) return materials;
      }
    }

    // Brute force: search all text on page for composition patterns
    const bodyText = document.body.innerText;
    const compositionMatch = bodyText.match(/(?:composition|material|fabric)[:\s]*([^.]*\d+\s*%[^.]*)/i);
    if (compositionMatch) {
      const materials = this.parseMaterialString(compositionMatch[1]);
      if (materials.length > 0) return materials;
    }

    return [];
  }

  private getBrandFromMeta(): string | null {
    return (
      document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
      document.querySelector('meta[name="author"]')?.getAttribute('content') ||
      null
    );
  }
}
