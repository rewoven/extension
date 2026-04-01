import type { ScoringResult, ScrapedProduct } from '../shared/types';
import { GRADE_COLORS } from '../shared/constants';
import { getCostPerWearLabel } from '../scoring/cost-per-wear';
import type { BrandRating } from '../api/brand-client';
import { fetchAlternatives } from '../api/brand-client';

const ROOT_ID = 'rewoven-lens-root';
let shadowRoot: ShadowRoot | null = null;
let isExpanded = false;

export function removeOverlay() {
  const existing = document.getElementById(ROOT_ID);
  if (existing) existing.remove();
  shadowRoot = null;
  isExpanded = false;
}

export function createOverlay(result: ScoringResult, product: ScrapedProduct, apiBrandRating?: BrandRating | null) {
  removeOverlay();

  const host = document.createElement('div');
  host.id = ROOT_ID;
  host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; top: 0; right: 0; height: 100vh; pointer-events: none;';
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = getOverlayHTML(result, product, apiBrandRating);

  // Add event listeners
  const badge = shadowRoot.querySelector('.rw-badge') as HTMLElement;
  const panel = shadowRoot.querySelector('.rw-panel') as HTMLElement;
  const closeBtn = shadowRoot.querySelector('.rw-close') as HTMLElement;

  badge?.addEventListener('click', () => {
    isExpanded = !isExpanded;
    if (panel) panel.classList.toggle('expanded', isExpanded);
    if (badge) badge.classList.toggle('hidden', isExpanded);
  });

  closeBtn?.addEventListener('click', () => {
    isExpanded = false;
    if (panel) panel.classList.remove('expanded');
    if (badge) badge.classList.remove('hidden');
  });

  // Fetch API-powered alternatives if we have a brand rating
  if (apiBrandRating && apiBrandRating.overall_score < 70) {
    loadApiAlternatives(apiBrandRating.slug);
  }
}

