import { BaseScraper } from './base-scraper';
import type { ScrapedProduct } from '../shared/types';

export class AmazonScraper extends BaseScraper {
  retailerName = 'Amazon';

  isProductPage(): boolean {
    return !!(
      document.getElementById('productTitle') ||
      /\/(dp|gp\/product)\//.test(window.location.pathname)
    );
  }

  extract(): ScrapedProduct | null {
    const name = (document.getElementById('productTitle')?.textContent || '').trim();
    if (!name) return null;

    const department = this.departmentText();
    const brand = this.extractBrand();
    const materials = this.extractMaterials();
    const { price, currency } = this.extractPrice();

    const imageUrl =
      (document.getElementById('landingImage') as HTMLImageElement | null)?.src ||
      document.querySelector('#imgTagWrapperId img')?.getAttribute('src') ||
      undefined;

    return {
      name,
      price,
      currency,
      materials,
      brand,
      category: this.detectCategory(`${name} ${department}`),
      imageUrl,
      url: window.location.href,
    };
  }

  private departmentText(): string {
    const bc = document.getElementById('wayfinding-breadcrumbs_feature_div');
    return (bc?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  private overviewRows(): { label: string; value: string; text: string }[] {
    const out: { label: string; value: string; text: string }[] = [];
    document.querySelectorAll('#productOverview_feature_div tr').forEach((r) => {
      const tds = r.querySelectorAll('td');
      out.push({
        label: (tds[0]?.textContent || '').trim().toLowerCase(),
        value: (tds[1]?.textContent || '').trim(),
        text: (r.textContent || '').trim(),
      });
    });
    return out;
  }

  private extractBrand(): string {
    for (const row of this.overviewRows()) {
      if (row.label.includes('brand') && row.value) return row.value;
    }
    const byline = (document.getElementById('bylineInfo')?.textContent || '').trim();
    if (byline) {
      let m = byline.match(/visit the (.+?) store/i);
      if (m) return m[1].trim();
      m = byline.match(/brand:\s*(.+)/i);
      if (m) return m[1].trim();
      return byline.replace(/^by\s+/i, '').trim();
    }
    return 'Unknown';
  }

  private extractMaterials() {
    const sources: string[] = [];
    for (const row of this.overviewRows()) {
      if (/fabric|material|composition|shell|outer/.test(row.label)) sources.push(row.text);
    }
    [
      '#detailBullets_feature_div',
      '#productDetails_techSpec_section_1',
      '#productDetails_detailBullets_sections1',
      '#productFactsDesktopExpander',
      '#feature-bullets',
    ].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) sources.push(el.textContent || '');
    });

    for (const text of sources) {
      const mats = this.parseMaterialString(text);
      if (mats.length > 0) return mats;
    }
    return [];
  }

  private extractPrice(): { price: number; currency: string } {
    const el =
      document.querySelector('#corePriceDisplay_desktop_feature_div .a-price .a-offscreen') ||
      document.querySelector('#corePrice_feature_div .a-price .a-offscreen') ||
      document.querySelector('.a-price .a-offscreen');
    if (el) return this.parsePrice(el.textContent || '');
    return { price: 0, currency: 'USD' };
  }
}
