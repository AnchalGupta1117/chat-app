const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getOnlineUserIds } = require('../utils/onlineUsers');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }, 'name email');
    const onlineSet = new Set(getOnlineUserIds());

    const mapped = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      online: onlineSet.has(u._id.toString()),
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Users fetch error', err);
    return res.status(500).json({ message: 'Unable to fetch users' });
  }
});

router.delete('/me', auth, async (req, res) => {
  try {
    const Message = require('../models/Message');
    await Message.deleteMany({ $or: [{ sender: req.userId }, { recipient: req.userId }] });
    await User.findByIdAndDelete(req.userId);
    return res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error', err);
    return res.status(500).json({ message: 'Unable to delete account' });
  }
});

module.exports = router;
