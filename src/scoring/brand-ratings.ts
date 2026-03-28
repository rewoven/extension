import type { BrandInfo } from '../shared/types';

// Brand sustainability ratings based on public indices
// Rating: 1 (worst) to 5 (best)
const BRAND_DATABASE: Record<string, BrandInfo> = {
  // Fast fashion - generally poor
  zara: {
    name: 'Zara',
    rating: 2.5,
    highlights: ['Join Life sustainable collection', 'Committed to zero waste by 2025'],
    concerns: ['Fast fashion model encourages overconsumption', 'Limited transparency on supply chain wages'],
  },
  'h&m': {
    name: 'H&M',
    rating: 2.5,
    highlights: ['Conscious Collection uses sustainable materials', 'Garment collecting program'],
    concerns: ['Greenwashing allegations', 'Fast fashion volumes remain high'],
  },
  shein: {
    name: 'SHEIN',
    rating: 1,
    highlights: ['Some recycled packaging efforts'],
    concerns: ['Ultra-fast fashion with extreme overproduction', 'Very poor supply chain transparency', 'Low quality encourages disposal'],
  },
  boohoo: {
    name: 'Boohoo',
    rating: 1,
    highlights: [],
    concerns: ['Poor labor practices documented', 'Ultra-fast fashion model', 'Low garment quality'],
  },
  prettylittlething: {
    name: 'PrettyLittleThing',
    rating: 1,
    highlights: [],
    concerns: ['Ultra-fast fashion model', 'Owned by Boohoo Group', 'Very low prices suggest poor wages'],
  },
  fashionnova: {
    name: 'Fashion Nova',
    rating: 1,
    highlights: [],
    concerns: ['No public sustainability policy', 'Fast fashion model', 'Poor supply chain transparency'],
  },
  forever21: {
    name: 'Forever 21',
    rating: 1.5,
    highlights: ['Some sustainability initiatives announced'],
    concerns: ['History of labor violations', 'Fast fashion business model', 'Low quality garments'],
  },

  // Mid-range
  nike: {
    name: 'Nike',
    rating: 3,
    highlights: ['Move to Zero campaign', 'Significant use of recycled polyester', 'Nike Refurbished program'],
    concerns: ['Still relies heavily on synthetic materials', 'Overproduction concerns'],
  },
  gap: {
    name: 'Gap',
    rating: 2.5,
    highlights: ['Water quality program', 'Some organic cotton usage'],
    concerns: ['Limited sustainability progress', 'Supply chain transparency gaps'],
  },
  uniqlo: {
    name: 'Uniqlo',
    rating: 2.5,
    highlights: ['RE.UNIQLO recycling program', 'LifeWear concept promotes longevity'],
    concerns: ['Limited organic/recycled material usage', 'Supply chain concerns in some regions'],
  },
  mango: {
    name: 'Mango',
    rating: 2.5,
    highlights: ['Committed Collection with sustainable materials', 'Joined Fashion Pact'],
    concerns: ['Still fast fashion pace', 'Sustainability collection is small fraction'],
  },
  asos: {
    name: 'ASOS',
    rating: 2,
    highlights: ['Responsible Edit collection', 'Published sustainability goals'],
    concerns: ['Sells many fast fashion brands', 'Marketplace model limits control'],
  },
  urbanoutfitters: {
    name: 'Urban Outfitters',
    rating: 2,
    highlights: ['Urban Renewal upcycled collection'],
    concerns: ['Limited sustainability reporting', 'Poor transparency scores'],
  },
  nordstrom: {
    name: 'Nordstrom',
    rating: 2.5,
    highlights: ['Sustainable Style section', 'Carries ethical brands'],
    concerns: ['Department store model means mixed sustainability', 'Own brands lack transparency'],
  },

  // Sustainable brands (for alternatives)
  patagonia: {
    name: 'Patagonia',
    rating: 5,
    highlights: ['1% for the Planet', 'Worn Wear repair program', 'Fair Trade certified', 'Organic and recycled materials'],
    concerns: [],
  },
  everlane: {
    name: 'Everlane',
    rating: 3.5,
    highlights: ['Radical Transparency pricing', 'ReNew recycled collection'],
    concerns: ['Some greenwashing claims contested', 'Internal culture issues reported'],
  },
  reformation: {
    name: 'Reformation',
    rating: 4,
    highlights: ['Carbon neutral', 'Deadstock and sustainable fabrics', 'Detailed sustainability tracking'],
    concerns: ['Higher price point limits accessibility'],
  },
  'eileen fisher': {
    name: 'Eileen Fisher',
    rating: 4.5,
    highlights: ['Renew take-back program', 'Organic and sustainable fibers', 'Vision2020 goals'],
    concerns: ['Premium pricing'],
  },
  tentree: {
    name: 'tentree',
    rating: 4,
    highlights: ['Plants 10 trees per purchase', 'Sustainable materials focus', 'B Corp certified'],
    concerns: [],
  },
  pangaia: {
    name: 'PANGAIA',
    rating: 4,
    highlights: ['Bio-based materials research', 'Seaweed fiber technology', 'Recycled materials'],
    concerns: ['Premium pricing', 'Relatively new brand'],
  },
};

export function getBrandRating(brand: string): BrandInfo | undefined {
  const key = brand.toLowerCase().replace(/[^a-z0-9&]/g, '');
  // Direct match
  if (BRAND_DATABASE[key]) return BRAND_DATABASE[key];
  // Partial match
  for (const [dbKey, info] of Object.entries(BRAND_DATABASE)) {
    if (key.includes(dbKey) || dbKey.includes(key)) return info;
  }
  return undefined;
}

export function getBrandModifier(brand: string): number {
  const info = getBrandRating(brand);
  if (!info) return 0;
  // Rating 1-5 maps to modifier +10 to -10
  return (3 - info.rating) * 5;
}
