/**
 * Sincronización automática a Google Drive.
 *
 * Sube todos los archivos del proyecto a la carpeta correspondiente en Drive,
 * manteniendo la estructura organizada y reemplazando versiones anteriores.
 *
 * Uso:
 *   node scripts/sync-drive.js                  → sincroniza todo
 *   node scripts/sync-drive.js --section=web    → solo una sección
 *   node scripts/sync-drive.js --dry-run        → muestra qué subiría sin subir
 *
 * Estructura en Drive (todas dentro de "El cuarto impacto"):
 *   04 · Web y Diagnóstico → contenido del sitio público
 *   03 · Desarrollo de Software → backend, scripts, SQL, configs
 *   01 · Modelo de Negocio → manifiestos oficiales, documentos del modelo
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const mime = require('mime-types') || null;

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SISTEMA_DIR  = path.join(PROJECT_ROOT, 'sistema');
const WEB_DIR      = path.join(PROJECT_ROOT, 'elcuartoimpacto-web');
const MANIFIESTOS_DIR = path.join(PROJECT_ROOT, 'Manifiestos Oficiales');

const FOLDERS = {
  web:      process.env.DRIVE_FOLDER_WEB,
  modelo:   process.env.DRIVE_FOLDER_MODELO,
  software: process.env.DRIVE_FOLDER_SOFTWARE,
  legal:    process.env.DRIVE_FOLDER_LEGAL,
  comun:    process.env.DRIVE_FOLDER_COMUN,
  red:      process.env.DRIVE_FOLDER_RED,
};

// ──────────────────────────────────────────────
// Definición de qué se sube y dónde
// ──────────────────────────────────────────────
const ACCESOS_DIR = path.join(PROJECT_ROOT, 'Accesos y Credenciales');

const SYNC_PLAN = [
  // ── Manifiestos oficiales → Modelo de Negocio
  {
    section: 'modelo',
    subfolder: 'Manifiesto VF26 - DEFINITIVO',
    sources: [
      { dir: MANIFIESTOS_DIR, pattern: /\.(docx|pdf)$/i },
    ],
    description: 'Manifiestos oficiales VF26 (ES + EN, Word + PDF)',
  },

  // ── Accesos y credenciales (referencias, no contraseñas) → Modelo de Negocio
  {
    section: 'modelo',
    subfolder: 'Accesos y Credenciales',
    sources: [
      { dir: ACCESOS_DIR, pattern: /\.(md|pdf|html)$/i },
    ],
    description: 'Documento maestro con URLs y datos de acceso a todos los servicios',
  },

  // ── Sitio web público → Web y Diagnóstico
  {
    section: 'web',
    subfolder: 'Sitio Público - Código Fuente',
    sources: [
      { dir: WEB_DIR, pattern: /\.(html|css|js|toml|md)$/i, recursive: true, exclude: [/^\.git/, /node_modules/] },
    ],
    description: 'Código fuente del sitio elcuartoimpacto.com (index, adherir, adherentes, diagnostico, verificar)',
  },

  // ── Backend sistema → Desarrollo de Software
  {
    section: 'software',
    subfolder: 'Sistema CRM - Backend',
    sources: [
      { dir: path.join(SISTEMA_DIR, 'backend'), pattern: /\.(js|json|md)$/i, recursive: true, exclude: [/node_modules/, /^assets\/.*\.pdf$/i] },
    ],
    description: 'Backend del sistema de gestión (rutas, servicios, middleware)',
  },

  // ── Frontend del panel → Desarrollo de Software
  {
    section: 'software',
    subfolder: 'Sistema CRM - Panel Frontend',
    sources: [
      { dir: path.join(SISTEMA_DIR, 'frontend'), pattern: /\.(html|css|js|svg)$/i, recursive: true },
    ],
    description: 'Frontend del panel admin (login, dashboard, vistas)',
  },

  // ── SQL + configuración → Desarrollo de Software
  {
    section: 'software',
    subfolder: 'Base de Datos - SQL y Configuración',
    sources: [
      { dir: path.join(SISTEMA_DIR, 'config'), pattern: /\.(sql|md)$/i, recursive: true },
    ],
    description: 'Esquemas SQL, políticas RLS, configuración de Supabase',
  },

  // ── Scripts utilitarios → Desarrollo de Software
  {
    section: 'software',
    subfolder: 'Scripts - Utilidades',
    sources: [
      { dir: path.join(SISTEMA_DIR, 'scripts'), pattern: /\.(js|md)$/i },
    ],
    description: 'Scripts de mantenimiento (crear admin, test email, sync drive, etc.)',
  },
];

// ──────────────────────────────────────────────
// Drive helpers
// ──────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SECTION_FILTER = (args.find(a => a.startsWith('--section=')) || '').split('=')[1];

function getAuth() {
  const a = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  a.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return a;
}
const drive = google.drive({ version: 'v3', auth: getAuth() });

async function findOrCreateFolder(name, parentId) {
  const { data } = await drive.files.list({
    q: `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });
  if (data.files.length > 0) return data.files[0].id;
  const created = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
  });
  return created.data.id;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.md': 'text/markdown', '.txt': 'text/plain',
    '.sql': 'application/sql', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.toml': 'application/toml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  };
  return map[ext] || 'application/octet-stream';
}

async function uploadOrReplace(folderId, filePath, displayName) {
  const filename = displayName || path.basename(filePath);
  const mimeType = getMimeType(filename);

  if (DRY_RUN) {
    console.log(`   • ${filename}`);
    return;
  }

  // Buscar archivo existente con ese nombre
  const { data: list } = await drive.files.list({
    q: `'${folderId}' in parents and name='${filename.replace(/'/g, "\\'")}' and trashed=false`,
    fields: 'files(id)',
  });

  // Si existe, eliminar (más confiable que update con multipart)
  for (const f of list.files) {
    try { await drive.files.delete({ fileId: f.id }); } catch (e) { /* ignore */ }
  }

  const { data } = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: fs.createReadStream(filePath) },
    fields: 'id, name',
  });
  console.log(`   ✅ ${filename}`);
}

