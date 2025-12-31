const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/:userId', auth, async (req, res) => {
  const otherUserId = req.params.userId;

  try {
    // Check if users are friends
    const Friend = require('../models/Friend');
    const friendship = await Friend.findOne({
      $or: [
        { requester: req.userId, recipient: otherUserId, status: 'accepted' },
        { requester: otherUserId, recipient: req.userId, status: 'accepted' },
      ],
    });

    if (!friendship) {
      return res.status(403).json({ message: 'You can only view messages with friends' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: otherUserId },
        { sender: otherUserId, recipient: req.userId },
      ],
      deletedFor: { $ne: req.userId },
    })
      .sort({ createdAt: 1 })
      .limit(500)
      .populate('replyTo');

    const formatted = messages.map((m) => ({
      id: m._id.toString(),
      sender: m.sender.toString(),
      recipient: m.recipient.toString(),
      content: m.content,
      replyTo: m.replyTo ? m.replyTo._id.toString() : null,
      seenBy: m.seenBy.map((id) => id.toString()),
      reactions: m.reactions.map((r) => ({
        userId: r.userId.toString(),
        emoji: r.emoji,
      })),
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

router.delete('/:messageId/for-me', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.deletedFor) {
      message.deletedFor = [];
    }
    if (!message.deletedFor.includes(req.userId)) {
      message.deletedFor.push(req.userId);
      await message.save();
    }

    return res.json({ message: 'Message deleted for you' });
  } catch (err) {
    console.error('Delete message for me error', err);
    return res.status(500).json({ message: 'Unable to delete message' });
  }
});

router.delete('/:messageId/for-everyone', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await Message.findByIdAndDelete(req.params.messageId);
    return res.json({ message: 'Message deleted for everyone' });
  } catch (err) {
    console.error('Delete message for everyone error', err);
    return res.status(500).json({ message: 'Unable to delete message' });
  }
});

module.exports = router;