async function loadApiAlternatives(brandSlug: string) {
  try {
    const data = await fetchAlternatives(brandSlug, 4);
    if (!data || !data.alternatives || data.alternatives.length === 0 || !shadowRoot) return;

    const section = shadowRoot.querySelector('#rw-api-alternatives') as HTMLElement;
    const list = shadowRoot.querySelector('#rw-api-alt-list') as HTMLElement;
    if (!section || !list) return;

    list.innerHTML = data.alternatives.map((a) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#F0FDF4;border-radius:8px;margin-bottom:6px;border:1px solid #D1FAE5;">
        <div>
          <div style="font-size:13px;font-weight:700;color:#1A1A1A;">${escapeHtml(a.name)}</div>
          <div style="font-size:11px;color:#666;">${escapeHtml(a.category)} · ${escapeHtml(a.price_range)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:16px;font-weight:900;color:${scoreColor(a.overall_score)};">${a.overall_score}</div>
          <div style="font-size:10px;color:#059669;font-weight:600;">+${a.overall_score - (data.original?.overall_score || 0)} pts</div>
        </div>
      </div>
    `).join('');

    section.style.display = 'block';
  } catch (err) {
    console.warn('[Rewoven] Could not load API alternatives:', err);
  }
}

export function updateOverlay(result: ScoringResult, product: ScrapedProduct, apiBrandRating?: BrandRating | null) {
  if (shadowRoot) {
    shadowRoot.innerHTML = getOverlayHTML(result, product, apiBrandRating);
  } else {
    createOverlay(result, product, apiBrandRating);
  }
}

function getOverlayHTML(result: ScoringResult, product: ScrapedProduct, apiBrandRating?: BrandRating | null): string {
  const gradeColor = GRADE_COLORS[result.grade];
  const cpwLabel = getCostPerWearLabel(result.costPerWear);

  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

      .rw-badge {
        position: fixed;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        width: 52px;
        height: 52px;
        border-radius: 12px 0 0 12px;
        background: ${gradeColor.bg};
        color: ${gradeColor.text};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 800;
        cursor: pointer;
        pointer-events: all;
        box-shadow: -2px 2px 12px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        z-index: 10;
      }
      .rw-badge:hover {
        width: 60px;
        box-shadow: -4px 4px 20px rgba(0,0,0,0.3);
      }
      .rw-badge.hidden { display: none; }
      .rw-badge::after {
        content: '🌿';
        position: absolute;
        top: -6px;
        left: -6px;
        font-size: 14px;
      }

      .rw-panel {
        position: fixed;
        top: 50%;
        right: -360px;
        transform: translateY(-50%);
        width: 340px;
        max-height: 85vh;
        background: #FFFFFF;
        border-radius: 16px 0 0 16px;
        box-shadow: -4px 0 30px rgba(0,0,0,0.15);
        overflow-y: auto;
        pointer-events: all;
        transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 9;
      }
      .rw-panel.expanded { right: 0; }
      .rw-panel::-webkit-scrollbar { width: 4px; }
      .rw-panel::-webkit-scrollbar-thumb { background: #C8E6C9; border-radius: 4px; }

      .rw-header {
        background: linear-gradient(135deg, #1B5E20, #2E7D32);
        color: white;
        padding: 20px;
        position: relative;
      }
      .rw-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .rw-logo {
        font-size: 15px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .rw-logo span { opacity: 0.7; font-weight: 400; }
      .rw-close {
        width: 28px; height: 28px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .rw-close:hover { background: rgba(255,255,255,0.3); }
      .rw-product-name {
        font-size: 13px;
        opacity: 0.85;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .rw-grade-section {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        border-bottom: 1px solid #E8F5E9;
      }
      .rw-grade-circle {
        width: 72px; height: 72px;
        border-radius: 50%;
        background: ${gradeColor.bg};
        color: ${gradeColor.text};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: 800;
        flex-shrink: 0;
        box-shadow: 0 2px 8px ${gradeColor.bg}40;
      }
      .rw-grade-info h3 {
        font-size: 16px;
        color: #1A1A1A;
        margin-bottom: 4px;
      }
      .rw-grade-info p {
        font-size: 12px;
        color: #666;
        line-height: 1.4;
      }
      .rw-score-bar {
        height: 6px;
        background: #E0E0E0;
        border-radius: 3px;
        margin-top: 8px;
        overflow: hidden;
      }
      .rw-score-fill {
        height: 100%;
        border-radius: 3px;
        background: ${gradeColor.bg};
        transition: width 0.5s ease;
      }

      .rw-section {
        padding: 16px 20px;
        border-bottom: 1px solid #E8F5E9;
      }
      .rw-section-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #2E7D32;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .rw-stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
      }
      .rw-stat-label {
        font-size: 13px;
        color: #666;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .rw-stat-value {
        font-size: 14px;
        font-weight: 600;
        color: #1A1A1A;
      }

      .rw-material-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-radius: 8px;
        margin-bottom: 4px;
        font-size: 13px;
      }
      .rw-material-item.low { background: #E8F5E9; }
      .rw-material-item.medium { background: #FFF8E1; }
      .rw-material-item.high { background: #FFEBEE; }
      .rw-material-name { color: #333; }
      .rw-material-pct { font-weight: 600; }
      .rw-material-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 6px;
      }
      .rw-material-dot.low { background: #4CAF50; }
      .rw-material-dot.medium { background: #FFC107; }
      .rw-material-dot.high { background: #F44336; }

      .rw-brand-row {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
      }
      .rw-leaf { font-size: 14px; }
      .rw-leaf.filled { opacity: 1; }
      .rw-leaf.empty { opacity: 0.2; }

      .rw-brand-detail {
        font-size: 12px;
        color: #666;
        margin-top: 6px;
        line-height: 1.4;
      }
      .rw-brand-highlight { color: #2E7D32; }
      .rw-brand-concern { color: #D32F2F; }

      .rw-api-grade-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px; height: 40px;
        border-radius: 10px;
        font-size: 20px;
        font-weight: 800;
        flex-shrink: 0;
      }
      .rw-api-grade-A { background: #16A34A; color: #fff; }
      .rw-api-grade-B { background: #65A30D; color: #fff; }
      .rw-api-grade-C { background: #EAB308; color: #000; }
      .rw-api-grade-D { background: #EA580C; color: #fff; }
      .rw-api-grade-F { background: #DC2626; color: #fff; }

      .rw-sub-score-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
      }
      .rw-sub-score-label {
        font-size: 12px;
        color: #666;
        width: 100px;
        flex-shrink: 0;
      }
      .rw-sub-score-bar-bg {
        flex: 1;
        height: 6px;
        background: #E0E0E0;
        border-radius: 3px;
        overflow: hidden;
      }
      .rw-sub-score-bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.5s ease;
      }
      .rw-sub-score-value {
        font-size: 11px;
        font-weight: 600;
        color: #333;
        width: 28px;
        text-align: right;
        flex-shrink: 0;
      }

      .rw-cert-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 6px;
      }
      .rw-cert-badge {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;
        background: #E8F5E9;
        color: #1B5E20;
        font-weight: 600;
      }

      .rw-brand-summary {
        font-size: 12px;
        color: #555;
        line-height: 1.5;
        margin-top: 8px;
      }

      .rw-category-badge {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 10px;
        background: #E3F2FD;
        color: #1565C0;
        font-weight: 600;
        display: inline-block;
        margin-top: 4px;
      }

      .rw-alt-item {
        padding: 8px 12px;
        background: #F1F8E9;
        border-radius: 8px;
        margin-bottom: 6px;
      }
      .rw-alt-name {
        font-size: 13px;
        font-weight: 600;
        color: #1B5E20;
      }
      .rw-alt-reason {
        font-size: 11px;
        color: #666;
        margin-top: 2px;
      }

      .rw-tip {
        font-size: 12px;
        color: #555;
        padding: 6px 0;
        line-height: 1.4;
        border-bottom: 1px solid #F1F8E9;
      }
      .rw-tip:last-child { border-bottom: none; }

      .rw-footer {
        padding: 12px 20px;
        text-align: center;
        font-size: 10px;
        color: #999;
      }
      .rw-footer a {
        color: #2E7D32;
        text-decoration: none;
      }
    </style>

    <div class="rw-badge">${result.grade}</div>

    <div class="rw-panel">
      <div class="rw-header">
        <div class="rw-header-top">
          <div class="rw-logo">🌿 Rewoven <span>Shopping Lens</span></div>
          <button class="rw-close">✕</button>
        </div>
        <div class="rw-product-name">${escapeHtml(product.name)}</div>
      </div>

      <div class="rw-grade-section">
        <div class="rw-grade-circle">${result.grade}</div>
        <div class="rw-grade-info">
          <h3>${gradeColor.label} Sustainability</h3>
          <p>Score: ${result.score}/100 (lower is better)</p>
          <div class="rw-score-bar">
            <div class="rw-score-fill" style="width: ${100 - result.score}%"></div>
          </div>
        </div>
      </div>

      <div class="rw-section">
        <div class="rw-section-title">🌍 Environmental Footprint</div>
        <div class="rw-stat-row">
          <span class="rw-stat-label">💨 Carbon Footprint</span>
          <span class="rw-stat-value">${result.co2Estimate} kg CO₂</span>
        </div>
        <div class="rw-stat-row">
          <span class="rw-stat-label">💧 Water Usage</span>
          <span class="rw-stat-value">${result.waterEstimate.toLocaleString()} L</span>
        </div>
        <div class="rw-stat-row">
          <span class="rw-stat-label">💰 Cost Per Wear</span>
          <span class="rw-stat-value">${product.currency === 'USD' ? '$' : product.currency === 'GBP' ? '£' : product.currency === 'EUR' ? '€' : ''}${result.costPerWear.toFixed(2)} — ${cpwLabel}</span>
        </div>
        <div class="rw-stat-row">
          <span class="rw-stat-label">👕 Est. Wears</span>
          <span class="rw-stat-value">${result.estimatedWears}</span>
        </div>
      </div>

      ${result.materialBreakdown.length > 0 ? `
      <div class="rw-section">
        <div class="rw-section-title">🧵 Material Analysis</div>
        ${result.materialBreakdown.map((m) => `
          <div class="rw-material-item ${m.impact}">
            <span class="rw-material-name">
              <span class="rw-material-dot ${m.impact}"></span>
              ${formatFiberName(m.fiber)}
            </span>
            <span class="rw-material-pct">${m.percentage}%</span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${result.brandRating ? `
      <div class="rw-section">
        <div class="rw-section-title">🏷️ Brand Rating</div>
        <div class="rw-brand-row">
          ${Array.from({ length: 5 }, (_, i) =>
            `<span class="rw-leaf ${i < Math.round(result.brandRating!.rating) ? 'filled' : 'empty'}">🌿</span>`
          ).join('')}
          <span style="font-size:12px;color:#666;margin-left:6px">${result.brandRating.rating}/5</span>
        </div>
        ${result.brandRating.highlights.length > 0 ? `
        <div class="rw-brand-detail">
          ${result.brandRating.highlights.slice(0, 2).map((h) => `<span class="rw-brand-highlight">✓ ${escapeHtml(h)}</span><br>`).join('')}
        </div>
        ` : ''}
        ${result.brandRating.concerns.length > 0 ? `
        <div class="rw-brand-detail">
          ${result.brandRating.concerns.slice(0, 2).map((c) => `<span class="rw-brand-concern">⚠ ${escapeHtml(c)}</span><br>`).join('')}
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${apiBrandRating ? `
      <div class="rw-section">
        <div class="rw-section-title">🏢 Brand Rating</div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
          <div class="rw-api-grade-badge rw-api-grade-${escapeHtml(apiBrandRating.grade.charAt(0))}">${escapeHtml(apiBrandRating.grade)}</div>
          <div>
            <div style="font-size:15px;font-weight:700;color:#1A1A1A;">${escapeHtml(apiBrandRating.name)}</div>
            <div style="font-size:12px;color:#666;">Score: ${apiBrandRating.overall_score}/100</div>
          </div>
        </div>
        ${apiBrandRating.category ? `<span class="rw-category-badge">${escapeHtml(apiBrandRating.category)}</span>` : ''}
        ${apiBrandRating.price_range ? `<span class="rw-category-badge" style="background:#FFF8E1;color:#F57F17;margin-left:4px;">${escapeHtml(apiBrandRating.price_range)}</span>` : ''}

        <div style="margin-top:10px;">
          ${renderSubScore('Environmental', apiBrandRating.environmental_score)}
          ${renderSubScore('Labor', apiBrandRating.labor_score)}
          ${renderSubScore('Transparency', apiBrandRating.transparency_score)}
          ${renderSubScore('Animal Welfare', apiBrandRating.animal_welfare_score)}
        </div>

        ${apiBrandRating.certifications && apiBrandRating.certifications.length > 0 ? `
        <div style="margin-top:8px;">
          <div style="font-size:11px;color:#666;margin-bottom:4px;">Certifications</div>
          <div class="rw-cert-list">
            ${apiBrandRating.certifications.map((c) => `<span class="rw-cert-badge">${escapeHtml(c)}</span>`).join('')}
          </div>
        </div>
        ` : ''}

        ${apiBrandRating.summary ? `<div class="rw-brand-summary">${escapeHtml(apiBrandRating.summary)}</div>` : ''}
      </div>
      ` : ''}

      ${result.alternatives.length > 0 ? `
      <div class="rw-section">
        <div class="rw-section-title">🔄 Sustainable Alternatives</div>
        ${result.alternatives.map((a) => `
          <div class="rw-alt-item">
            <div class="rw-alt-name">${escapeHtml(a.brandName)}</div>
            <div class="rw-alt-reason">${escapeHtml(a.reason)}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="rw-section" id="rw-api-alternatives" style="display:none;">
        <div class="rw-section-title">🌿 Better Brand Alternatives</div>
        <div id="rw-api-alt-list"></div>
      </div>

      ${(result as any).wasmMetrics ? `
      <div class="rw-section">
        <div class="rw-section-title">🔬 Detailed Environmental Metrics</div>
        <div class="rw-stat-row">
          <span class="rw-stat-label">💧 Water Impact</span>
          <span class="rw-stat-value">${(result as any).wasmMetrics.water_rating}</span>
        </div>
        <div class="rw-stat-row">
          <span class="rw-stat-label">💨 Carbon Impact</span>
          <span class="rw-stat-value">${(result as any).wasmMetrics.carbon_rating}</span>
        </div>
        <div class="rw-stat-row">
          <span class="rw-stat-label">♻️ Biodegradability</span>
          <span class="rw-stat-value">${(result as any).wasmMetrics.biodegradability_rating}</span>
        </div>
        <div class="rw-stat-row">
          <span class="rw-stat-label">🧫 Microplastic Risk</span>
          <span class="rw-stat-value">${(result as any).wasmMetrics.microplastic_risk}</span>
        </div>
      </div>
      ` : ''}

      ${(result as any).wasmRecommendations && (result as any).wasmRecommendations.length > 0 ? `
      <div class="rw-section">
        <div class="rw-section-title">🌱 WASM Scorer Recommendations</div>
        ${((result as any).wasmRecommendations as string[]).map((r: string) => `<div class="rw-tip">${escapeHtml(r)}</div>`).join('')}
      </div>
      ` : ''}

      ${result.tips.length > 0 ? `
      <div class="rw-section">
        <div class="rw-section-title">💡 Tips</div>
        ${result.tips.map((t) => `<div class="rw-tip">${escapeHtml(t)}</div>`).join('')}
      </div>
      ` : ''}

      <div class="rw-footer">
        Estimates based on published environmental research data.<br>
        Powered by <a href="https://rewovenapp.com" target="_blank">Rewoven</a>
      </div>
    </div>
  `;
}

function scoreColor(score: number): string {
  if (score >= 70) return '#16A34A';
  if (score >= 50) return '#65A30D';
  if (score >= 35) return '#EAB308';
  if (score >= 20) return '#EA580C';
  return '#DC2626';
}

function renderSubScore(label: string, score: number): string {
  return `
    <div class="rw-sub-score-row">
      <span class="rw-sub-score-label">${label}</span>
      <div class="rw-sub-score-bar-bg">
        <div class="rw-sub-score-bar-fill" style="width:${score}%;background:${scoreColor(score)};"></div>
      </div>
      <span class="rw-sub-score-value">${score}</span>
    </div>
  `;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatFiberName(fiber: string): string {
  return fiber
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
