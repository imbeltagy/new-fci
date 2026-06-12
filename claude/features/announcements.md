# Announcements

An announcement is **just a notification** — one-way, fire-and-forget. It is delivered to a
targeted audience and nothing more (no replies, no threads, no discussion).

## Who can send

`superadmin`, `it` (with the announcements permission), `teacher`, and `sub-teacher`.

## Targeting

The sender picks one audience:

- a **specific user**
- a **list of users**
- **all users in a join year**
- **all users in a major** — across every join year
- **all users in a subject** — only that subject's enrolled students. A major has several
  subjects, so this lets a sender reach the students of one subject (e.g. subject A) rather
  than the whole major.

Targeting resolves to the matching set of users at send time.

## Sender scope

- **Admins** (`superadmin`, or `it` with the announcements permission) — **unrestricted**:
  any user, any join year, any major (across all cohorts), any subject.
- **`teacher` / `sub-teacher`** — **limited to their assignments**. They may only target:
  - a **subject** they are assigned to (its students),
  - a **(major × join year)** they are assigned to (its students),
  - a **join year** they are assigned to (its students),
  - and **individual users / lists** that fall within those assigned groups.

## Priority

`low`, `medium`, `urgent`. Higher priority surfaces more prominently in the apps.

## Delivery channels

Each targeted user receives the announcement through:

1. **In-app** — appears in the app (notification bell).
2. **Email** — always sent.
3. **WhatsApp** — only if the user has a WhatsApp number on their profile (see
   [users-auth.md](./users-auth.md)).

## User stories

### Send an announcement

> As a sender (admin / teacher / sub-teacher), I want to send an announcement to a chosen
> audience with a priority, so the right people are reliably informed across in-app, email,
> and WhatsApp.

### Receive an announcement

> As a user, I want announcements delivered in-app, by email, and on WhatsApp (when I have
> a number), so I never miss important information.

- In the app it behaves like a notification — surfaced in the bell, with no conversation
  attached.
