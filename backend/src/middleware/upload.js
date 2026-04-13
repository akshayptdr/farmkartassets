const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_TYPES = {
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  bill: ['image/jpeg', 'image/png', 'application/pdf'],
  document: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.body.file_type || 'photo';
    const dir = path.resolve(process.env.UPLOAD_DIR || './uploads', fileType + 's');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

function fileFilter(req, file, cb) {
  const fileType = req.body.file_type || 'photo';
  const allowed = ALLOWED_TYPES[fileType] || ALLOWED_TYPES.photo;
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed for ${fileType}`), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }
});

module.exports = { upload };
