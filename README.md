# 💬 Real-Time One-to-One Chat Application

A modern, professional real-time chat application built with the MERN stack. Features include friend management, private messaging, typing indicators, message reactions, read receipts, and more.

## ✨ Features

### Core Features
- 🔐 **JWT Authentication** - Secure user registration and login
- 👥 **Friend System** - Send/accept/reject friend requests
- 💬 **Real-time Messaging** - Instant message delivery with Socket.IO
- ✅ **Read Receipts** - Double-tick system showing message status
- 💭 **Typing Indicators** - See when your friend is typing
- 😊 **Message Reactions** - React to messages with emojis
- 📎 **Reply to Messages** - Quote and reply to specific messages
- 🗑️ **Message Management** - Delete messages for yourself or everyone
- 🟢 **Online Status** - Real-time presence indicators

### Professional Touches
- 📝 **Input Validation** - Client and server-side validation
- 🔒 **Friend-only Messaging** - Only chat with accepted friends
- ⌨️ **Keyboard Shortcuts** - Enter to send, Shift+Enter for new line
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Modern UI** - Clean, dark-themed interface
- ⏰ **Smart Timestamps** - Relative time display (e.g., "5m ago", "Yesterday 2:30 PM")
- 🔢 **Character Counter** - Shows count when approaching limit (5000 chars)
- 🔄 **Auto-scrolling** - Smooth scroll to latest messages
- 🎯 **Message Selection** - Long-press to select multiple messages

## 🛠 Tech Stack

**Frontend:**
- React 18 with Hooks
- Vite (fast build tool)
- Socket.io-client
- Axios for API calls

**Backend:**
- Node.js & Express
- MongoDB with Mongoose
- Socket.IO for real-time communication
- JWT for authentication
- bcrypt for password hashing

## 📋 Requirements
- Node.js 18+
- MongoDB (local or Atlas)

## 🚀 Setup

### 1. Clone and Install Dependencies
```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### 2. Configure Environment Variables

**Server** (`server/.env`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-super-secret-jwt-key-change-this
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Client** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Servers

**Server** (in `server/` directory):
```bash
npm run dev  # Uses nodemon for auto-reload
```

**Client** (in `client/` directory):
```bash
npm run dev  # Starts Vite dev server
```

Visit `http://localhost:5173` to use the application.

## 📱 Usage

1. **Register** - Create a new account with name, email, and password (min 6 characters)
2. **Find Friends** - Switch to "Explore" tab to find other users
3. **Send Friend Request** - Click "Add Friend" on any user
4. **Accept Requests** - Switch to "Friends" tab to see pending requests
5. **Start Chatting** - Click on a friend to start messaging
6. **Message Features**:
   - Click the 3-dot menu on any message for actions
   - Reply: Quote a message in your response
   - React: Add emoji reactions
   - Delete: Remove messages for yourself or everyone

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users (authenticated)

### Friends
- `POST /api/friends/request` - Send friend request
- `PUT /api/friends/request/:id/accept` - Accept friend request
- `PUT /api/friends/request/:id/reject` - Reject friend request
- `GET /api/friends/requests` - Get pending requests
- `GET /api/friends/list` - Get friends list
- `DELETE /api/friends/:id` - Remove friend

### Messages
- `GET /api/messages/:friendId` - Get message history
- `DELETE /api/messages/conversation/:friendId` - Clear conversation
- `DELETE /api/messages/:id/for-me` - Delete message for self
- `DELETE /api/messages/:id/for-everyone` - Delete for both users

## 🔌 Socket Events

### Client → Server
- `send_friend_request` - Send friend request
- `accept_friend_request` - Accept friend request
- `private_message` - Send message
- `typing` - User started typing
- `stop_typing` - User stopped typing
- `mark_as_seen` - Mark message as read
- `add_reaction` - Add emoji reaction

### Server → Client
- `friend_request_received` - New friend request
- `friend_request_accepted` - Request accepted
- `private_message` - New message received
- `user_typing` - Friend started typing
- `user_stop_typing` - Friend stopped typing
- `user_online` - Friend came online
- `user_offline` - Friend went offline
- `reaction_updated` - Reaction added to message

## 🚀 Deployment

### Server (Render/Railway/Heroku)
1. Set environment variables:
   - `PORT` (usually auto-set)
   - `MONGO_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET` (random secure string)
   - `CLIENT_ORIGIN` (your deployed client URL, e.g., `https://your-app.vercel.app`)
   - `NODE_ENV=production`

2. Build command: `npm install`
3. Start command: `npm start`
4. Root directory: `server`

### Client (Vercel/Netlify)
1. Set environment variable:
   - `VITE_API_URL` (your deployed server URL, e.g., `https://your-api.onrender.com`)

2. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `client`

### Important Notes
- Ensure MongoDB allows connections from your server host
- Match CORS origins: `CLIENT_ORIGIN` on server = deployed client URL
- No trailing slashes in URLs
- Multiple origins: comma-separated (e.g., `https://app1.com,https://app2.com`)

## 📝 Scripts

### Server
```bash
npm run dev      # Development with nodemon
npm start        # Production server
```

### Client
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Friend-only messaging validation
- ✅ Input validation (client & server)
- ✅ Message length limits (5000 chars)
- ✅ XSS protection with React
- ✅ CORS configuration
- ✅ Environment variable management

## 🎨 UI/UX Features

- Dark theme with modern gradients
- Smooth animations and transitions
- Loading states for all async operations
- Error handling with user-friendly messages
- Responsive grid layout
- Touch-friendly mobile interface
- Keyboard navigation support
- Status indicators (online/offline, connected/disconnected)

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ using React, Node.js, MongoDB, and Socket.IO
