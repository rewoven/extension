# Rewoven Shopping Lens

A Chrome extension that shows the environmental impact and sustainability of
**clothing** while you shop online, powered by the [Rewoven API](https://github.com/rewoven/api).

## Features

- **Activates only on fashion products.** A strict apparel gate keeps the Lens
  off non-clothing pages (electronics, books, groceries, furniture) — including
  the non-clothing aisles of general marketplaces like Amazon.
- **Never fabricates statistics.** Environmental estimates are shown only when a
  real fabric composition is found on the page. If a page doesn't list the
  composition, the Lens says so instead of inventing numbers.
- Material composition detection on product pages.
- Sustainability scoring (A–F grade, 0–100 material score).
- Environmental footprint estimates (CO₂, water) — derived from published
  per-fibre research data, shown only when materials are known.
- Cost-per-wear analysis (only when a real price is available).
- Real brand sustainability ratings, scores, and rationale from the Rewoven API.
- Sustainable alternative suggestions.

## How it decides to show

A product is treated as apparel when **any** of these hold (and no clear
non-apparel signal contradicts it):

1. A garment category is detected from the product name (shirt, jeans, dress, …).
2. The breadcrumb / structured data contains an apparel keyword (clothing,
   footwear, knitwear, …).
3. A real textile composition is present — and, on general marketplaces, this is
   required to be corroborated by 1 or 2.

Scoring runs locally and synchronously in the content script (no service-worker
round-trip), and the page is only re-scanned when the URL actually changes.

## Installation (development)

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)

#### Build steps
1. Clone and enter the repo:
   ```bash
   git clone https://github.com/rewoven/extension.git
   cd extension
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build:
   ```bash
   npm run build
   ```
4. Open Chrome → `chrome://extensions`
5. Enable **Developer mode**
6. Click **Load unpacked**
7. Select the `dist/` folder
