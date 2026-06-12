# IT Tickets

Structured support requests from clients, handled by the **IT side** — any `it` user with
the tickets permission, plus `superadmin`.

## Lifecycle

States: `pending`, `in_review`, `open`, `rejected`, `done`.

```
pending  (default on creation — set only by the system, never re-selectable)
   │
   └──> the IT side can move the ticket to ANY status except `pending`,
        with no transition restrictions (e.g. in_review→open, open→done,
        done→open to reopen, etc.)
```

- `pending` is the creation default; **no one can set a ticket back to `pending`**.
- After creation, an `it` user (with the tickets permission) or a `superadmin` can change
  the current status to **any other status except `pending`**, freely and without
  restrictions.
- The **client cannot change status at all** — in particular, a client cannot withdraw or
  cancel a ticket; only the IT side can reject it.
- Status meaning:
  - `in_review` — IT is investigating; no client conversation.
  - `open` — a support **conversation** exists (created when the ticket first reaches
    `open`); client and IT can talk.
  - `rejected` — closed with a reason; no conversation.
  - `done` — closed; the conversation stays visible to the client but read-only for them.

## User stories

### Create ticket

> As a client, I want to submit a ticket with a **title** and a **message**, so I can
> request IT help in a trackable way.

- New tickets start as `pending`.

### Triage

> As an `it` user (with the tickets permission) or a `superadmin`, I want to move a ticket
> to any status except `pending`, with no transition restrictions, so I can manage the
> queue freely.

- From any current status the IT side may set `in_review`, `open`, `rejected`, or `done`
  (including reopening a closed ticket back to `open`).
- `in_review`: IT is investigating; no client conversation is opened.

### Reject

> As an `it` user, I want to reject a ticket with a **reason**, so the client understands
> why their request was declined.

- A reject reason is **required** and is shown to the client on the ticket.

### Open → support conversation

> As an `it` user, I want moving a ticket to `open` to start a support conversation with
> the client, so we can help interactively.

- The conversation is **client-to-IT**, *not* 1:1 private chat: a single client on one
  side; on the IT side **any** `it` user with the tickets permission, or a `superadmin`,
  can read and send.
- The client sees the IT side as one entity — **"IT support"** — individual IT identities
  are hidden.
- Usually an IT user sends the first message; the conversation then appears in the client's
  history and the client can reply.
- The conversation is **linked to the ticket**. A different ticket gets its own, separate
  conversation.

### Done

> As an `it` user, I want to mark a ticket as `done` when the work ends, so the queue
> reflects reality.

- After `done`: the client can still **see** the conversation but can **no longer send**
  messages. The IT side can still send (though it usually won't).
- A `done` ticket can be reopened (set back to `open`); the same linked conversation
  resumes.

### Track my tickets

> As a client, I want to see my tickets with their current status and the linked
> conversation, so I always know where each request stands.
