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
 *
 * Only matches against the curated fashion-retailer map. We deliberately do
 * NOT derive a slug from arbitrary domains or page titles \u2014 doing so produced
 * garbage lookups (e.g. apple.com -> "apple") that hit the API for non-fashion
 * sites. For unknown fashion sites we instead search the API by the scraped
 * brand name (see content/index.ts), which naturally returns nothing for
 * non-apparel brands.
 */
export function detectBrandSlug(hostname: string): string | null {
  const host = hostname.toLowerCase().replace(/^www\./, '');

  // Direct domain match
  if (DOMAIN_TO_SLUG[host]) {
    return DOMAIN_TO_SLUG[host];
  }

  // Check if any known domain is a suffix of the hostname (handles subdomains)
  for (const [domain, slug] of Object.entries(DOMAIN_TO_SLUG)) {
    if (host === domain || host.endsWith('.' + domain)) {
      return slug;
    }
  }

  return null;
}

/**
 * Is this hostname a known fashion retailer? Used as a strong "this is a
 * fashion website" signal by the apparel gate.
 */
export function isKnownFashionDomain(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (DOMAIN_TO_SLUG[host]) return true;
  for (const domain of Object.keys(DOMAIN_TO_SLUG)) {
    if (host === domain || host.endsWith('.' + domain)) return true;
  }
  return false;
}
