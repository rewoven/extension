// ============ PRODUCT DATA ============

export type FiberType =
  | 'cotton'
  | 'organic_cotton'
  | 'recycled_cotton'
  | 'polyester'
  | 'recycled_polyester'
  | 'nylon'
  | 'recycled_nylon'
  | 'linen'
  | 'hemp'
  | 'tencel'
  | 'lyocell'
  | 'modal'
  | 'viscose'
  | 'rayon'
  | 'wool'
  | 'silk'
  | 'acrylic'
  | 'spandex'
  | 'elastane'
  | 'cashmere'
  | 'leather'
  | 'faux_leather'
  | 'down'
  | 'recycled_down'
  | 'unknown';

export type GarmentCategory =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'activewear'
  | 'footwear'
  | 'accessory'
  | 'underwear'
  | 'swimwear'
  | 'unknown';

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface MaterialComposition {
  fiber: FiberType;
  percentage: number;
  qualifier?: string; // "recycled", "organic", "BCI"
}

export interface ScrapedProduct {
  name: string;
  price: number;
  currency: string;
  materials: MaterialComposition[];
  brand: string;
  category: GarmentCategory;
  imageUrl?: string;
  url: string;
}

// ============ SCORING ============

export interface MaterialImpact {
  co2PerKg: number;      // kg CO2 per kg of fiber
  waterPerKg: number;    // liters of water per kg of fiber
  durability: number;    // 1-10 scale
  biodegradable: boolean;
  renewable: boolean;
  microplasticRisk: boolean;
}

export interface ScoringResult {
  grade: Grade;
  score: number;          // 0-100 (lower = better)
  co2Estimate: number;    // kg CO2 for this garment
  waterEstimate: number;  // liters for this garment
  costPerWear: number;
  estimatedWears: number;
  materialBreakdown: {
    fiber: FiberType;
    percentage: number;
    impact: 'low' | 'medium' | 'high';
  }[];
  brandRating?: BrandInfo;
  alternatives: Alternative[];
  tips: string[];
}

export interface BrandInfo {
  name: string;
  rating: number;        // 1-5
  highlights: string[];
  concerns: string[];
}

export interface Alternative {
  brandName: string;
  reason: string;
  url?: string;
}

// ============ MESSAGING ============

export type Message =
  | { type: 'SCORE_PRODUCT'; payload: ScrapedProduct }
  | { type: 'SCORE_RESULT'; payload: ScoringResult }
  | { type: 'GET_SETTINGS' }
  | { type: 'SETTINGS_RESULT'; payload: UserSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> };

export interface UserSettings {
  enabled: boolean;
  overlayPosition: 'left' | 'right';
  showOnAllSites: boolean;
  disabledSites: string[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  enabled: true,
  overlayPosition: 'right',
  showOnAllSites: true,
  disabledSites: [],
};
