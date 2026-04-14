const multer = require('multer');

const ALLOWED_TYPES = {
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  bill: ['image/jpeg', 'image/png', 'application/pdf'],
  document: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

function fileFilter(req, file, cb) {
  const fileType = req.body.file_type || 'photo';
  const allowed = ALLOWED_TYPES[fileType] || ALLOWED_TYPES.photo;
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed for ${fileType}`), false);
  }
}

// Use memory storage — files go to Google Drive, not local disk
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }
});

module.exports = { upload };
