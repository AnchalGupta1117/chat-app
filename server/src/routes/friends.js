const express = require('express');
const router = express.Router();
const Friend = require('../models/Friend');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.userId; // Use req.userId from auth middleware

    if (requesterId === recipientId) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Check if already friends or pending
    const existing = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existing) {
      return res.status(400).json({ message: 'Friend request already exists or you are already friends' });
    }

    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending',
    });

    await friendRequest.save();
    res.status(201).json({ message: 'Friend request sent', friendRequest });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Error sending friend request', error: error.message });
  }
});

// Accept friend request
router.put('/request/:requestId/accept', auth, async (req, res) => {
  try {
    const friendRequest = await Friend.findById(req.params.requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only accept requests sent to you' });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    res.json({ message: 'Friend request accepted', friendRequest });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: 'Error accepting friend request', error: error.message });
  }
});

// Reject friend request
router.put('/request/:requestId/reject', auth, async (req, res) => {
  try {
    const friendRequest = await Friend.findById(req.params.requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only reject requests sent to you' });
    }

    friendRequest.status = 'rejected';
    await friendRequest.save();

    res.json({ message: 'Friend request rejected', friendRequest });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ message: 'Error rejecting friend request', error: error.message });
  }
});

// Get pending friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await Friend.find({
      recipient: req.userId,
      status: 'pending',
    })
      .populate('requester', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ message: 'Error fetching friend requests', error: error.message });
  }
});

// Get accepted friends
router.get('/list', auth, async (req, res) => {
  try {
    const friendships = await Friend.find({
      $or: [
        { requester: req.userId, status: 'accepted' },
        { recipient: req.userId, status: 'accepted' },
      ],
    })
      .populate('requester', '_id name email')
      .populate('recipient', '_id name email');

    // Extract friends - return the other person in each friendship
    const friends = friendships.map((f) => {
      const requesterIdStr = f.requester._id.toString();
      const userIdStr = String(req.userId);
      // If current user is requester, return recipient; otherwise return requester
      return requesterIdStr === userIdStr ? f.recipient : f.requester;
    });

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ message: 'Error fetching friends', error: error.message });
  }
});

// Remove friend
router.delete('/:friendId', auth, async (req, res) => {
  try {
    await Friend.deleteOne({
      $or: [
        { requester: req.userId, recipient: req.params.friendId },
        { requester: req.params.friendId, recipient: req.userId },
      ],
    });

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Error removing friend', error: error.message });
  }
});

module.exports = router;
