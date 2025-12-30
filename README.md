# Real-Time One-to-One Chat

Free stack chat application with React (Vite), Node.js, Express, MongoDB, Socket.IO, and JWT authentication. Features one-to-one private messaging, presence, and message history storage.

## Requirements
- Node.js 18+
- MongoDB (local or Atlas)

## Setup
1. Clone and install dependencies.
   - Server: `cd server && npm install`
   - Client: `cd client && npm install`
2. Configure environment variables.
   - Copy `server/.env.example` to `server/.env` and set `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`.
   - (Optional) Copy `client/.env.example` to `client/.env` and set `VITE_API_URL`.
3. Start the services (separate terminals):
   - API + Socket.IO: `cd server && npm run dev`
   - React client: `cd client && npm run dev`

## Usage
- Register or log in to receive a JWT.
- The user list shows online/offline status in real time.
- Select a user to load conversation history and exchange private messages.

## Scripts
- Server: `npm run dev` (nodemon), `npm start`
- Client: `npm run dev`, `npm run build`, `npm run preview`

## Notes
- CORS/socket origins are controlled via `CLIENT_ORIGIN` and `VITE_API_URL` (defaults to `http://localhost:5173` and `http://localhost:5000`).
- Message delivery uses Socket.IO; messages are persisted in MongoDB for history retrieval.

## Deployment (example: Render + Netlify)
Server (Render or similar):
- Set env vars: `PORT` (e.g., 5000), `MONGO_URI` (Atlas), `JWT_SECRET` (random), `CLIENT_ORIGIN` (your client URL).
- Install & run: `npm install`, start command `npm start`, working dir `server`.

Client (Netlify/Vercel or any static host):
- Set `VITE_API_URL` to your deployed API URL.
- Build in `client`: `npm install` then `npm run build`; deploy `client/dist` as static assets.

Checklist:
- Ensure MongoDB IP allowlist includes the server host.
- Match CORS origins: server `CLIENT_ORIGIN` must include the deployed client URL; client `VITE_API_URL` must point to the deployed API.
