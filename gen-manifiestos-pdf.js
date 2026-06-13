/**
 * Genera HTMLs branded de los manifiestos y los convierte a PDF usando Chrome.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/paulamonte/Desktop/AGENTES IA/El cuarto Impacto/Manifiestos Oficiales';

// Reusamos los datos del otro script
const { ES, EN } = require('./manifiesto-data');

function buildHTML(d, lang) {
  const dirAttr = lang === 'es' ? 'es' : 'en';
  return `<!doctype html>
<html lang="${dirAttr}">
<head>
<meta charset="utf-8">
<title>${d.brand}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');

:root {
  --navy: #0f2137; --navy-mid: #1e3a5f; --gold: #c8920a; --goldb: #f4b822;
  --paper: #faf8f3; --paper-warm: #f4eedf; --ink: #141210; --ink-soft: #3a3530;
  --muted: #76706a; --border: #ece5d5;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: white; }
body {
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--ink);
  line-height: 1.55;
  font-size: 11.5pt;
  -webkit-font-smoothing: antialiased;
}
@page {
  size: A4;
  margin: 22mm 20mm;
}
h1, h2, h3, h4 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 600;
  color: var(--navy);
  letter-spacing: -0.01em;
}

/* ── PAGES ─────────────────────────────── */
.page {
  page-break-after: always;
  padding: 0;
  min-height: 100vh;
}
.page:last-child { page-break-after: auto; }

/* ── COVER ─────────────────────────────── */
.cover {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 250mm;
  padding: 20mm 0 0;
  text-align: center;
  position: relative;
}
.cover::before {
  content: '';
  display: block;
  position: absolute;
  top: 0; left: 0; right: 0; height: 4mm;
  background: var(--goldb);
}
.cover-logo {
  width: 56px; height: 56px;
  margin: 0 auto 20mm;
  display: inline-block;
}
.cover-eyebrow {
  color: var(--gold);
  font-size: 8.5pt;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 8mm;
}
.cover-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 80pt;
  font-weight: 600;
  font-style: italic;
  color: var(--navy);
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin-bottom: 10mm;
}
.cover-line {
  width: 60px; height: 2px;
  background: var(--goldb);
  margin: 0 auto 10mm;
}
.cover-sub {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16pt;
  font-style: italic;
  color: var(--navy-mid);
  max-width: 130mm;
  margin: 0 auto 16mm;
  line-height: 1.35;
}
.cover-dims {
  font-size: 10pt;
  color: var(--muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 4mm;
  font-weight: 600;
}
.cover-dims .sep { color: var(--gold); margin: 0 8px; }
.cover-dims .gold {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  color: var(--goldb);
  font-size: 14pt;
  letter-spacing: 0;
  text-transform: none;
  display: block;
  margin-top: 4mm;
  font-weight: 600;
}
.cover-author {
  margin-top: auto;
  padding-bottom: 10mm;
}
.cover-author .name {
  font-size: 11pt;
  color: var(--navy);
  letter-spacing: 0.18em;
  font-weight: 700;
  margin-bottom: 3mm;
}
.cover-author .role {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  color: var(--muted);
  font-size: 11pt;
}
.cover-version {
  position: absolute;
  bottom: 8mm;
  left: 0; right: 0;
  font-size: 7.5pt;
  color: var(--muted);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/* ── SECTION HEADERS ─────────────────────────────── */
.section-head {
  text-align: center;
  margin: 0 0 14mm;
  padding-top: 8mm;
}
.section-eyebrow {
  display: inline-block;
  color: var(--gold);
  font-size: 8pt;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 4mm;
  padding: 0 12mm;
  position: relative;
}
.section-eyebrow::before,
.section-eyebrow::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 8mm; height: 1px;
  background: var(--goldb);
}
.section-eyebrow::before { left: 0; }
.section-eyebrow::after { right: 0; }
.section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22pt;
  font-style: italic;
  color: var(--navy);
  font-weight: 500;
  line-height: 1.2;
  max-width: 140mm;
  margin: 0 auto;
}

/* ── PRINCIPLES ─────────────────────────────── */
.principle {
  margin-bottom: 14mm;
  page-break-inside: avoid;
}
.principle-num {
  text-align: center;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 42pt;
  color: var(--goldb);
  line-height: 1;
  margin-bottom: 3mm;
  font-weight: 600;
}
.principle-title {
  text-align: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 18pt;
  font-weight: 600;
  color: var(--navy);
  line-height: 1.25;
  max-width: 145mm;
  margin: 0 auto 8mm;
}
.principle-body p {
  text-align: justify;
  hyphens: auto;
  color: var(--ink-soft);
  margin-bottom: 4mm;
  line-height: 1.65;
}
.pull {
  margin: 7mm 6mm 4mm;
  padding: 4mm 0 4mm 8mm;
  border-left: 3px solid var(--goldb);
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 13.5pt;
  color: var(--navy-mid);
  line-height: 1.4;
}
.divider {
  text-align: center;
  color: var(--goldb);
  letter-spacing: 0.3em;
  margin: 8mm 0;
  font-size: 9pt;
}

/* ── FOUNDATION ─────────────────────────────── */
.text-block p {
  text-align: justify;
  hyphens: auto;
  color: var(--ink-soft);
  margin-bottom: 4mm;
  line-height: 1.65;
}

