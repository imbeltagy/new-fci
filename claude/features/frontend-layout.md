# Frontend Layout

The app shells. Cross-cutting: built with the first feature and extended as features land.
Both apps use Tailwind v4 + shadcn from `@repo/common`.

## Client app — mobile-first

The client app is designed as a **mobile** app. The screens below describe the base
(**student**) experience, with the **teacher/sub-teacher** differences called out inline.

### Shell

**Header (top bar):**

- **Student:** avatar on the left, the **name** beside it with the **major** underneath, and
  the header icon on the far right (see *Header icon* below).
- **Teacher/sub-teacher:** only their **picture and name** (no major), plus the header icon.

**Bottom navigation bar** (4 tabs): **Home**, **Community**, **Chat**, **Settings**.

### Header icon (announcements)

- **Student:** opens a **panel** of the **announcements they received**.
- **Teacher/sub-teacher:** opens a **page** listing the announcements **they created**, with
  a **"New announcement"** button that opens a **dialog** to send one.

### Home tab

Sections, top to bottom:

- **Open assessments** — any assessment/quiz that can be opened *right now*. **Hidden when
  empty**.
- **Near assessments** — assessments that **haven't started yet**. **Hidden when empty**.
- **Subjects** — the subjects the user is enrolled in (student) or assigned to (teacher/
  sub-teacher).
- **Teacher/sub-teacher only:** also a **Majors** section for their assigned majors.

### Subject screen

- All of the subject's **quizzes and assignments**, plus **accumulative marks**.
- The assigned **teacher** and **sub-teacher**.
- The **students** list (searchable).
- A **link to the subject's channel**.
- **Student:** can review any **past assessment** — its mark, their **solved questions**,
  and the **attachments** they submitted.
- **Teacher/sub-teacher:** can **create a new assessment** from inside the subject page.

### Major screen (teacher/sub-teacher)

- Just the **subjects in the major** and the list of **assigned students and teachers**.

### Community tab

- First, a **card to open the join-year community**.
- Then **channel cards** — **major channels first, then subject channels**.

### Chat tab

- The user's private chats (see [chat.md](./chat.md)).
- The **IT support chat** lives here alongside the private chats; it can also be reached by
  redirecting from the **Support tickets** page (see Settings).

### Settings tab

Settings is a **menu** with three entries:

1. **Profile** — the user profile:

   | Field | Editable | Default |
   | --- | --- | --- |
   | Name | read-only | — |
   | Major | read-only | — |
   | Join year | read-only | — |
   | Email | read-only | — |
   | Avatar | **editable** | none (null) |
   | WhatsApp number | **editable** | none (null) |

2. **Support tickets** — the user's IT tickets; opening a ticket's conversation redirects to
   its support chat in the **Chat** tab (see [it-tickets.md](./it-tickets.md)).
3. **Settings** — shows **language** and **theme** as labels only (**not implemented** — no
   i18n/RTL, no theme switching for now), plus a working **logout**.

## Admin app (superadmin & it)

> Not yet detailed with the product owner — the following is a placeholder.

- Dashboard shell: sidebar with Users, Majors, Subjects, Announcements, Tickets.
- Landing overview (counts, recent tickets, health) + consistent management tables
  (search, filters, pagination).
