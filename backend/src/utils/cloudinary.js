const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Folder in Cloudinary per file type
const FOLDER_MAP = {
  photo: 'asset-management/photos',
  bill: 'asset-management/bills',
  document: 'asset-management/documents',
};

async function uploadFileToCloudinary({ buffer, originalName, mimeType, fileType }) {
  const folder = FOLDER_MAP[fileType] || FOLDER_MAP.photo;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // handles images + PDFs + docs
        public_id: `${Date.now()}-${originalName.replace(/\.[^.]+$/, '').replace(/\s+/g, '_')}`,
        use_filename: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          drive_file_id: result.public_id,   // reuse same DB column name
          web_view_link: result.secure_url,   // direct URL to the file
        });
      }
    );
    uploadStream.end(buffer);
  });
}

async function deleteFileFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
  } catch (err) {
    console.error(`Failed to delete Cloudinary file ${publicId}:`, err.message);
  }
}

module.exports = { uploadFileToCloudinary, deleteFileFromCloudinary };
