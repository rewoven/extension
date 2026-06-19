

const DOMAIN_TO_SLUG: Record<string, string> = {

  'zara.com': 'zara',
  'hm.com': 'h-m',
  'www2.hm.com': 'h-m',
  'shein.com': 'shein',
  'temu.com': 'temu',
  'boohoo.com': 'boohoo',
  'prettylittlething.com': 'prettylittlething',
  'fashionnova.com': 'fashion-nova',
  'forever21.com': 'forever-21',
  'romwe.com': 'romwe',
  'zaful.com': 'zaful',
  'yesstyle.com': 'yesstyle',
  'cider.com': 'cider',
  'emmiol.com': 'emmiol',

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

  'thenorthface.com': 'the-north-face',
  'columbia.com': 'columbia',
  'rei.com': 'rei',
  'arcteryx.com': 'arcteryx',
};

export const KNOWN_FASHION_DOMAINS: string[] = Object.keys(DOMAIN_TO_SLUG);

export function detectBrandSlug(hostname: string): string | null {
  const host = hostname.toLowerCase().replace(/^www\./, '');

  if (DOMAIN_TO_SLUG[host]) {
    return DOMAIN_TO_SLUG[host];
  }

  for (const [domain, slug] of Object.entries(DOMAIN_TO_SLUG)) {
    if (host === domain || host.endsWith('.' + domain)) {
      return slug;
    }
  }

  return null;
}

export function isKnownFashionDomain(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (DOMAIN_TO_SLUG[host]) return true;
  for (const domain of Object.keys(DOMAIN_TO_SLUG)) {
    if (host === domain || host.endsWith('.' + domain)) return true;
  }
  return false;
}
