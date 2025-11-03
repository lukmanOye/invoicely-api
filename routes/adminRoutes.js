const express = require('express');
const router = express.Router();
const { users } = require('../services/appwriteService');
const authController = require('../controllers/authController');

const { requireAdmin } = authController;

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const list = await users.list();
    const usersList = list.users.map(u => ({
      id: u.$id,
      email: u.email,
      name: u.name,
      status: u.status,
      emailVerification: u.emailVerification
    }));
    res.json({ success: true, data: { users: usersList, total: list.total } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await users.get(userId);
    const prefs = await users.getPrefs(userId).catch(() => ({}));

    res.json({
      success: true,
      data: {
        user: {
          id: user.$id,
          email: user.email,
          name: user.name,
          role: prefs.role || 'USER',
          status: user.status,
          createdAt: user.$createdAt
        }
      }
    });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId === userId) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    await users.delete(userId);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;