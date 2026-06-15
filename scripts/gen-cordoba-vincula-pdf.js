/**
 * Genera PDFs branded de la postulación a Córdoba Vincula 2026 (Propuesta + Carta).
 * Convierte el contenido MD a HTML editorial y de ahí a PDF.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/paulamonte/Desktop/AGENTES IA/El cuarto Impacto/Postulaciones y Convocatorias/Cordoba Vincula 2026';

// ──────────────────────────────────────────────
// Mini-parser de Markdown → HTML (suficiente para nuestros docs)
// ──────────────────────────────────────────────
function mdToHtml(md) {
  let html = md;

  // Tablas
  html = html.replace(/(\|.+\|\n\|[-:|\s]+\|\n(?:\|.+\|\n?)+)/g, (block) => {
    const rows = block.trim().split('\n');
    const head = rows[0].split('|').slice(1, -1).map(c => c.trim());
    const body = rows.slice(2).map(r => r.split('|').slice(1, -1).map(c => c.trim()));
    let t = '<table><thead><tr>' + head.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    body.forEach(row => {
      t += '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>';
    });
    return t + '</tbody></table>';
  });

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

  // Headings
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // Bold/italic
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(/(^- .+(\n  .+)*\n?)+/gm, (block) => {
    const items = block.trim().split('\n').filter(l => l.startsWith('- '));
    return '<ul>' + items.map(i => `<li>${i.substring(2)}</li>`).join('') + '</ul>';
  });

  // Ordered lists
  html = html.replace(/(^\d+\. .+\n?)+/gm, (block) => {
    const items = block.trim().split('\n').filter(l => /^\d+\. /.test(l));
    return '<ol>' + items.map(i => `<li>${i.replace(/^\d+\. /, '')}</li>`).join('') + '</ol>';
  });

  // Paragraphs (líneas sueltas no procesadas)
  html = html.split(/\n{2,}/).map(block => {
    if (/^<(h[1-6]|table|ul|ol|hr|blockquote)/.test(block.trim())) return block;
    if (!block.trim()) return '';
    return '<p>' + block.trim().replace(/\n/g, '<br>') + '</p>';
  }).join('\n');

  return html;
}

function pageLayout(title, content) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');

:root {
  --navy: #0f2137; --navy-mid: #1e3a5f; --gold: #c8920a; --goldb: #f4b822;
  --paper: #faf8f3; --paper-warm: #f4eedf; --ink: #141210; --ink-soft: #3a3530;
  --muted: #76706a; --border: #ece5d5;
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4; margin: 20mm 17mm; }
html, body { background: white; }
body { font-family: var(--sans); color: var(--ink); line-height: 1.55; font-size: 10pt; -webkit-font-smoothing: antialiased; }

h1 { font-family: var(--serif); font-size: 26pt; color: var(--navy); font-weight: 600; letter-spacing: -0.01em; margin: 0 0 6mm; line-height: 1.15; page-break-after: avoid; }
h2 { font-family: var(--serif); font-size: 17pt; color: var(--navy); font-weight: 600; letter-spacing: -0.01em; margin: 10mm 0 4mm; padding-bottom: 2mm; border-bottom: 1px solid var(--border); page-break-after: avoid; }
h3 { font-family: var(--serif); font-size: 13pt; color: var(--navy-mid); font-weight: 600; margin: 6mm 0 2mm; page-break-after: avoid; }
h4 { font-size: 10pt; color: var(--gold); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 4mm 0 2mm; page-break-after: avoid; }

p { margin: 0 0 3mm; text-align: justify; hyphens: auto; color: var(--ink-soft); }
strong { color: var(--navy); font-weight: 600; }
em { font-style: italic; color: var(--navy-mid); }
code { font-family: ui-monospace, Menlo, monospace; font-size: 9pt; background: var(--paper-warm); padding: 1px 5px; border-radius: 3px; color: var(--navy); }
a { color: var(--navy-mid); text-decoration: underline; text-decoration-color: rgba(244,184,34,.4); }

hr { border: none; height: 1px; background: var(--border); margin: 6mm 0; }

ul, ol { margin: 2mm 0 4mm 6mm; padding-left: 4mm; }
li { margin-bottom: 1.5mm; color: var(--ink-soft); }

blockquote {
  margin: 5mm 0; padding: 4mm 6mm; background: var(--paper-warm);
  border-left: 3px solid var(--goldb); font-style: italic;
  font-family: var(--serif); font-size: 11pt; color: var(--navy-mid); border-radius: 0 3px 3px 0;
}

table { width: 100%; border-collapse: collapse; margin: 4mm 0 6mm; font-size: 9pt; page-break-inside: avoid; }
th { text-align: left; padding: 6px 9px; background: var(--paper-warm); color: var(--navy-mid); font-weight: 600; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--border); }
td { padding: 6px 9px; border-bottom: 1px solid var(--border); color: var(--ink-soft); vertical-align: top; }
td strong { color: var(--navy); }

/* COVER */
.cover { page-break-after: always; padding-top: 25mm; text-align: center; min-height: 250mm; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
.cover::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4mm; background: var(--goldb); }
.cover .logo { width: 56px; height: 56px; margin: 0 auto 14mm; background: var(--paper-warm); padding: 12px; border-radius: 12px; }
.cover .eyebrow { color: var(--gold); font-size: 9pt; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 700; margin-bottom: 6mm; }
.cover h1 { font-family: var(--serif); font-size: 36pt; font-weight: 500; font-style: italic; color: var(--navy); letter-spacing: -0.02em; line-height: 1.05; margin-bottom: 8mm; border: none; }
.cover .sub { font-family: var(--serif); font-size: 16pt; font-style: italic; color: var(--navy-mid); max-width: 140mm; margin: 0 auto 14mm; line-height: 1.4; }
.cover .meta { background: var(--paper-warm); padding: 10mm; max-width: 140mm; margin: 0 auto; border-radius: 6px; text-align: left; }
.cover .meta dl { display: grid; grid-template-columns: 70mm 1fr; gap: 4px 14px; font-size: 9pt; }
.cover .meta dt { color: var(--muted); font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; padding-top: 1px; }
.cover .meta dd { color: var(--ink); }
.cover .foot { margin-top: auto; padding-bottom: 8mm; font-size: 9pt; color: var(--muted); letter-spacing: 0.05em; font-style: italic; }
.cover .foot strong { color: var(--navy); font-style: normal; }

