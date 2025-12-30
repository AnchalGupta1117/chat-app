const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/:userId', auth, async (req, res) => {
  const otherUserId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: otherUserId },
        { sender: otherUserId, recipient: req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(500);

    const formatted = messages.map((m) => ({
      id: m._id.toString(),
      sender: m.sender.toString(),
      recipient: m.recipient.toString(),
      content: m.content,
      createdAt: m.createdAt,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Message history error', err);
    return res.status(500).json({ message: 'Unable to fetch messages' });
  }
});

module.exports = router;
