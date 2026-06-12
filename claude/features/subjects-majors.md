# Join Years, Majors & Subjects

The grouping structure of the platform. It's about separating students into groups, from
biggest to smallest:

```
join year  ⊃  major  ⊃  subject
```

- **Join year** — the cohort a student entered with (e.g., 2023). The biggest group.
- **Major** — a partition inside a join year. Usually academic (e.g., Computer Science),
  but the concept is a flexible label — in another deployment it could be "5th grade".
- **Subject** — the smallest unit; what gets taught/assessed. A subject is assigned to
  exactly **one major and one join year**, so each subject record is **unique** — a new
  cohort taking "the same course" gets a new subject record.

## Membership rules

- A **student** has exactly **1 join year**, exactly **1 major**, and **1 or more
  subjects**.
- A **teacher/sub-teacher** can be assigned to:
  - **1 or more subjects**, and/or
  - a **major** — always together with a **join year**: the assignment is to the
    (major × join year) intersection, never to a major across all cohorts. If assigned to
    a (major × join year) but not to a subject inside it, they can access the major (its
    channel) but **not** that subject;
  - and optionally a **join year** (or none) — this controls community membership.
- These groupings exist to drive **community and channel membership** — see
  [channels-community.md](./channels-community.md) for exactly what each level grants.

## User stories

### Manage the structure

> As an admin, I want to manage join years, majors (name + code), and subjects (code,
> name, semester, and the one major + one join year it belongs to), so the platform
> mirrors the faculty structure.

### Assign staff

> As an admin, I want to assign a teacher/sub-teacher to subjects, to a (major × join
> year), and optionally to a join year (for the community), so their access and
> channel/community membership follow their real teaching duties.

### Enroll students

> As an admin, I want to set each student's join year and major at creation, and manage
> their subject enrollments (bulk for a join-year+major group, or individually for
> retakes/exceptions), so every student is in the right groups.

- Changing a student's join year/major recalculates their community/channel memberships.

### My subjects

> As a student, I want to see my subjects with their staff and a link to each subject's
> channel, so I have one entry point per subject.

> As a teacher/sub-teacher, I want to see the majors/subjects I'm assigned to, so I can
> reach my teaching spaces quickly.
