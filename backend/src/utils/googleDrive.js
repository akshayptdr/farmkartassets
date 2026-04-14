const { google } = require('googleapis');
const { Readable } = require('stream');

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

async function uploadFileToDrive({ buffer, originalName, mimeType, fileType }) {
  const drive = getDriveClient();

  // Pick the correct folder based on file type
  const folderMap = {
    photo: process.env.GDRIVE_PHOTOS_FOLDER_ID,
    bill: process.env.GDRIVE_BILLS_FOLDER_ID,
    document: process.env.GDRIVE_DOCUMENTS_FOLDER_ID,
  };
  const folderId = folderMap[fileType] || process.env.GDRIVE_PHOTOS_FOLDER_ID;

  const stream = Readable.from(buffer);

  const response = await drive.files.create({
    requestBody: {
      name: originalName,
      parents: folderId ? [folderId] : [],
    },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink, webContentLink',
  });

  // Make file publicly readable so it can be shown in the app
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    drive_file_id: response.data.id,
    web_view_link: response.data.webViewLink,
    web_content_link: response.data.webContentLink,
  };
}

async function deleteFileFromDrive(fileId) {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId });
  } catch (err) {
    // Log but don't crash if file was already removed from Drive
    console.error(`Failed to delete Drive file ${fileId}:`, err.message);
  }
}

module.exports = { uploadFileToDrive, deleteFileFromDrive };
