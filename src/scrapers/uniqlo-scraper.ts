import { BaseScraper } from './base-scraper';
import type { ScrapedProduct } from '../shared/types';

export class UniqloScraper extends BaseScraper {
  retailerName = 'Uniqlo';

  isProductPage(): boolean {
    return !!(
      document.querySelector('[class*="pdp-"]') ||
      document.querySelector('#productSingle') ||
      window.location.pathname.includes('/products/')
    );
  }

  extract(): ScrapedProduct | null {
    // Uniqlo uses Next.js
    const nextData = this.getNextData();
    if (nextData) {
      const result = this.extractFromNextData(nextData);
      if (result) return result;
    }

    return this.extractFromDom();
  }

  private getNextData(): any | null {
    const script = document.querySelector('#__NEXT_DATA__');
    if (!script) return null;
    try {
      return JSON.parse(script.textContent || '');
    } catch {
      return null;
    }
  }

  private extractFromNextData(data: any): ScrapedProduct | null {
    try {
      const props = data.props?.pageProps;
      const product = props?.product || props?.productData;
      if (!product) return null;

      const name = product.name || product.title || '';
      const price = parseFloat(product.prices?.base?.value || product.price || '0');
      const currency = product.prices?.base?.currency || 'USD';

      let materialText = product.composition || product.materialDescription || '';
      if (product.longDescription) materialText += ' ' + product.longDescription;

      const materials = this.parseMaterialString(materialText);

      return {
        name,
        price,
        currency,
        materials,
        brand: 'Uniqlo',
        category: this.detectCategory(name),
        imageUrl: product.images?.main?.[0]?.url || undefined,
        url: window.location.href,
      };
    } catch {
      return null;
    }
  }

  private extractFromDom(): ScrapedProduct | null {
    const name = document.querySelector('h1, [class*="pdp-title"]')?.textContent?.trim() || '';
    if (!name) return null;

    const priceEl = document.querySelector('[class*="pdp-price"], .product-price, [class*="price-amount"]');
    const { price, currency } = priceEl ? this.parsePrice(priceEl.textContent || '') : { price: 0, currency: 'USD' };

    // Uniqlo shows material in accordion
    const selectors = [
      '[class*="material"], [class*="composition"]',
      '.product-description',
      '[data-test*="material"]',
    ];

    let materials: any[] = [];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        materials = this.parseMaterialString(el.textContent || '');
        if (materials.length > 0) break;
      }
    }

    return {
      name,
      price,
      currency,
      materials,
      brand: 'Uniqlo',
      category: this.detectCategory(name),
      url: window.location.href,
    };
  }
}
