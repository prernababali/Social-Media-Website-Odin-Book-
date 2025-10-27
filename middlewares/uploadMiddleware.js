const multer = require('multer');
const path = require('path');

// Set up multer for file storage in temp dir
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');

  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

// Validate file type (only images)
const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv/;
const allowedMimeTypes = /image\/jpeg|image\/jpg|image\/png|image\/gif|video\/mp4|video\/quicktime|video\/x-msvideo|video\/x-matroska/;

const fileFilter = (req, file, cb) => {
  const isMimeValid = allowedMimeTypes.test(file.mimetype);
  const isExtValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};


// ✅ THIS is the multer instance with .single(), etc.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB max

});

// ✅ Correct export — DO NOT wrap in an object
module.exports = upload;
