const multer = require('multer');
const path = require('path');

// Set up multer for file storage in temp dir
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'temp/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

// Validate file type (only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isMimeValid = allowedTypes.test(file.mimetype);
  const isExtValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'), false);
  }
};

// ✅ THIS is the multer instance with .single(), etc.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// ✅ Correct export — DO NOT wrap in an object
module.exports = upload;
