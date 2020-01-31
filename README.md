# Real-Time Chat + Collaboration App

A full-stack real-time chat application built with Express, Socket.IO, and Next.js. Supports group and private messaging, file sharing, typing indicators, online presence, and basic end-to-end encryption — all on a single server process.

## Features

- **Real-time messaging** via WebSockets (Socket.IO)
- **Group chat** — create named rooms and invite members
- **Private chat** — one-to-one DM rooms (deduplicated)
- **File sharing** — upload images (rendered inline) and documents (download link)
- **Typing indicators** — see when others are composing a message
- **Online/offline presence** — live status dots and last-seen timestamps
- **Event-driven architecture** — internal EventEmitter bus decouples socket handlers from side effects
- **Redis Pub/Sub** — cross-instance event broadcast for horizontal scaling
- **Basic E2E encryption** — ECDH key exchange + AES-GCM message encryption via the Web Crypto API; private keys never leave the browser

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (Pages Router) | 10.x |
| UI | React | 17.x |
| Backend | Express | 4.17.x |
| WebSockets | Socket.IO | 2.3.x |
| Database | MongoDB + Mongoose | 5.10.x |
| Cache / Pub-Sub | Redis | 3.x |
| File uploads | Multer | 1.4.x |
| Authentication | JWT + bcryptjs | 8.x / 2.4.x |

## Prerequisites

- Node.js
- MongoDB running locally on port `27017`
- Redis running locally on port `6379`

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in your values
cp .env.example .env

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Register two accounts in separate windows to test real-time features.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `MONGODB_URI` | `mongodb://localhost:27017/realtime-chat` | MongoDB connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | — | Secret used to sign JWT tokens — **change this in production** |
| `UPLOAD_DIR` | `./uploads` | Directory for uploaded files |
| `MAX_FILE_SIZE` | `10485760` | Maximum upload size in bytes (default: 10 MB) |

## Project Structure

```
.
├── server.js                    # Entry point — Express + Next.js + Socket.IO
│
├── server/
│   ├── config/
│   │   ├── db.js                # Mongoose connection
│   │   ├── redis.js             # Redis clients (pub, sub, general)
│   │   └── multer.js            # File upload configuration
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Room.js
│   │   ├── Message.js
│   │   └── FileAttachment.js
│   ├── routes/                  # Express REST API
│   │   ├── auth.js              # POST /api/auth/register|login, GET /api/auth/me
│   │   ├── users.js             # GET /api/users/search|online|:id, PUT /api/users/:id/publicKey
│   │   ├── rooms.js             # CRUD /api/rooms, POST /api/rooms/dm
│   │   ├── messages.js          # GET /api/messages/:roomId
│   │   └── files.js             # POST /api/files/upload, GET /api/files/:id
│   ├── middleware/
│   │   ├── auth.js              # JWT bearer token verification
│   │   └── errorHandler.js      # Centralized error responses
│   ├── socket/
│   │   ├── index.js             # Socket.IO init, JWT auth middleware, handler wiring
│   │   ├── chatHandler.js       # chat:send, chat:read events
│   │   ├── presenceHandler.js   # online/offline, typing:start|stop events
│   │   └── roomHandler.js       # room:join, room:leave events
│   ├── services/                # Business logic
│   │   ├── messageService.js
│   │   ├── roomService.js
│   │   ├── presenceService.js   # Redis SET-based online tracking
│   │   ├── fileService.js
│   │   └── encryptionService.js # Server-side key distribution metadata
│   ├── events/
│   │   ├── eventBus.js          # Singleton Node.js EventEmitter
│   │   ├── redisEventBus.js     # Redis Pub/Sub bridge for multi-instance setups
│   │   └── handlers/
│   │       ├── messageEvents.js
│   │       ├── presenceEvents.js
│   │       └── notificationEvents.js
│   └── utils/
│       ├── constants.js         # Event name constants
│       └── logger.js
│
├── pages/                       # Next.js Pages Router
│   ├── _app.js                  # AuthProvider + SocketProvider
│   ├── _document.js
│   ├── index.js                 # Redirects to /chat or /login
│   ├── login.js
│   ├── register.js
│   └── chat/
│       ├── index.js             # Room list + empty state
│       └── [roomId].js          # Active chat view
│
├── components/
│   ├── layout/                  # AppShell, Sidebar, Header
│   ├── chat/                    # MessageList, MessageItem, MessageInput, TypingIndicator, FilePreview
│   ├── rooms/                   # RoomList, RoomItem, CreateRoomModal, RoomMembers
│   ├── users/                   # UserAvatar, UserSearch, OnlineUsersList
│   └── shared/                  # Modal, Button, LoadingSpinner
│
├── context/
│   ├── AuthContext.js           # JWT storage, login/logout/register helpers
│   └── SocketContext.js         # Socket.IO client lifecycle, tied to auth state
│
├── hooks/
│   ├── useAuth.js
│   ├── useSocket.js
│   ├── useMessages.js           # Paginated message fetching + live appending
│   ├── usePresence.js           # Online user set from socket events
│   └── useEncryption.js         # Key pair init, shared key derivation, encrypt/decrypt
│
└── lib/
    ├── api.js                   # Fetch wrapper (attaches Authorization header)
    ├── crypto.js                # Web Crypto API helpers (ECDH, AES-GCM, IndexedDB)
    └── constants.js             # Shared socket event name constants
```

