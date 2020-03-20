# Real-Time Chat + Collaboration App

A full-stack real-time chat application built with Express, Socket.IO, and Next.js. Supports group and private messaging, file sharing, typing indicators, online presence, and basic end-to-end encryption — all on a single server process.

## Features

- **Real-time messaging** via WebSockets (Socket.IO)
- **Group chat** — create named rooms and invite members
- **Private chat** — one-to-one DM rooms (deduplicated)
- **Floating chat windows** — Messenger-style popup windows dock to the bottom-right and persist across page navigation; multiple conversations stay open at once (cap of 4, FIFO eviction), each with its own collapse/close state, an unread badge while collapsed, and `localStorage` persistence keyed per user. Open via the pop-out icon on any room row or in the chat header. Incoming messages auto-open a popup for any conversation that is not already on screen.
- **File sharing** — upload images (rendered inline) and documents (download link); attachments are fetched with the auth token and rendered from blob URLs
- **Media compression** — uploaded images are transcoded to multiple WebP widths (320/640/1280/1920) via Sharp; videos are transcoded to 480p/720p H.264 + a poster frame via ffmpeg
- **Light / dark theme** — system-preference aware, user-toggleable, persisted in `localStorage`
- **Reactions** — one emoji per user per message, toggled in real time
- **Message pinning** — pin a message to a room; banner + details-pane entry stay in sync
- **Threaded replies** — messages can have a `threadParent`; parent rows show a thread-count pill, and a dedicated thread panel (or in-popup thread view) shows the parent + replies with its own composer
- **Web push notifications** — VAPID-signed browser push via a service worker; receive notifications for new messages even when the tab is closed, with per-room levels (`all` / `mentions` / `none`) and an opt-in banner that suppresses notifications for the conversation already focused
- **Edit & delete** — sender-only, with `(edited)` marker and soft-delete tombstones
- **@Mentions** — `@username` is parsed on send/edit, stored on the message, and delivered via a direct `chat:mention` socket event
- **Markdown-lite rendering** — `**bold**`, `*italic*`, `` `code` ``, triple-backtick blocks, and mention chips
- **Composer toolbar** — attach, `@`, inline emoji picker, bold / italic / code formatters
- **Typing indicators** — see when others are composing a message
- **Online/offline presence** — live status dots and last-seen timestamps
- **Split-screen auth** — branded login/register with a live password-strength meter
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
| Image processing | Sharp | 0.32.x |
| Video processing | fluent-ffmpeg + ffmpeg-static | 2.1.x / 5.3.x |
| Web push | web-push | 3.6.x |
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
| `MAX_FILE_SIZE` | `104857600` | Maximum upload size in bytes (default: 100 MB) |
| `VAPID_PUBLIC_KEY` | — | VAPID public key for web push (generate with `npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | — | VAPID private key for web push |
| `VAPID_SUBJECT` | `mailto:admin@example.com` | `mailto:` or `https:` URL identifying the push sender |

Push notifications are optional: if the VAPID keys are unset the `/api/push/*` routes return `503` and the client banner stays hidden, but everything else continues to work.

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
│   │   ├── rooms.js             # CRUD /api/rooms, POST /api/rooms/dm, PUT /api/rooms/:id/notifications
│   │   ├── messages.js          # GET /api/messages/:roomId, /api/messages/:roomId/thread/:parentId
│   │   ├── files.js             # POST /api/files/upload, GET /api/files/:id
│   │   └── push.js              # GET /api/push/vapid-public-key, POST|DELETE /api/push/subscribe
│   ├── middleware/
│   │   ├── auth.js              # JWT bearer token verification
│   │   └── errorHandler.js      # Centralized error responses
│   ├── socket/
│   │   ├── index.js             # Socket.IO init, JWT auth middleware, handler wiring
│   │   ├── chatHandler.js       # chat:send, chat:read, message:react|pin|edit|delete
│   │   ├── presenceHandler.js   # online/offline, typing:start|stop events
│   │   └── roomHandler.js       # room:join, room:leave events
│   ├── services/                # Business logic
│   │   ├── messageService.js
│   │   ├── roomService.js
│   │   ├── presenceService.js   # Redis SET-based online tracking
│   │   ├── fileService.js
│   │   ├── mediaCompressor.js   # Sharp (image) + ffmpeg (video) variant generation
│   │   ├── pushService.js       # web-push fan-out, per-room level filtering, dead-subscription pruning
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
├── public/
│   └── sw.js                    # Service worker — handles push + notificationclick, suppresses for the focused room
│
├── pages/                       # Next.js Pages Router
│   ├── _app.js                  # AuthProvider + SocketProvider + PopupWindowsProvider; mounts PopupAutoOpener, PopupDock, EnableNotificationsBanner
│   ├── _document.js
│   ├── index.js                 # Redirects to /chat or /login
│   ├── login.js
│   ├── register.js
│   └── chat/
│       ├── index.js             # Room list + empty state
│       └── [roomId].js          # Active chat view (consumes useRoomChat)
│
├── components/
│   ├── layout/                  # NavRail (dark 64px rail with brand mark + nav buttons)
│   ├── chat/                    # MessageList, MessageItem, MessageInput, TypingIndicator,
│   │                            # ChatHeader (with pop-out button), PinnedBanner, DetailsPane
│   │                            # (with per-room notification level picker), DayDivider,
│   │                            # MessageActions, ReactionsRow, ThreadPanel
│   ├── rooms/                   # RoomList (with All/Unread/Groups/DMs tabs), RoomItem (with pop-out button), CreateRoomModal
│   ├── popup/                   # PopupDock, PopupWindow, PopupHeader, PopupAutoOpener — floating chat windows
│   ├── users/                   # UserAvatar, UserSearch
│   └── shared/                  # Avatar (tone-hashed initials), Icon, AuthShell, ThemeToggle, EnableNotificationsBanner
│
├── context/
│   ├── AuthContext.js           # JWT storage, login/logout/register helpers
│   ├── SocketContext.js         # Socket.IO client lifecycle, tied to auth state
│   ├── ThemeContext.js          # Light/dark theme provider (localStorage + system preference)
│   └── PopupWindowsContext.js   # Open floating windows: state, cap (4) + FIFO, per-user localStorage
│
├── hooks/
│   ├── useAuth.js
│   ├── useSocket.js
│   ├── useMessages.js           # Paginated message fetching + live appending
│   ├── useRoomChat.js           # Per-room socket subscriptions + send/react/pin/edit/delete/typing actions; shared by the chat page and each popup window
│   ├── useThread.js             # Loads thread replies + subscribes to chat:thread-message
│   ├── usePopupWindows.js       # Consumer hook for PopupWindowsContext
│   ├── usePresence.js           # Online user set from socket events
│   ├── usePushNotifications.js  # Service worker registration + VAPID subscribe/unsubscribe lifecycle
│   └── useEncryption.js         # Key pair init, shared key derivation, encrypt/decrypt
│
└── lib/
    ├── api.js                   # Fetch wrapper (attaches Authorization header)
    ├── crypto.js                # Web Crypto API helpers (ECDH, AES-GCM, IndexedDB)
    ├── push.js                  # Service-worker registration + PushManager subscribe/unsubscribe
    ├── format.js                # fmtTime/Relative/Day, groupByDay, renderMessageBody
    ├── avatarColor.js           # Deterministic tone hashing for user avatars
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
| GET | `/api/rooms/:id` | Yes | Get room details, members, and the caller's `notificationLevel` |
| POST | `/api/rooms/:id/join` | Yes | Join a room |
| POST | `/api/rooms/:id/leave` | Yes | Leave a room |
| PUT | `/api/rooms/:id/notifications` | Yes | Set this user's notification level for the room (`all` \| `mentions` \| `none`) |
| POST | `/api/rooms/dm` | Yes | Find or create a DM with another user |

### Messages

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/messages/:roomId` | Yes | Paginated main-feed history (`?before=<ISO>&limit=50`); excludes thread children and deleted messages |
| GET | `/api/messages/:roomId/thread/:parentId` | Yes | Paginated thread replies for a parent message |

### Files

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/files/upload` | Yes | Upload a file (`multipart/form-data`, field `file` + `roomId`); response includes generated `variants[]` |
| GET | `/api/files/:id` | Yes | Download a file by ID; pass `?variant=<label>` (e.g. `w640`, `low`, `poster`) to fetch a transcoded variant |

### Push

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/push/vapid-public-key` | Yes | Returns `{ key }` — the server's VAPID public key (or `503` if push is not configured) |
| POST | `/api/push/subscribe` | Yes | Register or refresh a `PushSubscription` for the current user (`{ subscription, userAgent }`) |
| DELETE | `/api/push/subscribe` | Yes | Remove a subscription by `{ endpoint }` |

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `chat:send` | `{ roomId, content, type, encrypted, iv, fileAttachment?, threadParent? }` | Send a message (pass `threadParent` for a thread reply) |
| `chat:read` | `{ roomId, messageId }` | Mark a message as read |
| `message:react` | `{ messageId, emoji }` | Toggle an emoji reaction (one per user per message) |
| `message:pin` | `{ roomId, messageId }` | Pin a message (or unpin if `messageId` matches the current pin) |
| `message:edit` | `{ messageId, content }` | Edit own text message |
| `message:delete` | `{ messageId }` | Soft-delete own message |
| `room:join` | `{ roomId }` | Join a Socket.IO room |
| `room:leave` | `{ roomId }` | Leave a Socket.IO room |
| `typing:start` | `{ roomId }` | Signal that the user started typing |
| `typing:stop` | `{ roomId }` | Signal that the user stopped typing |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `chat:message` | Full message object | New message broadcast to clients joined to the conversation socket room |
| `chat:thread-message` | Full message object | New thread reply (a message with `threadParent`); broadcast to the room socket so the thread panel can append it without disturbing the main feed |
| `chat:notify` | Full message object | Same payload as `chat:message`, fanned out to every member's `user:<id>` socket regardless of whether they have joined the conversation room — drives sidebar preview updates and floating-popup auto-open |
| `chat:delivered` | `{ messageId, roomId, userId }` | Delivery confirmation |
| `chat:read` | `{ messageId, roomId, userId }` | Read receipt |
| `chat:reaction` | `{ messageId, reactions }` | Reaction map updated |
| `chat:pinned` | `{ roomId, pinnedMessage }` | Room pin changed (populated message or `null`) |
| `chat:edited` | `{ messageId, content, editedAt, mentions }` | Message edited |
| `chat:deleted` | `{ messageId }` | Message soft-deleted |
| `chat:thread-count` | `{ parentId, threadCount, threadLatest }` | Thread reply count updated |
| `chat:mention` | `{ roomId, messageId, from }` | Delivered to mentioned users (joined to `user:<id>` room) |
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
4. `messageEvents` handler calls `io.to(roomId).emit('chat:message', ...)` for local clients, fans `chat:notify` out to every member's `user:<id>` socket, and triggers `pushService.fanout` for offline / background members
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

## Push Notifications

Web push is implemented with VAPID-signed messages, the [`web-push`](https://www.npmjs.com/package/web-push) library on the server, and a small service worker (`public/sw.js`) on the client.

**Setup:**
1. Generate a key pair: `npx web-push generate-vapid-keys`
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in `.env`
3. The first time a logged-in user loads the app, an opt-in banner asks for `Notification` permission; on accept, the client registers `/sw.js`, calls `pushManager.subscribe`, and stores the subscription on `User.pushSubscriptions`.

**Fan-out (`server/services/pushService.js`):**
- Triggered from `messageEvents` after every non-system, non-thread `MESSAGE_CREATED`.
- Skips the sender; for everyone else, looks up `User.notificationOverrides[roomId]` to honour `all` / `mentions` / `none` levels (mentions-only requires the user's id to be in `message.mentions`).
- Encrypted messages collapse to `[Encrypted]`, files to `[File]`; long text is clipped to 140 chars.
- `404` / `410` responses prune the dead subscription from the user document.

**Service worker (`public/sw.js`):**
- On `push`, suppresses the notification if the user has the matching `/chat/<roomId>` tab focused; otherwise shows it tagged by `roomId` so subsequent messages collapse together.
- On `notificationclick`, focuses an existing tab on that route or opens a new one.

**Per-room muting:** the details pane lets a user set their notification level per room via `PUT /api/rooms/:id/notifications`, which writes to `User.notificationOverrides`.

If `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` are unset, `pushService` no-ops and `/api/push/vapid-public-key` returns `503` — the rest of the app behaves identically.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload (nodemon) |
| `npm run build` | Build the Next.js frontend for production |
| `npm start` | Run the production server |
| `npm run lint` | Run ESLint |

## License

MIT
