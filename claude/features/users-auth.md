# Users, Auth & RBAC

Identity and permission layer. Everything else in the product builds on this.

## Roles

The exact role values stored in the DB and shown in the app:

| Role | App | Description |
| --- | --- | --- |
| `student` | client | Enrolls, takes assessments, sees own grades |
| `teacher` | client | Teaches subjects, posts content, creates assessments, publishes grades |
| `sub-teacher` | client | TA; supports teaching and grading within assigned subjects |
| `it` | admin | Platform operations, limited by granular permissions |
| `superadmin` | admin | Full control over everything |

**Terminology convention (used across all docs):**

- **client** = `student`, `teacher`, `sub-teacher` (users of the client app)
- **admin** = `superadmin`, `it` (users of the admin app)

## Permission model

- **superadmin** — full control; no permission checks apply.
- **it** — resource-action based permissions, e.g. `students:read`, `users:create`,
  `tickets:manage`. Granted and revoked by the superadmin. An it user can only perform
  actions matching their permissions.
- **client roles** — capabilities are fixed by the role itself (e.g., all students access
  subjects). No per-user resource-action permissions for client roles.

## User stories — authentication

### Client login

> As a client user, I want to sign in with my email and password, so I can access the
> client app.

- Returns an **access token** and a **refresh token**, each with its expiry date.
- The refresh endpoint issues a new pair (rotation); logout invalidates the refresh token.

### Admin login (session layer)

> As an admin user, I want my tokens kept server-side, so a browser compromise can't leak
> them.

- Login still produces access/refresh tokens internally, but they are **stored in Redis**
  under a session — never returned to the browser.
- The response sets two cookies via headers: `session_id` (httpOnly) and a **CSRF token**.
- On each request the server validates the CSRF token, then retrieves the access token
  from Redis by `session_id` and authorizes with it.
- Logout destroys the Redis session (cookies become useless).

### Password rules

- Passwords are always stored **hashed** (bcrypt/argon2), never plaintext.
- Login is rate-limited; failed logins return a generic error (no user enumeration).

### Password reset

> As a user, I want to request a password reset by email, so I can recover access myself.

- Reset link contains a single-use, expiring token.

## User stories — provisioning

### Superadmin

- The superadmin account is created **directly in the database** (seed script), never
  through the API or app.

### Create accounts

> As a superadmin — or an it user holding the required permission (e.g. `users:create`) —
> I want to create accounts for `it`, `student`, `teacher`, and `sub-teacher` users
> (single or bulk), so only provisioned members exist on the platform.

- No public self-signup. Email is required, unique, and is the login identifier.
- For students, join year and major are set at creation.
- A **temporary password** is generated for the new account.

### Credentials email (manual trigger)

> As an admin, I want creating an account to NOT auto-send the credentials email, and
> instead trigger the send myself — for a single user or many at once — so onboarding is
> controlled.

- Each user has a `send_once: boolean` field — `false` until the credentials email has
  been sent at least once, then `true`.
- The email contains the temporary password.

### Forced password change

> As a newly provisioned user, I want to be forced to replace the temporary password
> during my first login, so my account is private from day one.

- Until changed, no other action is allowed.

### Deactivation

> As an admin, I want to deactivate an account, so access is blocked while data is kept.

### Profile

> As a user, I want to view and edit my profile (name, avatar, cover image), so others can
> recognize me.

- Profile fields surfaced to others: name, email, avatar, cover image (`cover_url`), role.
- Academic fields (role, join year, major) are read-only for the user — only admin changes them.
- **WhatsApp number** — **students only** can add a WhatsApp number to their profile. It is
  **visible only to admins** — not to other students, and **not to teachers/sub-teachers
  either**. It is never displayed anywhere as a contact; it is used **solely** as a delivery
  channel for announcement notifications (see [announcements.md](./announcements.md)).

### Profile visibility & discovery (client users)

> As a client user, I want to access the profile of anyone I share a channel or community
> with, so I can see who I'm talking to.

- Any member of a channel or community can view the profiles of **all** members of that
  space — student, teacher, or sub-teacher alike.

> As a client user, I want to share my email or my profile link so anyone can reach my
> profile, even if we share no space.

- Opening a profile **link**, or searching by **exact email**, resolves to the profile
  regardless of shared membership.
- Searching by **name** only returns users with whom I share a community or channel.

These rules apply to client users only (admins are not part of profile discovery). Having
access to a profile is what lets a client start a private chat with that user — see
[chat.md](./chat.md).

## Capability matrix (summary — each feature file refines its own rows)

| Capability | student | teacher | sub-teacher | it | superadmin |
| --- | --- | --- | --- | --- | --- |
| View enrolled subjects, take assessments, see own grades | ✔ | — | — | — | ✔ |
| Manage content/assessments/grades in assigned subjects | — | ✔ | ✔ | — | ✔ |
| Announce to own subjects | — | ✔ | ✔ | — | ✔ |
| Announce to major/year/everyone | — | — | — | per permission | ✔ |
| Manage users, majors, subjects | — | — | — | per permission | ✔ |
| Handle IT tickets, moderate chats | — | — | — | per permission | ✔ |
| Manage it permissions | — | — | — | — | ✔ |

## Security rules (cross-cutting)

- Authorization is checked on the server for every request; the UI hiding a button is
  never the only guard.
- Admin cookies: httpOnly, secure, strict sameSite.
- All input validated on the server.
- CORS restricted to the known app origins in production.
