/**
 * Genera un PDF branded del documento de accesos del proyecto.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = '/Users/paulamonte/Desktop/AGENTES IA/El cuarto Impacto/Accesos y Credenciales';

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Accesos del Proyecto · El Cuarto Impacto</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --navy: #0f2137; --navy-mid: #1e3a5f; --gold: #c8920a; --goldb: #f4b822;
  --paper: #faf8f3; --paper-warm: #f4eedf; --ink: #141210; --ink-soft: #3a3530;
  --muted: #76706a; --border: #ece5d5;
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4; margin: 18mm 16mm; }
html, body { background: white; }
body {
  font-family: var(--sans); color: var(--ink); line-height: 1.55;
  font-size: 10pt; -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4 { font-family: var(--serif); color: var(--navy); letter-spacing: -0.01em; }

/* COVER */
.cover {
  page-break-after: always;
  display: flex; flex-direction: column; justify-content: space-between;
  min-height: 250mm; padding-top: 30mm; text-align: center; position: relative;
}
.cover::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4mm;
  background: var(--goldb);
}
.logo {
  width: 56px; height: 56px; margin: 0 auto 20mm;
  background: var(--paper-warm); padding: 12px; border-radius: 12px;
}
.cover-eyebrow {
  color: var(--gold); font-size: 9pt; letter-spacing: 0.25em;
  text-transform: uppercase; font-weight: 700; margin-bottom: 6mm;
}
.cover h1 {
  font-family: var(--serif); font-size: 60pt; font-style: italic;
  color: var(--navy); line-height: 0.95; letter-spacing: -0.02em;
  font-weight: 600; margin-bottom: 8mm;
}
.cover-line { width: 60px; height: 2px; background: var(--goldb); margin: 0 auto 8mm; }
.cover-sub {
  font-family: var(--serif); font-size: 14pt; font-style: italic;
  color: var(--navy-mid); max-width: 130mm; margin: 0 auto;
}
.cover-warn {
  margin-top: 20mm; padding: 12mm 14mm; background: var(--paper-warm);
  border-left: 3px solid var(--goldb); border-radius: 4px;
  text-align: left; max-width: 140mm; margin-left: auto; margin-right: auto;
}
.cover-warn strong { color: var(--gold); }
.cover-foot {
  margin-top: auto; padding-bottom: 10mm;
  font-size: 9pt; color: var(--muted); letter-spacing: 0.05em;
}
.cover-foot strong { color: var(--navy); }

/* SECTIONS */
.section { margin-bottom: 14mm; page-break-inside: avoid; }
.section-head {
  display: flex; align-items: center; gap: 10px;
  padding-bottom: 4mm; margin-bottom: 6mm;
  border-bottom: 1px solid var(--border);
}
.section-num {
  display: inline-grid; place-items: center;
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--goldb); color: var(--navy);
  font-family: var(--serif); font-size: 14pt; font-weight: 700;
  font-style: italic;
}
.section-head h2 { font-size: 18pt; color: var(--navy); font-weight: 600; }

/* TABLE */
table {
  width: 100%; border-collapse: collapse; font-size: 9.5pt;
  margin-bottom: 4mm;
}
th {
  text-align: left; padding: 8px 10px; background: var(--paper-warm);
  font-size: 8pt; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--navy-mid); font-weight: 600; border-bottom: 1px solid var(--border);
}
td {
  padding: 8px 10px; border-bottom: 1px solid var(--border);
  color: var(--ink-soft); vertical-align: top;
}
td.key { font-weight: 600; color: var(--navy); width: 35%; }
td.val { font-family: var(--mono); font-size: 9pt; color: var(--ink); word-break: break-all; }

/* CARDS / KV */
.kv {
  display: grid; grid-template-columns: 100px 1fr;
  gap: 5px 14px; font-size: 9.5pt; margin-bottom: 6mm;
}
.kv dt {
  color: var(--muted); font-size: 8pt; text-transform: uppercase;
  letter-spacing: 0.08em; font-weight: 600; padding-top: 1px;
}
.kv dd { color: var(--ink-soft); }
.kv dd code, code.inline {
  font-family: var(--mono); font-size: 9pt; background: var(--paper-warm);
  padding: 1px 6px; border-radius: 3px; color: var(--navy);
}

