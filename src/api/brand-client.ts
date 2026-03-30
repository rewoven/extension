/** Rewoven Brand Rating API client */

const API_BASE = 'https://api.rewovenapp.com';
const TIMEOUT_MS = 5000;

export interface BrandRating {
  name: string;
  slug: string;
  overall_score: number;
  grade: string;
  environmental_score: number;
  labor_score: number;
  transparency_score: number;
  animal_welfare_score: number;
  price_range: string;
  country: string;
  category: string;
  certifications: string[];
  summary: string;
  website: string;
}

// In-memory cache keyed by slug or search query
const cache = new Map<string, { data: BrandRating | BrandRating[] | null; ts: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    return entry.data as T;
  }
  if (entry) cache.delete(key);
  return undefined;
}

function setCache(key: string, data: BrandRating | BrandRating[] | null): void {
  cache.set(key, { data, ts: Date.now() });
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a single brand rating by slug.
 * Returns null if the brand is not found or the API is unreachable.
 */
export async function fetchBrandRating(brandSlug: string): Promise<BrandRating | null> {
  const cacheKey = `brand:${brandSlug}`;
  const cached = getCached<BrandRating | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await fetchWithTimeout(`${API_BASE}/api/brands/${encodeURIComponent(brandSlug)}`);
    if (!response.ok) {
      setCache(cacheKey, null);
      return null;
    }
    const data: BrandRating = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('[Rewoven] Brand API unreachable:', err);
    return null;
  }
}

/**
 * Search for brands by name.
 * Returns an empty array if the API is unreachable or no results are found.
 */
export async function searchBrand(query: string): Promise<BrandRating[]> {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = getCached<BrandRating[]>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await fetchWithTimeout(
      `${API_BASE}/api/brands/search?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      setCache(cacheKey, []);
      return [];
    }
    const data: BrandRating[] = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('[Rewoven] Brand search failed:', err);
    return [];
  }
}
