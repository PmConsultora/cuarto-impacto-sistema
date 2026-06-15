/**
 * Genera todos los íconos PWA en distintos tamaños desde el logo SVG
 * usando Chrome headless (no requiere sharp).
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.join(__dirname, '..', 'frontend', 'icons');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Tamaños recomendados PWA + iOS
const SIZES = [
  { size: 192, name: 'icon-192.png', purpose: 'standard' },
  { size: 256, name: 'icon-256.png', purpose: 'standard' },
  { size: 384, name: 'icon-384.png', purpose: 'standard' },
  { size: 512, name: 'icon-512.png', purpose: 'standard' },
  { size: 192, name: 'icon-192-maskable.png', purpose: 'maskable' }, // Android adaptive
  { size: 512, name: 'icon-512-maskable.png', purpose: 'maskable' },
  { size: 180, name: 'apple-touch-icon.png', purpose: 'apple' }, // iOS home
];

function buildHTML(size, purpose) {
  // Para "maskable" necesitamos un padding extra (safe area de 20%)
  // Para "apple" un fondo redondeado tipo iOS
  const pad = purpose === 'maskable' ? size * 0.18 : (purpose === 'apple' ? size * 0.16 : size * 0.12);
  const innerSize = size - pad * 2;
  const bgColor = purpose === 'maskable' ? '#0f2137' : (purpose === 'apple' ? '#0f2137' : 'transparent');
  const radius = purpose === 'maskable' ? 0 : (purpose === 'apple' ? size * 0.22 : 0);

  // Logo: 4 cuadrados (3 navy soft + 1 dorado)
  // Sobre fondo navy, los cuadrados tienen que ser claros para contrastar
  const navyOn = (purpose === 'maskable' || purpose === 'apple');
  const colorNavy = navyOn ? '#c8ddee' : '#1e3a5f';
  const colorGold = '#f4b822';

  return `<!doctype html>
<html><head><style>
  html, body { margin: 0; padding: 0; width: ${size}px; height: ${size}px; }
  body {
    display: flex; align-items: center; justify-content: center;
    background: ${bgColor};
    ${radius ? `border-radius: ${radius}px;` : ''}
  }
  svg { display: block; }
</style></head>
<body>
  <svg width="${innerSize}" height="${innerSize}" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="12" height="12" rx="2.5" fill="${colorNavy}"/>
    <rect x="15" y="0" width="12" height="12" rx="2.5" fill="${colorNavy}"/>
    <rect x="0" y="15" width="12" height="12" rx="2.5" fill="${colorNavy}"/>
    <rect x="15" y="15" width="12" height="12" rx="2.5" fill="${colorGold}"/>
  </svg>
</body></html>`;
}

(async () => {
  console.log('⏳ Generando íconos PWA...');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });

  for (const { size, name, purpose } of SIZES) {
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(buildHTML(size, purpose), { waitUntil: 'networkidle0' });
    await page.screenshot({
      path: path.join(OUT_DIR, name),
      type: 'png',
      omitBackground: purpose === 'standard',
      clip: { x: 0, y: 0, width: size, height: size },
    });
    console.log(`  ✅ ${name} (${size}×${size}, ${purpose})`);
    await page.close();
  }

  await browser.close();

  // Generar también favicon.ico (32×32 PNG con extensión .ico es OK para navegadores modernos)
  // Renombrar el de 192 a un favicon? Mejor generar uno limpio chico:
  const page2 = await (await puppeteer.launch({ executablePath: CHROME, headless: 'new' })).newPage();
  await page2.setViewport({ width: 32, height: 32, deviceScaleFactor: 1 });
  await page2.setContent(buildHTML(32, 'standard'), { waitUntil: 'networkidle0' });
  await page2.screenshot({ path: path.join(OUT_DIR, 'favicon-32.png'), type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: 32, height: 32 } });
  await page2.browser().close();
  console.log('  ✅ favicon-32.png');

  console.log(`\n🎉 ${SIZES.length + 1} íconos generados en ${OUT_DIR}\n`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
