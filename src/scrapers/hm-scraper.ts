import { BaseScraper } from './base-scraper';
import type { ScrapedProduct } from '../shared/types';

export class HmScraper extends BaseScraper {
  retailerName = 'H&M';

  isProductPage(): boolean {
    return !!(
      document.querySelector('[class*="product-detail"]') ||
      document.querySelector('#product-detail') ||
      window.location.pathname.includes('productpage') ||
      window.location.pathname.match(/\.\d+\.html$/)
    );
  }

  extract(): ScrapedProduct | null {
    // H&M uses Next.js - try __NEXT_DATA__ first
    const nextData = this.getNextData();
    if (nextData) return this.extractFromNextData(nextData);

    // Fallback to DOM
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
      // Navigate H&M's Next.js data structure
      const props = data.props?.pageProps;
      const product = props?.product || props?.productData || props?.mainProduct;

      if (!product) return this.extractFromDom();

      const name = product.name || product.title || '';
      const price = parseFloat(product.price?.value || product.whitePrice?.price || '0');
      const currency = product.price?.currencyIso || 'USD';

      // H&M composition data
      let materials = this.parseMaterialString(
        product.compositions?.map((c: any) => c.materials?.map((m: any) => `${m.percentage}% ${m.name}`).join(', ')).join(', ') || ''
      );

      if (materials.length === 0 && product.materialDetails) {
        materials = this.parseMaterialString(
          product.materialDetails.map((m: any) => `${m.percentage}% ${m.name}`).join(', ')
        );
      }

      return {
        name,
        price,
        currency,
        materials,
        brand: 'H&M',
        category: this.detectCategory(name + ' ' + (product.categoryName || '')),
        imageUrl: product.images?.[0]?.url || undefined,
        url: window.location.href,
      };
    } catch {
      return this.extractFromDom();
    }
  }

  private extractFromDom(): ScrapedProduct | null {
    const name = document.querySelector('h1, [class*="product-item-headline"]')?.textContent?.trim() || '';
    if (!name) return null;

    const priceEl = document.querySelector('[class*="ProductPrice"], [class*="product-price"], .price');
    const { price, currency } = priceEl ? this.parsePrice(priceEl.textContent || '') : { price: 0, currency: 'USD' };

    // H&M composition section
    const materials = this.extractMaterials();

    return {
      name,
      price,
      currency,
      materials,
      brand: 'H&M',
      category: this.detectCategory(name),
      url: window.location.href,
    };
  }

  private extractMaterials() {
    const selectors = [
      '[class*="composition"]',
      '[class*="material"]',
      '.product-detail-facts',
      '[data-testid*="material"]',
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
    return [];
  }
}
