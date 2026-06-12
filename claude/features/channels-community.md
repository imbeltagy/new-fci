# Channels & Community

Two kinds of group spaces, both real-time chats with history — but with opposite
characters:

| | Community | Channels |
| --- | --- | --- |
| Tone | **Informal** — students send what they want | **Formal** — academic spaces |
| Scope | One per **join year** | One per **join year × major** and one per **subject** (a subject is itself unique to one join year + major) |
| Students | Everyone in the join year | Those in that join year matching the major / enrolled in the subject |
| Staff | Only if assigned to the join year | If assigned to the major / subject |

## User stories — Community

### Join-year community

> As a student, I want an informal community chat with everyone in my join year, so I can
> bond and talk freely with my cohort.

- Each join year has exactly **one** community; all its students are members
  automatically.
- A teacher/sub-teacher joins a community **only** when assigned to that join year.

### Moderation

> As an admin, I want to delete messages and mute users in communities, so the space stays
> respectful.

## User stories — Channels

### Major channel

> As a student, I want a formal channel with the students of **my join year and my
> major**, so major-wide academic communication has one place.

- One channel per (join year × major) — **not** all students of a major across join
  years.
- Teachers/sub-teachers join it via their (major × join year) assignment — a major
  assignment always carries a join year, so it maps to exactly one major channel.

### Subject channel

> As a student, I want a formal channel for each of my subjects, so subject communication
> has a single official place.

- One channel per subject — a subject is already unique to one (join year, major), so its
  channel is too. Membership simply follows enrollment in the subject.
- Teachers/sub-teachers assigned to the subject join it. (Assigned to the major only?
  They can access the major channel but **not** the subject channels — see
  subjects-majors.md.)

### Highlighted faculty content

> As a teacher/sub-teacher, I want my channel posts visually highlighted as official
> faculty content, so students can't miss them among student messages.

### Pinned messages

> As a teacher/sub-teacher, I want to pin messages in my channels, so important content
> stays visible at the top.

- Members can open a "pinned messages" list at any time.

### Student participation

> As a student, I want to post and reply in my channels, so I can ask and discuss within
> the right academic context.

## Shared rules

- Membership is always derived from the groupings (join year, major, subject enrollment,
  staff assignment) — never managed by hand inside the chat feature itself.
- Real-time delivery, message history persisted, unread counts per space.
