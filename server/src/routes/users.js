const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getOnlineUserIds } = require('../utils/onlineUsers');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }, 'name');
    const onlineSet = new Set(getOnlineUserIds());

    const mapped = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      online: onlineSet.has(u._id.toString()),
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Users fetch error', err);
    return res.status(500).json({ message: 'Unable to fetch users' });
  }
});

module.exports = router;