.note {
  background: rgba(244,184,34,0.07); border-left: 2px solid var(--goldb);
  padding: 10px 14px; margin: 6mm 0; border-radius: 0 4px 4px 0;
  font-size: 9pt; color: var(--ink-soft);
}
.note strong { color: var(--navy); }

.security-warn {
  background: #fef3c7; border-left: 3px solid #d97706;
  padding: 12px 16px; border-radius: 4px; margin: 6mm 0;
  font-size: 9.5pt; color: #92400e;
}
.security-warn strong { color: #78350f; }

ul.bullets { padding-left: 18px; margin: 4mm 0; }
ul.bullets li { margin-bottom: 3mm; color: var(--ink-soft); }

.footer-line {
  margin-top: 14mm; padding-top: 6mm;
  border-top: 1px solid var(--border); text-align: center;
  font-size: 8pt; color: var(--muted); font-style: italic;
}
</style>
</head>
<body>

<!-- ═══ COVER ═══ -->
<div class="cover">
  <div>
    <svg class="logo" viewBox="0 0 28 28" fill="none">
      <rect x="0" y="0" width="12" height="12" rx="2.5" fill="#1e3a5f"/>
      <rect x="15" y="0" width="12" height="12" rx="2.5" fill="#1e3a5f"/>
      <rect x="0" y="15" width="12" height="12" rx="2.5" fill="#1e3a5f"/>
      <rect x="15" y="15" width="12" height="12" rx="2.5" fill="#f4b822"/>
    </svg>
    <div class="cover-eyebrow">El Cuarto Impacto</div>
    <h1>Accesos<br>del Proyecto</h1>
    <div class="cover-line"></div>
    <div class="cover-sub">Documento maestro de servicios, URLs<br>y datos de acceso del ecosistema técnico</div>

    <div class="cover-warn">
      <strong>⚠ Confidencial</strong><br>
      Este documento contiene URLs, cuentas y referencias a credenciales sensibles.
      Las contraseñas reales NO están aquí — están guardadas en tu gestor personal.
      No compartir sin razón fundada.
    </div>
  </div>
  <div class="cover-foot">
    <strong>Paula Monte</strong> · PM Consultora Empresarial<br>
    Córdoba, Argentina — Junio 2026
  </div>
</div>

<!-- ═══ SECCIÓN 1: SITIOS WEB ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num" style="font-family:var(--serif)">I</span>
    <h2>Sitios web</h2>
  </div>
  <table>
    <thead><tr><th style="width:32%">Servicio</th><th>URL</th></tr></thead>
    <tbody>
      <tr><td class="key">Sitio público</td><td class="val">https://elcuartoimpacto.com</td></tr>
      <tr><td class="key">Adhesión al Manifiesto</td><td class="val">/adherir.html</td></tr>
      <tr><td class="key">Directorio adherentes</td><td class="val">/adherentes.html</td></tr>
      <tr><td class="key">Diagnóstico público</td><td class="val">/diagnostico.html</td></tr>
      <tr><td class="key">Verificación de sello</td><td class="val">/verificar.html?codigo=XXX</td></tr>
      <tr><td class="key">Panel admin (CRM)</td><td class="val">https://cuarto-impacto-sistema-1.onrender.com</td></tr>
    </tbody>
  </table>
</div>

<!-- ═══ SECCIÓN 2: EMAIL ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num">II</span>
    <h2>Email · info@elcuartoimpacto.com</h2>
  </div>
  <dl class="kv">
    <dt>Servicio</dt><dd>GoDaddy Titan (plan Profesional Pro Light)</dd>
    <dt>Webmail</dt><dd><code>https://email.titan.email</code></dd>
    <dt>Usuario</dt><dd><code>info@elcuartoimpacto.com</code></dd>
    <dt>Contraseña</dt><dd>en tu gestor personal · 🔒</dd>
    <dt>SMTP host</dt><dd><code>smtp.titan.email</code> puerto <code>465</code> (SSL)</dd>
  </dl>

  <div class="note">
    <strong>Sobre los emails automáticos del sistema:</strong> los envía <strong>Resend</strong> usando el dominio
    <code class="inline">elcuartoimpacto.com</code> (DKIM + SPF verificados en GoDaddy DNS).
    Dashboard de Resend: <code class="inline">https://resend.com</code> · login con <code class="inline">pmtalentconsulting@gmail.com</code>.
  </div>
</div>

<!-- ═══ SECCIÓN 3: BD ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num">III</span>
    <h2>Base de datos · Supabase</h2>
  </div>
  <dl class="kv">
    <dt>Dashboard</dt><dd><code>https://supabase.com</code></dd>
    <dt>Login</dt><dd><code>pmtalentconsulting@gmail.com</code></dd>
    <dt>Proyecto</dt><dd>El Cuarto Impacto</dd>
    <dt>URL proyecto</dt><dd><code>https://hbginnqhpoppadhfxalp.supabase.co</code></dd>
    <dt>Tablas activas</dt><dd>empresas, usuarios, diagnosticos, certificaciones, evidencias, miembros_red, pagos, sellos, audit_log, adherentes, contactos</dd>
  </dl>
</div>

<!-- ═══ SECCIÓN 4: BACKEND ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num">IV</span>
    <h2>Backend · Render</h2>
  </div>
  <dl class="kv">
    <dt>Dashboard</dt><dd><code>https://dashboard.render.com</code></dd>
    <dt>Login</dt><dd>vía GitHub (cuenta <strong>PmConsultora</strong>)</dd>
    <dt>Servicio</dt><dd>cuarto-impacto-sistema-1</dd>
    <dt>URL producción</dt><dd><code>https://cuarto-impacto-sistema-1.onrender.com</code></dd>
    <dt>Plan</dt><dd>Free — se duerme tras 15 min de inactividad</dd>
    <dt>Health check</dt><dd><code>/api/health</code></dd>
  </dl>
</div>

<!-- ═══ SECCIÓN 5: FRONTEND ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num">V</span>
    <h2>Frontend · Netlify</h2>
  </div>
  <dl class="kv">
    <dt>Dashboard</dt><dd><code>https://app.netlify.com</code></dd>
    <dt>Login</dt><dd>vía GitHub (cuenta <strong>PmConsultora</strong>)</dd>
    <dt>Sitio</dt><dd>elcuartoimpacto</dd>
    <dt>Dominio</dt><dd><code>elcuartoimpacto.com</code></dd>
    <dt>Repo</dt><dd><code>PmConsultora/elcuartoimpacto-web</code></dd>
    <dt>Deploy</dt><dd>automático en cada <code class="inline">git push</code> a main</dd>
  </dl>
</div>

<!-- ═══ SECCIÓN 6: GITHUB ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num">VI</span>
    <h2>GitHub · Código fuente</h2>
  </div>
  <dl class="kv">
    <dt>Usuario</dt><dd><code>PmConsultora</code></dd>
    <dt>Email</dt><dd><code>pmtalentconsulting@gmail.com</code></dd>
    <dt>Backend repo</dt><dd><code>github.com/PmConsultora/cuarto-impacto-sistema</code></dd>
    <dt>Web repo</dt><dd><code>github.com/PmConsultora/elcuartoimpacto-web</code></dd>
  </dl>
</div>

<!-- ═══ SECCIÓN 7: DRIVE ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num">VII</span>
    <h2>Drive · Documentos del proyecto</h2>
  </div>
  <dl class="kv">
    <dt>Carpeta raíz</dt><dd><code>drive.google.com/drive/folders/102XF8mx5EPXYWCPQbeo2RYs8lGkdX_AF</code></dd>
    <dt>Propietaria</dt><dd><code>pmtalentconsulting@gmail.com</code></dd>
  </dl>

  <strong style="font-size:9pt;color:var(--navy-mid);text-transform:uppercase;letter-spacing:.1em">Estructura</strong>
  <ul class="bullets">
    <li><strong>01 · Modelo de Negocio</strong> — manifiestos oficiales, este documento</li>
    <li><strong>02 · Legal y ONG</strong> — documentos legales</li>
    <li><strong>03 · Desarrollo de Software</strong> — código backend, frontend, SQL, scripts</li>
    <li><strong>04 · Web y Diagnóstico</strong> — código del sitio público</li>
    <li><strong>05 · Comunicación</strong> — materiales de marketing</li>
    <li><strong>06 · Operación de la Red</strong> — datos de consultores y certificadores</li>
    <li><strong>Branding</strong> — assets de marca (NO MODIFICAR)</li>
  </ul>

  <div class="note">
    <strong>Sincronización automática:</strong> el comando <code class="inline">npm run sync-drive</code>
    desde la carpeta <code class="inline">sistema/</code> sube todo el código nuevo a la subcarpeta
    correspondiente. Cada vez que desarrollemos algo, se ejecuta para mantener el Drive actualizado.
  </div>
</div>

<!-- ═══ SECCIÓN 8: PAGOS ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num">VIII</span>
    <h2>Pagos (pendiente de configurar)</h2>
  </div>
  <dl class="kv">
    <dt>MercadoPago</dt><dd><code>mercadopago.com.ar/developers</code> · sin credenciales · ARS</dd>
    <dt>Stripe</dt><dd><code>dashboard.stripe.com</code> · sin credenciales · USD</dd>
  </dl>
  <div class="note">
    El código del sistema ya está integrado con ambas pasarelas. Solo falta cargar las API keys
    en las variables de entorno de Render cuando estés lista para activar los cobros.
  </div>
</div>

<!-- ═══ SECCIÓN 9: COMANDOS ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num">IX</span>
    <h2>Comandos útiles</h2>
  </div>
  <p style="margin-bottom:4mm;color:var(--muted);font-size:9pt">Desde Terminal, parada en la carpeta <code class="inline">sistema/</code>:</p>
  <table>
    <thead><tr><th>Comando</th><th>Qué hace</th></tr></thead>
    <tbody>
      <tr><td class="val">npm run dev</td><td>Levanta el servidor local en localhost:3100</td></tr>
      <tr><td class="val">npm run setup</td><td>Verifica que todas las conexiones funcionen</td></tr>
      <tr><td class="val">npm run crear-admin</td><td>Crea un nuevo usuario admin del panel</td></tr>
      <tr><td class="val">npm run sync-drive</td><td>Sincroniza todo el proyecto a Drive</td></tr>
      <tr><td class="val">npm run sync-drive:dry</td><td>Muestra qué subiría sin subir nada</td></tr>
    </tbody>
  </table>
</div>

<!-- ═══ SEGURIDAD ═══ -->
<div class="section">
  <div class="section-head">
    <span class="section-num" style="background:#92400e;color:white">!</span>
    <h2>Buenas prácticas de seguridad</h2>
  </div>
  <ul class="bullets">
    <li>Las contraseñas NO están en este documento. Guardalas en tu gestor de contraseñas (Bitwarden / 1Password / Apple Passwords).</li>
    <li>El archivo <code class="inline">.env</code> del proyecto NUNCA se sube a Git (está en <code class="inline">.gitignore</code>).</li>
    <li>Activá 2FA (autenticación en dos pasos) en Google, GitHub y Supabase.</li>
    <li>Si cambiás una contraseña importante, actualizá también este documento.</li>
    <li>Si cambias de equipo (Mac nuevo), necesitás clonar los repos + restaurar el <code class="inline">.env</code> desde un backup seguro.</li>
  </ul>
</div>

<div class="footer-line">
  El Cuarto Impacto · La responsabilidad digital como cuarta dimensión del valor empresarial<br>
  elcuartoimpacto.com · info@elcuartoimpacto.com
</div>

</body>
</html>`;

(async () => {
  fs.writeFileSync(path.join(OUT_DIR, 'Accesos_del_Proyecto.html'), html);
  console.log('✅ HTML guardado');

  console.log('⏳ Generando PDF...');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluateHandle('document.fonts.ready');
  await page.pdf({
    path: path.join(OUT_DIR, 'Accesos_del_Proyecto.pdf'),
    format: 'A4', printBackground: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
  });
  await browser.close();
  console.log('✅ PDF listo');
  console.log('\n📂 ' + OUT_DIR);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
