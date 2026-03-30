/**
 * Detect the brand from the current page URL / domain.
 * Maps common fashion retailer domains to their API slug.
 */

const DOMAIN_TO_SLUG: Record<string, string> = {
  // Fast fashion
  'zara.com': 'zara',
  'hm.com': 'h-m',
  'www2.hm.com': 'h-m',
  'shein.com': 'shein',
  'boohoo.com': 'boohoo',
  'prettylittlething.com': 'prettylittlething',
  'fashionnova.com': 'fashion-nova',
  'forever21.com': 'forever-21',
  'romwe.com': 'romwe',
  'zaful.com': 'zaful',
  'yesstyle.com': 'yesstyle',
  'cider.com': 'cider',
  'emmiol.com': 'emmiol',

  // Mid-range / high street
  'nike.com': 'nike',
  'adidas.com': 'adidas',
  'gap.com': 'gap',
  'oldnavy.com': 'old-navy',
  'bananarepublic.com': 'banana-republic',
  'uniqlo.com': 'uniqlo',
  'mango.com': 'mango',
  'asos.com': 'asos',
  'urbanoutfitters.com': 'urban-outfitters',
  'freepeople.com': 'free-people',
  'anthropologie.com': 'anthropologie',
  'nordstrom.com': 'nordstrom',
  'abercrombie.com': 'abercrombie-fitch',
  'hollisterco.com': 'hollister',
  'ae.com': 'american-eagle',
  'aerie.com': 'aerie',
  'target.com': 'target',
  'walmart.com': 'walmart',
  'amazon.com': 'amazon-fashion',
  'macys.com': 'macys',
  'jcrew.com': 'j-crew',
  'levi.com': 'levis',
  'guess.com': 'guess',
  'tommy.com': 'tommy-hilfiger',
  'calvinklein.com': 'calvin-klein',
  'ralphlauren.com': 'ralph-lauren',
  'puma.com': 'puma',
  'newbalance.com': 'new-balance',
  'reebok.com': 'reebok',
  'underarmour.com': 'under-armour',
  'lululemon.com': 'lululemon',
  'gymshark.com': 'gymshark',
  'cos.com': 'cos',
  'arket.com': 'arket',
  'stories.com': 'and-other-stories',
  'weekday.com': 'weekday',
  'monki.com': 'monki',
  'topshop.com': 'topshop',
  'next.co.uk': 'next',
  'primark.com': 'primark',
  'riverisland.com': 'river-island',
  'superdry.com': 'superdry',
  'pull&bear.com': 'pull-and-bear',
  'pullandbear.com': 'pull-and-bear',
  'bershka.com': 'bershka',
  'stradivarius.com': 'stradivarius',
  'massimo dutti.com': 'massimo-dutti',
  'massimodutti.com': 'massimo-dutti',

  // Sustainable / ethical brands
  'patagonia.com': 'patagonia',
  'everlane.com': 'everlane',
  'thereformation.com': 'reformation',
  'eileenfisher.com': 'eileen-fisher',
  'tentree.com': 'tentree',
  'pangaia.com': 'pangaia',
  'allbirds.com': 'allbirds',
  'vfrfrm.com': 'veja',
  'veja-store.com': 'veja',
  'kotn.com': 'kotn',
  'pfrm.co': 'pact',
  'wearpact.com': 'pact',
  'thoughtclothing.com': 'thought',
  'peopletree.co.uk': 'people-tree',
  'nudie jeans.com': 'nudie-jeans',
  'nudiejeans.com': 'nudie-jeans',
  'stellamccartney.com': 'stella-mccartney',

  // Luxury
  'gucci.com': 'gucci',
  'louisvuitton.com': 'louis-vuitton',
  'prada.com': 'prada',
  'burberry.com': 'burberry',
  'versace.com': 'versace',
  'balenciaga.com': 'balenciaga',
  'dior.com': 'dior',
  'chanel.com': 'chanel',
  'hermes.com': 'hermes',
  'armani.com': 'armani',

  // Outdoor / activewear
  'thenorthface.com': 'the-north-face',
  'columbia.com': 'columbia',
  'rei.com': 'rei',
  'arcteryx.com': 'arcteryx',
};

/**
 * Try to detect a brand slug from the current page hostname.
 * Falls back to extracting a slug from the domain name or page title.
 */
export function detectBrandSlug(hostname: string, pageTitle?: string): string | null {
  const host = hostname.toLowerCase().replace(/^www\./, '');

  // Direct domain match
  if (DOMAIN_TO_SLUG[host]) {
    return DOMAIN_TO_SLUG[host];
  }

  // Check if any known domain is a suffix of the hostname (handles subdomains)
  for (const [domain, slug] of Object.entries(DOMAIN_TO_SLUG)) {
    if (host.endsWith(domain) || host.endsWith('.' + domain)) {
      return slug;
    }
  }

  // Fallback: derive a slug from the domain itself
  // e.g. "shop.everlane.com" -> "everlane"
  const parts = host.split('.');
  // Pick the second-level domain (skip TLD)
  if (parts.length >= 2) {
    const brand = parts[parts.length - 2];
    if (brand && brand.length > 2 && brand !== 'com' && brand !== 'co') {
      return brand;
    }
  }

  // Last resort: try to extract something from the page title
  if (pageTitle) {
    const cleaned = pageTitle
      .split(/[|\-\u2013\u2014]/)[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (cleaned.length > 1 && cleaned.length < 40) {
      return cleaned;
    }
  }

  return null;
}
