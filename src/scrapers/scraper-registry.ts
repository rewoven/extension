import { BaseScraper } from './base-scraper';
import { GenericScraper } from './generic-scraper';
import { ZaraScraper } from './zara-scraper';
import { HmScraper } from './hm-scraper';
import { AsosScraper } from './asos-scraper';
import { NikeScraper } from './nike-scraper';
import { SheinScraper } from './shein-scraper';
import { UniqloScraper } from './uniqlo-scraper';

interface ScraperEntry {
  patterns: string[];
  Scraper: new () => BaseScraper;
}

const REGISTRY: ScraperEntry[] = [
  { patterns: ['zara.com'], Scraper: ZaraScraper },
  { patterns: ['hm.com', 'www2.hm.com'], Scraper: HmScraper },
  { patterns: ['asos.com'], Scraper: AsosScraper },
  { patterns: ['nike.com'], Scraper: NikeScraper },
  { patterns: ['shein.com'], Scraper: SheinScraper },
  { patterns: ['uniqlo.com'], Scraper: UniqloScraper },
];

export function getScraperForSite(): BaseScraper {
  const hostname = window.location.hostname.toLowerCase();

  for (const entry of REGISTRY) {
    if (entry.patterns.some((p) => hostname.includes(p))) {
      return new entry.Scraper();
    }
  }

  return new GenericScraper();
}