/* ── CLOSING ─────────────────────────────── */
.call {
  text-align: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 16pt;
  font-style: italic;
  color: var(--navy);
  line-height: 1.55;
  margin-bottom: 1mm;
}
.call.gold { color: var(--gold); font-weight: 600; margin-top: 8mm; }
.signature-block {
  text-align: center;
  margin-top: 18mm;
  padding-top: 8mm;
  border-top: 1px solid var(--border);
  position: relative;
}
.signature-block::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 30mm;
  height: 2px;
  background: var(--goldb);
}
.signature-name {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 20pt;
  color: var(--navy);
  font-weight: 600;
  margin-bottom: 2mm;
}
.signature-role,
.signature-loc {
  font-size: 9.5pt;
  color: var(--muted);
  letter-spacing: 0.02em;
}
.signature-loc { margin-top: 3mm; font-style: italic; }

.principles-intro {
  text-align: center;
  margin: 0 0 12mm;
}
.principles-intro .eyebrow {
  color: var(--gold);
  font-size: 9pt;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 4mm;
}
.principles-intro h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26pt;
  font-style: italic;
  font-weight: 500;
  color: var(--navy);
  max-width: 130mm;
  margin: 0 auto 6mm;
  line-height: 1.2;
}
.dec {
  color: var(--goldb);
  text-align: center;
  font-size: 11pt;
  margin: 4mm 0 8mm;
  letter-spacing: 0.3em;
}
</style>
</head>
<body>

<!-- ====== COVER ====== -->
<div class="page cover">
  <div>
    <svg class="cover-logo" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="12" height="12" rx="2.5" fill="#1e3a5f"/>
      <rect x="15" y="0" width="12" height="12" rx="2.5" fill="#1e3a5f"/>
      <rect x="0" y="15" width="12" height="12" rx="2.5" fill="#1e3a5f"/>
      <rect x="15" y="15" width="12" height="12" rx="2.5" fill="#f4b822"/>
    </svg>
    <div class="cover-eyebrow">${d.brand}</div>
    <div class="cover-title">${d.title1}<br>${d.title2}</div>
    <div class="cover-line"></div>
    <div class="cover-sub">${d.subtitle}</div>
    <div class="cover-dims">
      ${d.dimensions[0]} <span class="sep">·</span>
      ${d.dimensions[1]} <span class="sep">·</span>
      ${d.dimensions[2]}
      <span class="gold">${d.dimensions[3]}</span>
    </div>
  </div>
  <div class="cover-author">
    <div class="name">${d.authorLine}</div>
    <div class="role">${d.authorRole}</div>
  </div>
  <div class="cover-version">${d.versionLine}</div>
</div>

<!-- ====== FOUNDATION ====== -->
<div class="page">
  <div class="section-head">
    <div class="section-eyebrow">${d.foundationTitle}</div>
  </div>
  <div class="text-block">
    ${d.foundationParas.map(p => `<p>${p}</p>`).join('')}
  </div>
  <div class="pull">${d.foundationLead}</div>
  <div class="text-block">
    <p>${d.foundationClose}</p>
  </div>
</div>

<!-- ====== PRINCIPLES ====== -->
<div class="page">
  <div class="principles-intro">
    <div class="eyebrow">${d.principlesTitle}</div>
    <h2>${d.principlesSub}</h2>
    <div class="dec">◆ ◆ ◆</div>
  </div>
  ${d.principles.map((pr, i) => `
    <div class="principle">
      <div class="principle-num">${pr.n}</div>
      <div class="principle-title">${pr.title}</div>
      <div class="principle-body">
        ${pr.body.map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class="pull">${pr.pull}</div>
    </div>
    ${i < d.principles.length - 1 ? '<div class="divider">◆ ◆ ◆</div>' : ''}
  `).join('')}
</div>

<!-- ====== CLOSING ====== -->
<div class="page">
  <div class="section-head">
    <div class="section-eyebrow">${d.closingTitle}</div>
    <div class="section-title">${d.closingSub}</div>
  </div>
  <div class="text-block">
    ${d.closingParas.map(p => `<p>${p}</p>`).join('')}
  </div>
  <div class="divider">◆ ◆ ◆</div>
  <div>
    ${d.callLines.map(l => `<div class="call">${l}</div>`).join('')}
    ${d.callLines2.map(l => `<div class="call gold">${l}</div>`).join('')}
  </div>
  <div class="signature-block">
    <div class="signature-name">${d.authorBlock[0]}</div>
    <div class="signature-role">${d.authorBlock[1]}</div>
    <div class="signature-role">${d.authorBlock[2]}</div>
    <div class="signature-loc">${d.authorBlock[3]}</div>
  </div>
</div>

</body>
</html>`;
}

async function htmlToPdf(html, outPath) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluateHandle('document.fonts.ready');
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
  });
  await browser.close();
}

(async () => {
  const htmlES = buildHTML(ES, 'es');
  const htmlEN = buildHTML(EN, 'en');

  // Guardar HTMLs por si quiere editar
  fs.writeFileSync(`${OUT_DIR}/Manifiesto_Cuarto_Impacto_VF26_ES.html`, htmlES);
  fs.writeFileSync(`${OUT_DIR}/Fourth_Impact_Manifesto_VF26_EN.html`, htmlEN);
  console.log('✅ HTML guardado');

  console.log('⏳ Generando PDF ES...');
  await htmlToPdf(htmlES, `${OUT_DIR}/Manifiesto_Cuarto_Impacto_VF26_ES.pdf`);
  console.log('✅ PDF ES listo');

  console.log('⏳ Generando PDF EN...');
  await htmlToPdf(htmlEN, `${OUT_DIR}/Fourth_Impact_Manifesto_VF26_EN.pdf`);
  console.log('✅ PDF EN listo');

  console.log('\n🎉 Todo generado en:', OUT_DIR);
})();