.content { padding: 0; }
</style>
</head>
<body>
${content}
</body>
</html>`;
}

function buildPropuestaHTML(md) {
  // Saltar el primer H1 porque va en el cover
  const mdSinTitulo = md.replace(/^# Proyecto · Piloto Córdoba\n\n## ([^\n]+)\n\n/, '');

  const cover = `
  <div class="cover">
    <div>
      <svg class="logo" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="12" height="12" rx="2.5" fill="#1e3a5f"/>
        <rect x="15" y="0" width="12" height="12" rx="2.5" fill="#1e3a5f"/>
        <rect x="0" y="15" width="12" height="12" rx="2.5" fill="#1e3a5f"/>
        <rect x="15" y="15" width="12" height="12" rx="2.5" fill="#f4b822"/>
      </svg>
      <div class="eyebrow">El Cuarto Impacto · Postulación</div>
      <h1>Piloto<br>Córdoba</h1>
      <div class="sub">Implementación de la Certificación A · Empresa Aumentada<br>en PyMEs del ecosistema productivo cordobés</div>
      <div class="meta">
        <dl>
          <dt>Convocatoria</dt><dd>Córdoba Vincula 2026 — Agencia Córdoba Innovar y Emprender</dd>
          <dt>Postulante líder</dt><dd>PM Consultora Empresarial</dd>
          <dt>Aliado del sector productivo</dt><dd>Córdoba Technology Cluster <em>(a gestionar)</em></dd>
          <dt>Duración</dt><dd>5 meses</dd>
          <dt>Monto solicitado (ANR)</dt><dd>$6.000.000 ARS — hasta el 80% del proyecto</dd>
          <dt>Cierre postulación</dt><dd>8 de julio de 2026</dd>
        </dl>
      </div>
    </div>
    <div class="foot">
      <strong>Paula Monte</strong> · Empresaria · Speaker · Creadora del Cuarto Impacto<br>
      PM Consultora Empresarial — Córdoba, Argentina · Junio 2026
    </div>
  </div>`;

  return pageLayout('Propuesta · Piloto Córdoba · Cuarto Impacto', cover + '<div class="content">' + mdToHtml(mdSinTitulo) + '</div>');
}

function buildCartaHTML(md) {
  return pageLayout('Carta tipo · Postulación Córdoba Vincula 2026', `<div class="content">${mdToHtml(md)}</div>`);
}

async function renderPdf(html, outPath) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluateHandle('document.fonts.ready');
  await page.pdf({ path: outPath, format: 'A4', printBackground: true, margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' } });
  await browser.close();
}

(async () => {
  const propMd = fs.readFileSync(path.join(OUT_DIR, 'PROPUESTA_Cordoba_Vincula_2026.md'), 'utf8');
  const cartaMd = fs.readFileSync(path.join(OUT_DIR, 'Carta_Aliado_TIPO.md'), 'utf8');

  console.log('⏳ Generando PDF de Propuesta...');
  fs.writeFileSync(path.join(OUT_DIR, 'PROPUESTA_Cordoba_Vincula_2026.html'), buildPropuestaHTML(propMd));
  await renderPdf(buildPropuestaHTML(propMd), path.join(OUT_DIR, 'PROPUESTA_Cordoba_Vincula_2026.pdf'));
  console.log('✅ PROPUESTA_Cordoba_Vincula_2026.pdf');

  console.log('⏳ Generando PDF de Carta tipo...');
  fs.writeFileSync(path.join(OUT_DIR, 'Carta_Aliado_TIPO.html'), buildCartaHTML(cartaMd));
  await renderPdf(buildCartaHTML(cartaMd), path.join(OUT_DIR, 'Carta_Aliado_TIPO.pdf'));
  console.log('✅ Carta_Aliado_TIPO.pdf');

  console.log('\n📂 ' + OUT_DIR);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
