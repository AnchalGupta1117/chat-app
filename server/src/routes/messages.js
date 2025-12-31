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

router.delete('/conversation/:userId', auth, async (req, res) => {
  const otherUserId = req.params.userId;

  try {
    const result = await Message.deleteMany({
      $or: [
        { sender: req.userId, recipient: otherUserId },
        { sender: otherUserId, recipient: req.userId },
      ],
    });

    return res.json({ message: 'Conversation deleted', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Delete conversation error', err);
    return res.status(500).json({ message: 'Unable to delete conversation' });
  }
});

module.exports = router;
