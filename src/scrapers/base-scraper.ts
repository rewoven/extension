import type { ScrapedProduct, MaterialComposition, GarmentCategory } from '../shared/types';
import { normalizeFiber } from '../scoring/material-database';

export abstract class BaseScraper {
  abstract retailerName: string;

  abstract isProductPage(): boolean;
  abstract extract(): ScrapedProduct | null;

  // Utility: parse "60% Cotton, 40% Polyester" style strings
  protected parseMaterialString(text: string): MaterialComposition[] {
    const materials: MaterialComposition[] = [];
    // Match patterns like "60% Cotton", "100% organic cotton", etc.
    const regex = /(\d+(?:\.\d+)?)\s*%\s*([A-Za-z\s/()-]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const percentage = parseFloat(match[1]);
      const fiberRaw = match[2].trim();
      const fiber = normalizeFiber(fiberRaw);
      const qualifier = this.extractQualifier(fiberRaw);

      materials.push({ fiber, percentage, ...(qualifier && { qualifier }) });
    }

    return materials;
  }

  private extractQualifier(raw: string): string | undefined {
    const lower = raw.toLowerCase();
    if (lower.includes('recycled')) return 'recycled';
    if (lower.includes('organic')) return 'organic';
    if (lower.includes('bci')) return 'BCI';
    return undefined;
  }

  // Utility: detect garment category from product name/breadcrumb
  protected detectCategory(text: string): GarmentCategory {
    const lower = text.toLowerCase();

    const categoryMap: [string[], GarmentCategory][] = [
      [['jacket', 'coat', 'parka', 'blazer', 'hoodie', 'cardigan', 'sweater', 'vest', 'puffer'], 'outerwear'],
      [['jean', 'jeans', 'trouser', 'pants', 'pant', 'shorts', 'skirt', 'legging'], 'bottom'],
      [['dress', 'gown', 'romper', 'jumpsuit'], 'dress'],
      [['shoe', 'shoes', 'sneaker', 'boot', 'sandal', 'heel', 'loafer', 'trainer'], 'footwear'],
      [['bra', 'underwear', 'brief', 'boxer', 'sock', 'socks', 'undershirt'], 'underwear'],
      [['bikini', 'swimsuit', 'swim', 'trunks'], 'swimwear'],
      [['bag', 'hat', 'cap', 'scarf', 'belt', 'glove', 'wallet', 'sunglasses', 'watch', 'jewelry'], 'accessory'],
      [['sport', 'athletic', 'yoga', 'running', 'gym', 'workout'], 'activewear'],
      [['t-shirt', 'tee', 'shirt', 'blouse', 'top', 'polo', 'tank', 'camisole', 'crop'], 'top'],
    ];

    for (const [keywords, category] of categoryMap) {
      if (keywords.some((kw) => lower.includes(kw))) return category;
    }

    return 'unknown';
  }

  // Utility: extract price from text
  protected parsePrice(text: string): { price: number; currency: string } {
    // Match various price formats: $29.99, £19.99, €24.99, AED 99, 29,99€
    const match = text.match(/([£$€])\s*([\d,]+\.?\d*)/);
    if (match) {
      const currencyMap: Record<string, string> = { $: 'USD', '£': 'GBP', '€': 'EUR' };
      return {
        price: parseFloat(match[2].replace(',', '')),
        currency: currencyMap[match[1]] || 'USD',
      };
    }

    // Try reversed format: 29,99 €
    const match2 = text.match(/([\d,]+\.?\d*)\s*([£$€])/);
    if (match2) {
      const currencyMap: Record<string, string> = { $: 'USD', '£': 'GBP', '€': 'EUR' };
      return {
        price: parseFloat(match2[1].replace(',', '.')),
        currency: currencyMap[match2[2]] || 'EUR',
      };
    }

    // AED format
    const match3 = text.match(/(?:AED|SAR|KWD)\s*([\d,]+\.?\d*)/);
    if (match3) {
      return { price: parseFloat(match3[1].replace(',', '')), currency: 'AED' };
    }

    return { price: 0, currency: 'USD' };
  }

  // Try to get product data from JSON-LD
  protected getJsonLd(): any | null {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type'] === 'Product') return data;
        if (Array.isArray(data)) {
          const product = data.find((d: any) => d['@type'] === 'Product');
          if (product) return product;
        }
        if (data['@graph']) {
          const product = data['@graph'].find((d: any) => d['@type'] === 'Product');
          if (product) return product;
        }
      } catch {}
    }
    return null;
  }
}
