# Roadmap

Delivery order: users & auth => subjects & majors => channels & community => assessments
=> announcements => chat => IT tickets. The frontend layout is cross-cutting: its shell
is needed from the first feature and grows with each one.

**Rules:**

- A feature's user-story file in [features/](./features/) must exist **before** building it
  (`planned` means the story is written and agreed).
- Whoever finishes a feature flips its status here.
- Statuses: `not written` → `planned` → `building` → `built`.

| # | Feature | Status | User story |
| --- | --- | --- | --- |
| 0 | Healthcheck | built | [features/healthcheck.md](./features/healthcheck.md) |
| 1 | Users, auth & RBAC | built | [features/users-auth.md](./features/users-auth.md) |
| 2 | Join years, majors & subjects | built | [features/subjects-majors.md](./features/subjects-majors.md) |
| 3 | Channels & community | built | [features/channels-community.md](./features/channels-community.md) |
| 4 | Assessments (quizzes & assignments) | built | [features/assessments.md](./features/assessments.md) |
| 5 | Announcements | planned | [features/announcements.md](./features/announcements.md) |
| 6 | Private chat | built | [features/chat.md](./features/chat.md) |
| 7 | IT tickets | built | [features/it-tickets.md](./features/it-tickets.md) |
| — | Frontend layout (cross-cutting) | built | [features/frontend-layout.md](./features/frontend-layout.md) |
