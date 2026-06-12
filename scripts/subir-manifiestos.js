/**
 * Sube los manifiestos oficiales a Google Drive (01 · Modelo de Negocio).
 * Crea una subcarpeta "Manifiesto VF26 - DEFINITIVO" para mantenerlos juntos.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SRC_DIR = '/Users/paulamonte/Desktop/AGENTES IA/El cuarto Impacto/Manifiestos Oficiales';
const PARENT_FOLDER = process.env.DRIVE_FOLDER_MODELO; // 01 · Modelo de Negocio
const SUBFOLDER_NAME = 'Manifiesto VF26 - DEFINITIVO';

function auth() {
  const a = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  a.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return a;
}

async function getOrCreateSubfolder(drive) {
  // Buscar si ya existe
  const { data } = await drive.files.list({
    q: `'${PARENT_FOLDER}' in parents and name='${SUBFOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });
  if (data.files.length > 0) {
    console.log(`📁 Subcarpeta ya existía: ${SUBFOLDER_NAME}`);
    return data.files[0].id;
  }
  const created = await drive.files.create({
    requestBody: {
      name: SUBFOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [PARENT_FOLDER],
    },
    fields: 'id',
  });
  console.log(`📁 Subcarpeta creada: ${SUBFOLDER_NAME}`);
  return created.data.id;
}

const MIME = {
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf':  'application/pdf',
  '.html': 'text/html',
};

async function uploadFile(drive, folderId, filePath) {
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = MIME[ext] || 'application/octet-stream';

  // Si ya existe un archivo con ese nombre, lo borramos (reemplazamos)
  const { data: list } = await drive.files.list({
    q: `'${folderId}' in parents and name='${filename}' and trashed=false`,
    fields: 'files(id)',
  });
  for (const f of list.files) {
    await drive.files.delete({ fileId: f.id });
  }

  const { data } = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: fs.createReadStream(filePath) },
    fields: 'id, name, webViewLink',
  });
  console.log(`✅ ${filename}`);
  console.log(`   → ${data.webViewLink}`);
  return data;
}

(async () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Subir manifiestos a Drive            ║');
  console.log('╚════════════════════════════════════════╝\n');

  const drive = google.drive({ version: 'v3', auth: auth() });
  const folderId = await getOrCreateSubfolder(drive);

  const files = [
    'Manifiesto_Cuarto_Impacto_VF26_ES.docx',
    'Manifiesto_Cuarto_Impacto_VF26_ES.pdf',
    'Fourth_Impact_Manifesto_VF26_EN.docx',
    'Fourth_Impact_Manifesto_VF26_EN.pdf',
  ];

  console.log('');
  for (const f of files) {
    await uploadFile(drive, folderId, path.join(SRC_DIR, f));
  }

  console.log('\n🎉 Manifiestos oficiales subidos a Drive\n');
  console.log(`📂 https://drive.google.com/drive/folders/${folderId}\n`);
})().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
