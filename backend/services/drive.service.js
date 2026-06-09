const { google } = require('googleapis');

const FOLDERS = {
  web:      process.env.DRIVE_FOLDER_WEB,
  modelo:   process.env.DRIVE_FOLDER_MODELO,
  software: process.env.DRIVE_FOLDER_SOFTWARE,
  legal:    process.env.DRIVE_FOLDER_LEGAL,
  comun:    process.env.DRIVE_FOLDER_COMUN,
  red:      process.env.DRIVE_FOLDER_RED,
};

function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return auth;
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

async function uploadFile({ nombre, mimeType, buffer, destino }) {
  const drive = getDrive();
  const folderId = FOLDERS[destino] || process.env.DRIVE_ROOT_FOLDER;

  const { data } = await drive.files.create({
    requestBody: {
      name: nombre,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: require('stream').Readable.from(buffer),
    },
    fields: 'id, name, webViewLink',
  });

  return data;
}

async function listFiles(destino) {
  const drive = getDrive();
  const folderId = FOLDERS[destino] || process.env.DRIVE_ROOT_FOLDER;

  const { data } = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, createdTime, webViewLink)',
    orderBy: 'createdTime desc',
  });

  return data.files;
}

async function getFile(fileId) {
  const drive = getDrive();
  const { data } = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, createdTime, webViewLink, size',
  });
  return data;
}

async function deleteFile(fileId) {
  const drive = getDrive();
  await drive.files.delete({ fileId });
}

async function testConnection() {
  const drive = getDrive();
  const { data } = await drive.files.get({
    fileId: process.env.DRIVE_ROOT_FOLDER,
    fields: 'id, name',
  });
  return data;
}

module.exports = { uploadFile, listFiles, getFile, deleteFile, testConnection, FOLDERS };
