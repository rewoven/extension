import { BaseScraper } from './base-scraper';
import type { ScrapedProduct } from '../shared/types';

export class NikeScraper extends BaseScraper {
  retailerName = 'Nike';

  isProductPage(): boolean {
    return !!(
      document.querySelector('[data-test="product-title"]') ||
      document.querySelector('#pdp_product_title') ||
      window.location.pathname.includes('/t/')
    );
  }

  extract(): ScrapedProduct | null {
    // Nike uses Next.js - try __NEXT_DATA__
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
      // Nike's structure varies; try common paths
      const product =
        props?.product || props?.productData || props?.initialState?.Threads?.products?.[0];

      if (!product) return null;

      const name = product.title || product.name || '';
      const price = parseFloat(product.currentPrice || product.price?.currentPrice || '0');

      let materialText = product.description || '';
      if (product.descriptionBody) materialText += ' ' + product.descriptionBody;

      const materials = this.parseMaterialString(materialText);

      return {
        name,
        price,
        currency: 'USD',
        materials,
        brand: 'Nike',
        category: this.detectCategory(name + ' ' + (product.subtitle || '')),
        imageUrl: product.images?.portraitURL || product.images?.[0]?.url || undefined,
        url: window.location.href,
      };
    } catch {
      return null;
    }
  }

  private extractFromDom(): ScrapedProduct | null {
    const name =
      document.querySelector('[data-test="product-title"], #pdp_product_title, h1')?.textContent?.trim() || '';
    if (!name) return null;

    const priceEl = document.querySelector(
      '[data-test="product-price"], .product-price, [class*="currentPrice"]'
    );
    const { price, currency } = priceEl ? this.parsePrice(priceEl.textContent || '') : { price: 0, currency: 'USD' };

    // Nike shows materials in product description
    const descEl = document.querySelector(
      '[class*="description-preview"], .product-description, [data-test="product-description"]'
    );
    const materials = descEl ? this.parseMaterialString(descEl.textContent || '') : [];

    return {
      name,
      price,
      currency,
      materials,
      brand: 'Nike',
      category: this.detectCategory(name),
      url: window.location.href,
    };
  }
}