## API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Log in and receive a JWT |
| GET | `/api/auth/me` | Yes | Return the current user |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/search?q=` | Yes | Search users by username or display name |
| GET | `/api/users/online` | Yes | List currently online users |
| GET | `/api/users/:id` | Yes | Get a user's profile (includes public key) |
| PUT | `/api/users/:id/publicKey` | Yes | Upload your ECDH public key |

### Rooms

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/rooms` | Yes | Create a group room |
| GET | `/api/rooms` | Yes | List the authenticated user's rooms |
| GET | `/api/rooms/:id` | Yes | Get room details and members |
| POST | `/api/rooms/:id/join` | Yes | Join a room |
| POST | `/api/rooms/:id/leave` | Yes | Leave a room |
| POST | `/api/rooms/dm` | Yes | Find or create a DM with another user |

### Messages

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/messages/:roomId` | Yes | Paginated message history (`?before=<ISO>&limit=50`) |

### Files

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/files/upload` | Yes | Upload a file (`multipart/form-data`, field `file` + `roomId`) |
| GET | `/api/files/:id` | Yes | Download a file by ID |

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `chat:send` | `{ roomId, content, type, encrypted, iv, fileAttachment? }` | Send a message |
| `chat:read` | `{ roomId, messageId }` | Mark a message as read |
| `room:join` | `{ roomId }` | Join a Socket.IO room |
| `room:leave` | `{ roomId }` | Leave a Socket.IO room |
| `typing:start` | `{ roomId }` | Signal that the user started typing |
| `typing:stop` | `{ roomId }` | Signal that the user stopped typing |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `chat:message` | Full message object | New message broadcast to a room |
| `chat:delivered` | `{ messageId, roomId, userId }` | Delivery confirmation |
| `chat:read` | `{ messageId, roomId, userId }` | Read receipt |
| `typing:update` | `{ roomId, userId, username, isTyping }` | Typing state change |
| `presence:online` | `{ userId, username }` | A user connected |
| `presence:offline` | `{ userId, username, lastSeen }` | A user disconnected |
| `room:updated` | `{ room | roomId, event, ... }` | Room membership changed |

## Architecture

```
Browser                      Express + Socket.IO          MongoDB    Redis
  │                                │                          │         │
  │── REST (fetch) ───────────────>│── routes/services ──────>│         │
  │<─ JSON ────────────────────────│                          │         │
  │                                │                          │         │
  │── socket.io (ws) ─────────────>│── chatHandler            │         │
  │                                │    └─ messageService ───>│         │
  │                                │    └─ eventBus.emit()    │         │
  │                                │        └─ messageEvents ─────────> │ (publish)
  │<─ chat:message ────────────────│<─ io.to(room).emit()     │         │
                                                              │         │
                           Instance 2 ◄────────────────────────────── │ (subscribe)
                                │                                       │
                          io.to(room).emit() ──► connected clients
```

**Event flow for a message:**
1. Client emits `chat:send` via WebSocket
2. Server saves the message to MongoDB
3. `chatHandler` fires `MESSAGE_CREATED` on the local event bus
4. `messageEvents` handler calls `io.to(roomId).emit('chat:message', ...)` for local clients
5. `redisEventBus` publishes the event to Redis channel `chat:events`
6. All other server instances receive it via their Redis subscriber and re-broadcast to their local clients

## End-to-End Encryption

Encryption is opt-in at the DM level (group key distribution is also scaffolded). The implementation uses only browser-native APIs — no third-party crypto library is required.

**Key generation:**
- On first use, `useEncryption` generates an ECDH key pair (P-256 curve) and stores the private key in IndexedDB. The public key is uploaded to the server and stored on the User document.

**DM encryption:**
1. Alice fetches Bob's public key from `/api/users/:id`
2. Alice derives a shared AES-256 key: `ECDH(Alice.privateKey, Bob.publicKey)`
3. Bob independently derives the same key: `ECDH(Bob.privateKey, Alice.publicKey)`
4. Each message is encrypted with AES-GCM using a fresh random IV
5. The server stores only the ciphertext and IV — plaintext never reaches the server

**Limitations:** No forward secrecy; losing your IndexedDB (e.g. clearing browser data) means losing access to encrypted message history.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload (nodemon) |
| `npm run build` | Build the Next.js frontend for production |
| `npm start` | Run the production server |
| `npm run lint` | Run ESLint |

## License

MIT
