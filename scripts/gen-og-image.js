/**
 * Genera la imagen OpenGraph (1200x630) para previews ricos en LinkedIn,
 * WhatsApp, Twitter, etc. cuando alguien comparte links del sitio.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/Users/paulamonte/Desktop/AGENTES IA/El cuarto Impacto/elcuartoimpacto-web/og-adherentes.png';

const html = `<!doctype html>
<html><head><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 1200px; height: 630px;
  background: linear-gradient(135deg, #0f2137 0%, #1e3a5f 60%, #2c4e7a 100%);
  font-family: 'DM Sans', system-ui, sans-serif;
  color: #faf8f3;
  overflow: hidden;
  position: relative;
}
body::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 12px;
  background: #f4b822;
}
body::after {
  content: ''; position: absolute;
  top: -200px; right: -200px; width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(244,184,34,0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
.frame {
  padding: 90px 100px; height: 100%;
  display: flex; flex-direction: column; justify-content: space-between;
  position: relative; z-index: 1;
}
.top {
  display: flex; align-items: center; gap: 22px;
}
.logo {
  background: rgba(244,184,34,0.12); padding: 14px; border-radius: 14px;
  display: inline-flex;
}
.brand {
  font-size: 14px; letter-spacing: 0.28em; text-transform: uppercase;
  color: #f4b822; font-weight: 700;
}
.brand small {
  display: block; font-family: 'Cormorant Garamond', serif;
  font-size: 18px; color: rgba(200,221,238,0.7); margin-top: 4px;
  letter-spacing: 0.05em; text-transform: none; font-style: italic; font-weight: 500;
}
.middle {
  flex: 1; display: flex; flex-direction: column; justify-content: center; padding-right: 80px;
}
h1 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 84px; font-weight: 600; font-style: italic;
  line-height: 0.98; letter-spacing: -0.02em; margin-bottom: 32px;
}
h1 em {
  color: #f4b822; font-weight: 600; font-style: italic;
}
.line {
  width: 100px; height: 3px; background: #f4b822; margin-bottom: 32px;
}
p.tagline {
  font-family: 'Cormorant Garamond', serif;
  font-size: 30px; font-style: italic; line-height: 1.35;
  color: rgba(200,221,238,0.9); max-width: 900px;
}
.bottom {
  display: flex; align-items: flex-end; justify-content: space-between;
  border-top: 1px solid rgba(244,184,34,0.18);
  padding-top: 24px;
}
.pillars {
  font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(200,221,238,0.65); font-weight: 600;
}
.pillars .gold { color: #f4b822; font-weight: 700; }
.url {
  font-size: 15px; color: rgba(200,221,238,0.7); letter-spacing: 0.04em;
  text-align: right; font-family: ui-monospace, Menlo, monospace;
}
</style></head>
<body>
  <div class="frame">
    <div class="top">
      <div class="logo">
        <svg width="60" height="60" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="12" height="12" rx="2.5" fill="#c8ddee"/>
          <rect x="15" y="0" width="12" height="12" rx="2.5" fill="#c8ddee"/>
          <rect x="0" y="15" width="12" height="12" rx="2.5" fill="#c8ddee"/>
          <rect x="15" y="15" width="12" height="12" rx="2.5" fill="#f4b822"/>
        </svg>
      </div>
      <div class="brand">El Cuarto Impacto<small>Manifiesto Fundacional · VF26</small></div>
    </div>

    <div class="middle">
      <h1>Sumate al<br>Cuarto <em>Impacto</em></h1>
      <div class="line"></div>
      <p class="tagline">La responsabilidad digital como cuarta dimensión del valor empresarial — junto al impacto económico, social y ambiental.</p>
    </div>

    <div class="bottom">
      <div class="pillars">Económico · Social · Ambiental · <span class="gold">Digital ★</span></div>
      <div class="url">elcuartoimpacto.com</div>
    </div>
  </div>
</body></html>`;

(async () => {
  console.log('⏳ Generando OG image...');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: OUT, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await browser.close();
  console.log('✅ ' + OUT);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
