# Audit — Real-Time Chat & Collaboration App

_Date: 2026-04-27_

## Critical

1. **No room-membership auth on socket events** — [server/socket/chatHandler.js:6](server/socket/chatHandler.js#L6), [server/socket/roomHandler.js:2](server/socket/roomHandler.js#L2). Any authenticated user can `room:join` any roomId and send/edit/delete/react. `messageService.create` never checks `Room.members`. **Fix:** enforce membership in the service layer.
2. **No auth on message read** — [server/routes/messages.js:6](server/routes/messages.js#L6), [server/services/messageService.js:74](server/services/messageService.js#L74). `GET /api/messages/:roomId` returns history for any room. **Fix:** verify membership.
3. **No auth on file download** — [server/routes/files.js:80](server/routes/files.js#L80). Any logged-in user with a fileId can fetch any upload. **Fix:** cross-check `file.roomId` membership.
4. **ReDoS via raw user regex** — [server/routes/users.js:12](server/routes/users.js#L12). `new RegExp(q, 'i')` from user input. **Fix:** escape input or use a `$text` index.
5. **CORS wide open** — [server.js:30](server.js#L30) and [server/socket/index.js:13](server/socket/index.js#L13) (Socket.IO 2.x default `*:*`). Combined with JWT-in-query, enables CSWSH. **Fix:** pin allowed origins.

## High

6. **JWT in querystring + `morgan('dev')`** — [server/middleware/auth.js:10](server/middleware/auth.js#L10), [server.js:31](server.js#L31). Tokens are logged to stdout and reverse-proxy logs. **Fix:** header-only, or scrub query tokens before logging.
7. **No `JWT_SECRET` startup check** — [server/middleware/auth.js:16](server/middleware/auth.js#L16). **Fix:** fail-fast assertion at boot.
8. **Upload trusts client mimetype + `/uploads` is statically served** — [server/config/multer.js:26](server/config/multer.js#L26), [server.js:37](server.js#L37). SVG/HTML uploaded as `image/png` is served raw → stored XSS. **Fix:** sniff with `file-type`, drop the static mount, force `Content-Disposition: attachment` for non-image/video, reject SVG.
9. **No rate limiting** — [server/routes/auth.js](server/routes/auth.js), [server.js](server.js). Credential stuffing and upload floods are trivial. **Fix:** `express-rate-limit` on `/api/auth` + per-socket throttle on `chat:send`.
10. **`pinnedMessage` doesn't check message↔room** — [server/services/messageService.js:135](server/services/messageService.js#L135). Member can pin any messageId. **Fix:** `Message.findOne({ _id, roomId })`.
11. **`editMessage`/`deleteMessage` ignore deleted state, room re-membership, edit window** — [server/services/messageService.js:161](server/services/messageService.js#L161).
12. **Public-key update is unauthenticated bytes** — [server/routes/users.js:51](server/routes/users.js#L51). A stolen token enables silent E2E key rotation. Architectural: needs attestation / TOFU pinning.
13. **DM auto-creates membership with any userId** — [server/routes/rooms.js:100](server/routes/rooms.js#L100). No block-list.

## Medium

14. **N+1 / unbounded population in `getUserRooms`** — [server/services/roomService.js:35](server/services/roomService.js#L35). Loads all members + pinned + sender for every room. **Fix:** paginate, `.lean()`, project only needed fields.
15. **Missing index** on `Room.members` + `lastMessage.timestamp` — [server/models/Room.js](server/models/Room.js).
16. **Race in `toggleReaction`** — [server/services/messageService.js:106](server/services/messageService.js#L106). Read-modify-write clobbers concurrent reactions. **Fix:** `$addToSet`/`$pull` atomic ops.
17. **Race in push subscription upsert** — [server/routes/push.js:19](server/routes/push.js#L19). **Fix:** single atomic upsert + unique index on `endpoint`.
18. **ffmpeg compression blocks request** — [server/routes/files.js:42](server/routes/files.js#L42). Pins a worker for minutes; client times out. **Fix:** enqueue, return `compressionStatus: 'pending'`.
19. **Unbounded `?limit=` on history** — [server/services/messageService.js:74](server/services/messageService.js#L74). **Fix:** `Math.min(parsed, 100)`.
20. **Error handler leaks `err.message` on 500** — [server/middleware/errorHandler.js:5](server/middleware/errorHandler.js#L5). **Fix:** only expose message when `statusCode < 500`.
21. **`io.emit` presence storm** — [server/events/handlers/presenceEvents.js:11](server/events/handlers/presenceEvents.js#L11). O(N) broadcast to every connected user per connect/disconnect. **Fix:** emit only to rooms shared with the user.
22. **Horizontal scaling broken** — [server/socket/index.js:21](server/socket/index.js#L21). Custom Redis event bridge is not a substitute for socket-room replication. **Fix:** use the `socket.io-redis` adapter.

## Low

23. **Stale dependencies** — [package.json](package.json): `mongoose ^5`, `socket.io ^2` (EOL), `next ^10`, `multer ^1.4.2`, `helmet ^4`.
24. **CSP disabled** — [server.js:29](server.js#L29) (`helmet({ contentSecurityPolicy: false })`).
25. **JWT verify not pinned to `HS256`** — [server/routes/auth.js:49](server/routes/auth.js#L49). Defensively pass `algorithms: ['HS256']`.
26. **Compression variants not cleaned up on failure** in `buildVariants`.

---

## Suggested order of fixes

1. **Auth on data boundaries** (1, 2, 3) — single PR. Without this, any logged-in user can read every conversation and file in the system.
2. **Upload hardening** (8) and **CORS lockdown** (5).
3. **Rate limiting** (9) and **JWT hygiene** (6, 7, 25).
4. The remainder can be sequenced as cleanup.
