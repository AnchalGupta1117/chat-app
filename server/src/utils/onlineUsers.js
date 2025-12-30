const onlineUsers = new Map();

function setOnline(userId, socketId) {
  onlineUsers.set(String(userId), socketId);
}

function removeOnline(userId) {
  onlineUsers.delete(String(userId));
}

function getSocketId(userId) {
  return onlineUsers.get(String(userId));
}

function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

module.exports = {
  setOnline,
  removeOnline,
  getSocketId,
  getOnlineUserIds,
};
