const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

console.log('✅ authRoutes loaded');
console.log('🧪 getRegister:', typeof authController.getRegister);
console.log('🧪 postRegister:', typeof authController.postRegister);
console.log('🧪 getLogin:', typeof authController.getLogin);
console.log('🧪 postLogin:', typeof authController.postLogin);
console.log('🧪 logout:', typeof authController.logout);

// Register
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// Login
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// Logout
router.get('/logout', authController.logout);

module.exports = router;

