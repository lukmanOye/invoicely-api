// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getCurrentUser,
  authMiddleware,
  requireAdmin,
  changeUserPassword
} = require('../controllers/authController');

// Public
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

router.put('/users/:userId/password', requireAdmin, changeUserPassword);

module.exports = router;