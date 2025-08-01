// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create a storage engine using multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'odin-social', // You can name this folder anything you want
    allowed_formats: ['jpeg', 'png', 'jpg'],
  },
});

module.exports = {
  cloudinary,
  storage,
};

