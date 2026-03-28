import type { FiberType, GarmentCategory, Alternative } from '../shared/types';

interface AlternativeRule {
  badFibers: FiberType[];
  suggestion: string;
  brands: { name: string; reason: string; url?: string }[];
}

const ALTERNATIVE_RULES: AlternativeRule[] = [
  {
    badFibers: ['polyester'],
    suggestion: 'Consider items made from recycled polyester or natural fibers',
    brands: [
      { name: 'Patagonia', reason: 'Uses recycled polyester extensively', url: 'https://www.patagonia.com' },
      { name: 'tentree', reason: 'Sustainable natural fibers', url: 'https://www.tentree.com' },
    ],
  },
  {
    badFibers: ['nylon'],
    suggestion: 'Look for recycled nylon (ECONYL) alternatives',
    brands: [
      { name: 'Girlfriend Collective', reason: 'Made from recycled materials', url: 'https://girlfriend.com' },
      { name: 'Patagonia', reason: 'Uses NetPlus recycled nylon', url: 'https://www.patagonia.com' },
    ],
  },
  {
    badFibers: ['cotton'],
    suggestion: 'Organic or recycled cotton has 50-80% less environmental impact',
    brands: [
      { name: 'PACT', reason: 'Organic cotton basics', url: 'https://wearpact.com' },
      { name: 'Kotn', reason: 'Egyptian organic cotton essentials', url: 'https://kotn.com' },
    ],
  },
  {
    badFibers: ['acrylic'],
    suggestion: 'Acrylic sheds microplastics — consider wool, cotton, or Tencel',
    brands: [
      { name: 'Eileen Fisher', reason: 'Organic and sustainable knitwear', url: 'https://www.eileenfisher.com' },
      { name: 'Reformation', reason: 'Sustainable fabric choices', url: 'https://www.thereformation.com' },
    ],
  },
  {
    badFibers: ['viscose', 'rayon'],
    suggestion: 'Tencel/Lyocell is a more sustainable alternative to viscose',
    brands: [
      { name: 'PANGAIA', reason: 'Bio-based and Tencel fabrics', url: 'https://thepangaia.com' },
      { name: 'Reformation', reason: 'Uses Tencel extensively', url: 'https://www.thereformation.com' },
    ],
  },
  {
    badFibers: ['faux_leather'],
    suggestion: 'Look for plant-based leather alternatives (cactus, mushroom, apple leather)',
    brands: [
      { name: 'Stella McCartney', reason: 'Pioneer in vegan luxury fashion', url: 'https://www.stellamccartney.com' },
      { name: 'Matt & Nat', reason: 'Vegan bags with recycled linings', url: 'https://mattandnat.com' },
    ],
  },
];

// General sustainable brands by category
const CATEGORY_ALTERNATIVES: Partial<Record<GarmentCategory, Alternative[]>> = {
  top: [
    { brandName: 'Everlane', reason: 'Transparent pricing, quality basics' },
    { brandName: 'PACT', reason: 'Organic cotton essentials' },
  ],
  bottom: [
    { brandName: 'Nudie Jeans', reason: 'Organic denim with free repairs' },
    { brandName: 'Outerknown', reason: 'Sustainable materials, Fair Trade' },
  ],
  outerwear: [
    { brandName: 'Patagonia', reason: 'Recycled materials, lifetime repairs' },
    { brandName: 'The North Face Renewed', reason: 'Refurbished outerwear' },
  ],
  activewear: [
    { brandName: 'Girlfriend Collective', reason: 'Recycled materials activewear' },
    { brandName: 'prAna', reason: 'Fair Trade, sustainable fabrics' },
  ],
  dress: [
    { brandName: 'Reformation', reason: 'Sustainable fabrics, carbon neutral' },
    { brandName: 'Christy Dawn', reason: 'Deadstock and regenerative fabrics' },
  ],
};

export function getAlternatives(
  materials: { fiber: FiberType; percentage: number }[],
  category: GarmentCategory
): Alternative[] {
  const alternatives: Alternative[] = [];
  const seen = new Set<string>();

  // Check material-specific rules
  for (const rule of ALTERNATIVE_RULES) {
    const hasBadFiber = materials.some(
      (m) => rule.badFibers.includes(m.fiber) && m.percentage >= 20
    );
    if (hasBadFiber) {
      for (const brand of rule.brands) {
        if (!seen.has(brand.name)) {
          seen.add(brand.name);
          alternatives.push({
            brandName: brand.name,
            reason: brand.reason,
            url: brand.url,
          });
        }
      }
    }
  }

  // Add category-specific alternatives if we don't have enough
  if (alternatives.length < 3 && CATEGORY_ALTERNATIVES[category]) {
    for (const alt of CATEGORY_ALTERNATIVES[category]!) {
      if (!seen.has(alt.brandName) && alternatives.length < 3) {
        seen.add(alt.brandName);
        alternatives.push(alt);
      }
    }
  }

  return alternatives.slice(0, 3);
}

export function getTips(
  materials: { fiber: FiberType; percentage: number }[],
  score: number
): string[] {
  const tips: string[] = [];

  const hasSynthetics = materials.some(
    (m) => ['polyester', 'nylon', 'acrylic'].includes(m.fiber) && m.percentage >= 30
  );
  if (hasSynthetics) {
    tips.push('🔬 Wash synthetic fabrics in a microplastic-catching bag to reduce ocean pollution');
  }

  if (score > 50) {
    tips.push('💡 Consider buying secondhand — apps like Depop, ThredUp, and Poshmark have similar styles');
  }

  if (score < 30) {
    tips.push('✅ Great material choice! Take care of this garment to maximize its lifespan');
  }

  tips.push('♻️ When done, donate or recycle — most textiles can have a second life');

  return tips.slice(0, 3);
}
