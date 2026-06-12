# Private Chat

Real-time 1:1 direct messaging over **sockets**, with messages persisted in the DB.

## Scope

- Private chat is **client-to-client only** (`student` / `teacher` / `sub-teacher`).
- Admins are never participants: there is no admin↔client and no admin↔admin private chat
  here. (The IT support conversation created by a ticket is a **separate** mechanism — see
  [it-tickets.md](./it-tickets.md).)

## User stories

### Start a chat

> As a client user, I want to start a chat with any user whose profile I can access, so I
> can message them directly without external apps.

- Access to a profile (shared space, profile link, or exact-email search — see
  [users-auth.md](./users-auth.md)) is the precondition for starting a chat.
- One conversation per pair of users (reopened, not duplicated).

### Send a message (socket)

> As a user, I want to send a message and have it delivered in real time, so chatting feels
> instant.

- The client emits a **socket event** with the message.
- The server **persists** the message in the DB, then **delivers** it over the socket to
  the recipient.

### Read receipts (socket)

> As a user, I want to know when my message has been read, so I have delivery confidence.

- When the recipient views a message, their client emits a **read** event.
- The server marks the message read in the DB, then notifies the **sender** over the socket
  that it was read.

### Chat history (paginated, from DB)

> As a user, I want to scroll back through past messages, so I can review the conversation.

- History is fetched from the DB by `limit` (how many messages) and `page` as a **negative
  integer** to page backwards from the end of the conversation.
- History returns only: messages **I sent**, and messages **I received and already marked
  as read**.
- A message I received but have **not** yet marked as read is intentionally **excluded**
  from history — it is delivered to me live over the socket instead. This avoids a conflict
  (duplicate) between the persisted history and the live socket delivery.

### Catching up after being offline (socket)

> As a user, I want any messages sent to me while I was offline to arrive as soon as I
> reconnect, so I never silently miss messages.

- On socket connect, the server pushes every message addressed to me that I have **not**
  yet marked as read (the ones history deliberately omits), as if they had just been sent.
- The client then marks them read in the normal way, after which they become part of DB
  history.

### My chats list

> As a user, I want a list of all my chats with a preview, so I can jump back into any
> conversation.

- Returns **every conversation I'm a participant in** (not only the ones I started); for
  each: the other person's **name**, **email**, **avatar_url**, and the **last message**.
