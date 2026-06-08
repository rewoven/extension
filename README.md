# Rewoven Shopping Lens

A Chrome extension that shows the environmental impact and sustainability of
clothing while you shop online powered by the [Rewoven API](https://github.com/rewoven/api)

[Methodology](https://rewovenapp.com/methodology)

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
