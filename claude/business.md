# Business — FCI Community

An all-in-one academic communication and management platform for a university faculty
(FCI — Faculty of Computers and Informatics, Tanta University). A private "social +
learning" system: the chat/community feel of Discord/Teams combined with the academic
structure of an LMS (Moodle/Canvas), in one product.

## The problem

Faculty communication is scattered across WhatsApp, Facebook, email, and paper notices.
Students miss announcements, faculty posts get buried, and enrollment/grading are manual.

## The solution

One organized, role-aware platform that centralizes:

- **Community** — join-year (cohort) social chats so students bond with their cohort.
- **Channels** — formal major- and subject-based spaces with automatic membership; faculty content highlighted and pinnable.
- **Subjects & Assessments** — enrollment, quizzes/assignments with deadlines, grade publishing.
- **Announcements** — targeted, priority-based alerts (person, subject, major, or whole join year).
- **Private chat + IT support** — direct messaging plus an anonymous "IT support" ticket flow.

## Roles & apps

| Role | Description | App |
| --- | --- | --- |
| `student` | Largest group; chats, enrolls, takes quizzes, gets grades and alerts | client |
| `teacher` | Teaches, posts content, creates assessments, publishes grades | client |
| `sub-teacher` | TA; supports teaching and grading | client |
| `it` | Runs platform operations within granted permissions, handles support | admin |
| `superadmin` | Full control over everything | admin |

**Terminology convention (used across all docs):** "**client**" means the
`student`/`teacher`/`sub-teacher` roles (client app); "**admin**" means
`superadmin`/`it` (admin app). Permission details live in
[features/users-auth.md](./features/users-auth.md).

The buyer is the faculty/university. Positioned as a single-faculty graduation project,
but the model is scalable — it could become a SaaS sold to multiple faculties.

## Selling points

Better student engagement, less administrative overhead (automated enrollment and
notifications), reliable delivery of critical info, professional support system — secure,
smooth on mobile and desktop.

## Where the details live

- Delivery plan and feature status → [roadmap.md](./roadmap.md)
- Per-feature user stories → [features/](./features/)
