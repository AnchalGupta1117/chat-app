import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// Friend API calls
export const sendFriendRequest = (recipientId) => api.post('/api/friends/request', { recipientId });
export const acceptFriendRequest = (requestId) => api.put(`/api/friends/request/${requestId}/accept`);
export const rejectFriendRequest = (requestId) => api.put(`/api/friends/request/${requestId}/reject`);
export const getFriendRequests = () => api.get('/api/friends/requests');
export const getFriendsList = () => api.get('/api/friends/list');
export const removeFriend = (friendId) => api.delete(`/api/friends/${friendId}`);
