import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const isWatch = process.argv.includes('--watch');

const distDir = 'dist';
if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

async function loadFashionDomains() {
  const result = await esbuild.build({
    entryPoints: ['src/api/brand-detector.ts'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
  });
  const code = result.outputFiles[0].text;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  return mod.KNOWN_FASHION_DOMAINS;
}

function toMatchPatterns(domains) {
  const valid = domains
    .map((d) => d.toLowerCase())
    .filter((d) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(d));
  const set = new Set(valid);
  const roots = valid.filter((d) => {
    const parts = d.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      if (set.has(parts.slice(i).join('.'))) return false;
    }
    return true;
  });
  return [...new Set(roots.map((d) => `*://*.${d}/*`))].sort();
}

async function writeManifest() {
  const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
  const matches = toMatchPatterns(await loadFashionDomains());
  if (matches.length === 0) throw new Error('No valid fashion domains found for content script matches');
  manifest.content_scripts[0].matches = matches;
  manifest.host_permissions = ['https://api.rewovenapp.com/*'];
  const serialized = JSON.stringify(manifest, null, 2) + '\n';
  writeFileSync(join(distDir, 'manifest.json'), serialized);
  if (readFileSync('manifest.json', 'utf8') !== serialized) {
    writeFileSync('manifest.json', serialized);
    console.log('manifest.json matches regenerated from src/api/brand-detector.ts');
  }
}

await writeManifest();
copyFileSync('src/popup/popup.html', join(distDir, 'popup.html'));
copyFileSync('src/popup/popup.css', join(distDir, 'popup.css'));
copyFileSync('src/content/overlay.css', join(distDir, 'overlay.css'));

if (existsSync('src/assets/icons')) {
  const iconsDir = join(distDir, 'icons');
  if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
  cpSync('src/assets/icons', iconsDir, { recursive: true });
}

const serviceWorkerOptions = {
  entryPoints: ['src/background/service-worker.ts'],
  bundle: true,
  outdir: distDir,
  format: 'esm',
  target: 'chrome120',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
  outbase: 'src',
};

const contentOptions = {
  entryPoints: [
    'src/content/index.ts',
    'src/popup/popup.ts',
  ],
  bundle: true,
  outdir: distDir,
  format: 'iife',
  target: 'chrome120',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
  outbase: 'src',
};

if (isWatch) {
  const ctx1 = await esbuild.context(serviceWorkerOptions);
  const ctx2 = await esbuild.context(contentOptions);
  await ctx1.watch();
  await ctx2.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(serviceWorkerOptions);
  await esbuild.build(contentOptions);
  console.log('Build complete!');
}
