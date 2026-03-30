use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ── Material impact data ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialImpact {
    pub co2_per_kg: f64,
    pub water_per_kg: f64,
    pub durability: f64,
    pub biodegradable: bool,
    pub renewable: bool,
    pub microplastic_risk: bool,
}

fn get_material_database() -> Vec<(&'static str, MaterialImpact)> {
    vec![
        ("cotton", MaterialImpact { co2_per_kg: 16.4, water_per_kg: 10000.0, durability: 6.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("organic_cotton", MaterialImpact { co2_per_kg: 8.2, water_per_kg: 5000.0, durability: 6.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("recycled_cotton", MaterialImpact { co2_per_kg: 4.1, water_per_kg: 200.0, durability: 5.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("polyester", MaterialImpact { co2_per_kg: 14.2, water_per_kg: 60.0, durability: 8.0, biodegradable: false, renewable: false, microplastic_risk: true }),
        ("recycled_polyester", MaterialImpact { co2_per_kg: 5.0, water_per_kg: 20.0, durability: 7.0, biodegradable: false, renewable: false, microplastic_risk: true }),
        ("nylon", MaterialImpact { co2_per_kg: 24.0, water_per_kg: 150.0, durability: 9.0, biodegradable: false, renewable: false, microplastic_risk: true }),
        ("recycled_nylon", MaterialImpact { co2_per_kg: 8.0, water_per_kg: 50.0, durability: 8.0, biodegradable: false, renewable: false, microplastic_risk: true }),
        ("linen", MaterialImpact { co2_per_kg: 3.5, water_per_kg: 2000.0, durability: 7.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("hemp", MaterialImpact { co2_per_kg: 2.8, water_per_kg: 2700.0, durability: 8.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("tencel", MaterialImpact { co2_per_kg: 3.0, water_per_kg: 1500.0, durability: 7.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("lyocell", MaterialImpact { co2_per_kg: 3.0, water_per_kg: 1500.0, durability: 7.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("modal", MaterialImpact { co2_per_kg: 4.5, water_per_kg: 2000.0, durability: 6.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("viscose", MaterialImpact { co2_per_kg: 8.0, water_per_kg: 5000.0, durability: 5.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("rayon", MaterialImpact { co2_per_kg: 8.0, water_per_kg: 5000.0, durability: 5.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("wool", MaterialImpact { co2_per_kg: 20.0, water_per_kg: 15000.0, durability: 9.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("silk", MaterialImpact { co2_per_kg: 25.0, water_per_kg: 10000.0, durability: 5.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("acrylic", MaterialImpact { co2_per_kg: 18.0, water_per_kg: 100.0, durability: 4.0, biodegradable: false, renewable: false, microplastic_risk: true }),
        ("spandex", MaterialImpact { co2_per_kg: 15.0, water_per_kg: 80.0, durability: 3.0, biodegradable: false, renewable: false, microplastic_risk: true }),
        ("elastane", MaterialImpact { co2_per_kg: 15.0, water_per_kg: 80.0, durability: 3.0, biodegradable: false, renewable: false, microplastic_risk: true }),
        ("cashmere", MaterialImpact { co2_per_kg: 28.0, water_per_kg: 20000.0, durability: 6.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("leather", MaterialImpact { co2_per_kg: 17.0, water_per_kg: 17000.0, durability: 9.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("faux_leather", MaterialImpact { co2_per_kg: 16.0, water_per_kg: 50.0, durability: 4.0, biodegradable: false, renewable: false, microplastic_risk: true }),
        ("down", MaterialImpact { co2_per_kg: 22.0, water_per_kg: 14000.0, durability: 8.0, biodegradable: true, renewable: true, microplastic_risk: false }),
        ("recycled_down", MaterialImpact { co2_per_kg: 5.0, water_per_kg: 100.0, durability: 7.0, biodegradable: true, renewable: true, microplastic_risk: false }),
    ]
}

// ── Parsed material ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedMaterial {
    pub name: String,
    pub normalized: String,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialBreakdownItem {
    pub fiber: String,
    pub percentage: f64,
    pub impact: String,
    pub co2_per_kg: f64,
    pub water_per_kg: f64,
    pub biodegradable: bool,
    pub renewable: bool,
    pub microplastic_risk: bool,
    pub durability: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentalMetrics {
    pub water_rating: String,
    pub carbon_rating: String,
    pub biodegradability_rating: String,
    pub microplastic_risk: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoringOutput {
    pub score: u32,
    pub grade: String,
    pub breakdown: Vec<MaterialBreakdownItem>,
    pub environmental_metrics: EnvironmentalMetrics,
    pub recommendations: Vec<String>,
    pub weighted_co2: f64,
    pub weighted_water: f64,
    pub weighted_durability: f64,
}

// ── Fiber normalization ──

fn normalize_fiber(raw: &str) -> String {
    let lower = raw.to_lowercase();
    let lower = lower.trim();

    // Check for recycled/organic qualifiers first
    if lower.contains("recycled") && lower.contains("cotton") {
        return "recycled_cotton".to_string();
    }
    if lower.contains("recycled") && lower.contains("polyester") {
        return "recycled_polyester".to_string();
    }
    if lower.contains("recycled") && lower.contains("nylon") {
        return "recycled_nylon".to_string();
    }
    if lower.contains("recycled") && lower.contains("down") {
        return "recycled_down".to_string();
    }
    if lower.contains("organic") && lower.contains("cotton") {
        return "organic_cotton".to_string();
    }
    if lower.contains("bci") && lower.contains("cotton") {
        return "organic_cotton".to_string();
    }

    let mappings: &[(&str, &str)] = &[
        ("cotton", "cotton"),
        ("polyester", "polyester"),
        ("polyamide", "nylon"),
        ("nylon", "nylon"),
        ("linen", "linen"),
        ("flax", "linen"),
        ("hemp", "hemp"),
        ("tencel", "tencel"),
        ("lyocell", "lyocell"),
        ("modal", "modal"),
        ("viscose", "viscose"),
        ("rayon", "rayon"),
        ("wool", "wool"),
        ("merino", "wool"),
        ("silk", "silk"),
        ("acrylic", "acrylic"),
        ("spandex", "spandex"),
        ("elastane", "elastane"),
        ("lycra", "elastane"),
        ("cashmere", "cashmere"),
        ("faux leather", "faux_leather"),
        ("vegan leather", "faux_leather"),
        ("pu leather", "faux_leather"),
        ("leather", "leather"),
        ("down", "down"),
    ];

    for (key, value) in mappings {
        if lower.contains(key) {
            return value.to_string();
        }
    }

    "unknown".to_string()
}

// ── Composition parsing ──

fn parse_composition(input: &str) -> Vec<ParsedMaterial> {
    let mut materials = Vec::new();
    let input = input.trim();
    if input.is_empty() {
        return materials;
    }

    // Split on common delimiters: comma, semicolon, newline, pipe, slash
    let parts: Vec<&str> = input
        .split(|c: char| c == ',' || c == ';' || c == '\n' || c == '|' || c == '/')
        .collect();

    for part in parts {
        let part = part.trim();
        if part.is_empty() {
            continue;
        }

        // Try to extract percentage and material name
        // Patterns: "60% polyester", "polyester 60%", "60 % polyester", "60 percent polyester"
        let mut percentage: Option<f64> = None;
        let mut name_part = String::new();

        // Replace "percent" with "%" for uniformity
        let normalized = part
            .replace("percent", "%")
            .replace("pct", "%");

        // Try regex-like parsing: find a number followed by optional whitespace and %
        let chars: Vec<char> = normalized.chars().collect();
        let mut i = 0;
        let mut num_start = None;
        let mut num_end = None;
        let mut pct_end = None;

        while i < chars.len() {
            if chars[i].is_ascii_digit() || chars[i] == '.' {
                if num_start.is_none() {
                    num_start = Some(i);
                }
                num_end = Some(i);
                i += 1;
            } else if num_end.is_some() && pct_end.is_none() {
                // Skip whitespace between number and %
                if chars[i].is_whitespace() {
                    i += 1;
                    continue;
                }
                if chars[i] == '%' {
                    pct_end = Some(i);
                }
                break;
            } else {
                i += 1;
            }
        }

        if let (Some(ns), Some(ne)) = (num_start, num_end) {
            let num_str: String = chars[ns..=ne].iter().collect();
            if let Ok(pct) = num_str.parse::<f64>() {
                percentage = Some(pct);
                // The material name is everything else
                let pe = pct_end.unwrap_or(ne);
                let before: String = chars[..ns].iter().collect();
                let after: String = chars[(pe + 1)..].iter().collect();
                name_part = format!("{} {}", before.trim(), after.trim()).trim().to_string();
            }
        }

        if name_part.is_empty() && percentage.is_none() {
            // No number found, treat entire part as material name with unknown percentage
            name_part = part.to_string();
        }

        if !name_part.is_empty() {
            let normalized_name = normalize_fiber(&name_part);
            materials.push(ParsedMaterial {
                name: name_part,
                normalized: normalized_name,
                percentage: percentage.unwrap_or(0.0),
            });
        }
    }

    // If only one material with no percentage, assume 100%
    if materials.len() == 1 && materials[0].percentage == 0.0 {
        materials[0].percentage = 100.0;
    }

    // If percentages don't sum to 100, and some are 0, distribute remainder
    let total: f64 = materials.iter().map(|m| m.percentage).sum();
    let zero_count = materials.iter().filter(|m| m.percentage == 0.0).count();
    if zero_count > 0 && total < 100.0 {
        let remainder = (100.0 - total) / zero_count as f64;
        for mat in &mut materials {
            if mat.percentage == 0.0 {
                mat.percentage = remainder;
            }
        }
    }

    materials
}

// ── Scoring constants (matching the TypeScript engine) ──

const MAX_CO2: f64 = 28.0;
const MAX_WATER: f64 = 20000.0;

const W_CARBON: f64 = 0.35;
const W_WATER: f64 = 0.25;
const W_DURABILITY: f64 = 0.20;
const W_BIODEG: f64 = 0.10;

// ── Scoring logic ──

fn compute_score(materials: &[ParsedMaterial]) -> ScoringOutput {
    let db = get_material_database();

    let mut weighted_co2: f64 = 0.0;
    let mut weighted_water: f64 = 0.0;
    let mut weighted_durability: f64 = 0.0;
    let mut biodeg_penalty: f64 = 0.0;
    let mut total_pct: f64 = 0.0;
    let mut has_microplastic = false;

    let mut breakdown = Vec::new();

    for mat in materials {
        let impact = db.iter().find(|(name, _)| *name == mat.normalized);

        let impact = match impact {
            Some((_, imp)) => imp.clone(),
            None => {
                // Use unknown defaults
                MaterialImpact {
                    co2_per_kg: 12.0,
                    water_per_kg: 5000.0,
                    durability: 5.0,
                    biodegradable: false,
                    renewable: false,
                    microplastic_risk: true,
                }
            }
        };

        let pct_fraction = mat.percentage / 100.0;
        weighted_co2 += impact.co2_per_kg * pct_fraction;
        weighted_water += impact.water_per_kg * pct_fraction;
        weighted_durability += impact.durability * pct_fraction;

        if !impact.biodegradable {
            biodeg_penalty += pct_fraction;
        }

        if impact.microplastic_risk {
            has_microplastic = true;
        }

        total_pct += mat.percentage;

        // Per-material impact level
        let mat_score =
            (impact.co2_per_kg / MAX_CO2) * 50.0 + (impact.water_per_kg / MAX_WATER) * 50.0;
        let impact_level = if mat_score < 30.0 {
            "low"
        } else if mat_score < 60.0 {
            "medium"
        } else {
            "high"
        };

        breakdown.push(MaterialBreakdownItem {
            fiber: mat.normalized.clone(),
            percentage: mat.percentage,
            impact: impact_level.to_string(),
            co2_per_kg: impact.co2_per_kg,
            water_per_kg: impact.water_per_kg,
            biodegradable: impact.biodegradable,
            renewable: impact.renewable,
            microplastic_risk: impact.microplastic_risk,
            durability: impact.durability,
        });
    }

    // Fallback if no materials detected
    if total_pct == 0.0 {
        weighted_co2 = 12.0;
        weighted_water = 5000.0;
        weighted_durability = 5.0;
        biodeg_penalty = 0.5;
    }

    // Composite score (0-100, lower = better)
    let carbon_score = (weighted_co2 / MAX_CO2) * 100.0;
    let water_score = (weighted_water / MAX_WATER) * 100.0;
    let durability_score = (1.0 - weighted_durability / 10.0) * 100.0;
    let biodeg_score = biodeg_penalty * 100.0;

    let composite = W_CARBON * carbon_score
        + W_WATER * water_score
        + W_DURABILITY * durability_score
        + W_BIODEG * biodeg_score;

    let composite = composite.clamp(0.0, 100.0);
    let score = composite.round() as u32;

    let grade = match score {
        0..=20 => "A",
        21..=35 => "B",
        36..=50 => "C",
        51..=65 => "D",
        _ => "F",
    }
    .to_string();

    // Environmental ratings
    let water_rating = if weighted_water < 2000.0 {
        "Low"
    } else if weighted_water < 8000.0 {
        "Moderate"
    } else {
        "High"
    }
    .to_string();

    let carbon_rating = if weighted_co2 < 6.0 {
        "Low"
    } else if weighted_co2 < 15.0 {
        "Moderate"
    } else {
        "High"
    }
    .to_string();

    let biodeg_rating = if biodeg_penalty < 0.2 {
        "Mostly Biodegradable"
    } else if biodeg_penalty < 0.6 {
        "Partially Biodegradable"
    } else {
        "Not Biodegradable"
    }
    .to_string();

    let microplastic_str = if has_microplastic {
        "Risk Present"
    } else {
        "No Risk"
    }
    .to_string();

    // Recommendations
    let mut recommendations = Vec::new();

    if weighted_co2 > 15.0 {
        recommendations.push("Consider alternatives with lower carbon footprint like linen, hemp, or Tencel.".to_string());
    }
    if weighted_water > 8000.0 {
        recommendations.push("This fabric blend has high water usage. Recycled materials significantly reduce water consumption.".to_string());
    }
    if biodeg_penalty > 0.5 {
        recommendations.push("Over half of this garment is non-biodegradable. Look for natural fiber alternatives.".to_string());
    }
    if has_microplastic {
        recommendations.push("This garment may release microplastics when washed. Use a microplastic-catching laundry bag.".to_string());
    }
    if weighted_durability < 5.0 {
        recommendations.push("Low durability blend. This garment may not last long, increasing its environmental cost per wear.".to_string());
    }
    if score <= 20 {
        recommendations.push("Great choice! This is one of the most sustainable fabric blends available.".to_string());
    }

    // Always have at least one recommendation
    if recommendations.is_empty() {
        recommendations.push("Extend garment life by following care label instructions and repairing when possible.".to_string());
    }

    ScoringOutput {
        score,
        grade,
        breakdown,
        environmental_metrics: EnvironmentalMetrics {
            water_rating,
            carbon_rating,
            biodegradability_rating: biodeg_rating,
            microplastic_risk: microplastic_str,
        },
        recommendations,
        weighted_co2: (weighted_co2 * 100.0).round() / 100.0,
        weighted_water: weighted_water.round(),
        weighted_durability: (weighted_durability * 10.0).round() / 10.0,
    }
}

// ── WASM exports ──

/// Score a composition string like "60% polyester, 40% cotton"
/// Returns JSON with score, grade, breakdown, environmental_metrics, and recommendations
#[wasm_bindgen]
pub fn score_materials(composition_string: &str) -> JsValue {
    let materials = parse_composition(composition_string);
    let result = compute_score(&materials);
    serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
}

/// Parse a composition string and return the parsed materials as JSON
#[wasm_bindgen]
pub fn parse_materials(composition_string: &str) -> JsValue {
    let materials = parse_composition(composition_string);
    serde_wasm_bindgen::to_value(&materials).unwrap_or(JsValue::NULL)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_basic_composition() {
        let materials = parse_composition("60% polyester, 40% cotton");
        assert_eq!(materials.len(), 2);
        assert_eq!(materials[0].normalized, "polyester");
        assert_eq!(materials[0].percentage, 60.0);
        assert_eq!(materials[1].normalized, "cotton");
        assert_eq!(materials[1].percentage, 40.0);
    }

    #[test]
    fn test_parse_organic() {
        let materials = parse_composition("100% organic cotton");
        assert_eq!(materials.len(), 1);
        assert_eq!(materials[0].normalized, "organic_cotton");
        assert_eq!(materials[0].percentage, 100.0);
    }

    #[test]
    fn test_parse_recycled() {
        let materials = parse_composition("70% recycled polyester, 30% elastane");
        assert_eq!(materials.len(), 2);
        assert_eq!(materials[0].normalized, "recycled_polyester");
        assert_eq!(materials[1].normalized, "elastane");
    }

    #[test]
    fn test_scoring_low_impact() {
        let materials = parse_composition("100% organic cotton");
        let result = compute_score(&materials);
        assert!(result.score <= 35, "Organic cotton should score B or better, got {}", result.score);
    }

    #[test]
    fn test_scoring_high_impact() {
        let materials = parse_composition("100% cashmere");
        let result = compute_score(&materials);
        assert!(result.score >= 50, "Cashmere should score C or worse, got {}", result.score);
    }

    #[test]
    fn test_scoring_mixed() {
        let materials = parse_composition("60% polyester, 40% cotton");
        let result = compute_score(&materials);
        assert!(result.score > 20 && result.score < 80, "Mixed blend should be mid-range, got {}", result.score);
        assert_eq!(result.breakdown.len(), 2);
    }

    #[test]
    fn test_normalize_polyamide() {
        assert_eq!(normalize_fiber("polyamide"), "nylon");
    }

    #[test]
    fn test_normalize_lycra() {
        assert_eq!(normalize_fiber("lycra"), "elastane");
    }

    #[test]
    fn test_single_material_no_percentage() {
        let materials = parse_composition("cotton");
        assert_eq!(materials.len(), 1);
        assert_eq!(materials[0].percentage, 100.0);
    }
}