function walkDir(dir, pattern, recursive, exclude = [], baseDir = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(baseDir, full);

    if (exclude.some(rx => rx.test(rel) || rx.test(entry.name))) continue;

    if (entry.isDirectory()) {
      if (recursive) out.push(...walkDir(full, pattern, recursive, exclude, baseDir));
    } else if (pattern.test(entry.name)) {
      out.push({ full, rel });
    }
  }
  return out;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
(async () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   Sincronización a Google Drive                  ║');
  console.log('╚══════════════════════════════════════════════════╝');
  if (DRY_RUN) console.log('🧪 DRY RUN — solo muestra lo que subiría\n');

  let totalFiles = 0;

  for (const plan of SYNC_PLAN) {
    if (SECTION_FILTER && plan.section !== SECTION_FILTER) continue;

    const parentId = FOLDERS[plan.section];
    if (!parentId) {
      console.log(`⚠️  Sección ${plan.section} sin folder ID configurado — salteando`);
      continue;
    }

    console.log(`\n📁 [${plan.section.toUpperCase()}] ${plan.subfolder}`);
    console.log(`   ${plan.description}`);

    const folderId = DRY_RUN ? '[dry-run]' : await findOrCreateFolder(plan.subfolder, parentId);

    let count = 0;
    for (const src of plan.sources) {
      const files = walkDir(src.dir, src.pattern, !!src.recursive, src.exclude || []);
      for (const file of files) {
        // Para mantener jerarquía cuando hay recursive, aplanamos con guión
        const displayName = src.recursive && file.rel !== path.basename(file.full)
          ? file.rel.replace(/[\/\\]/g, '_')
          : path.basename(file.full);
        await uploadOrReplace(folderId, file.full, displayName);
        count++; totalFiles++;
      }
    }
    console.log(`   ${count} archivo${count !== 1 ? 's' : ''} procesados`);
  }

  console.log(`\n${DRY_RUN ? '🧪' : '🎉'} ${totalFiles} archivos ${DRY_RUN ? 'detectados' : 'sincronizados'}`);
  if (!DRY_RUN) {
    console.log(`\n📂 https://drive.google.com/drive/folders/${process.env.DRIVE_ROOT_FOLDER}\n`);
  }
})().catch(e => {
  console.error('\n❌ Error:', e.message);
  console.error(e.stack);
  process.exit(1);
});
