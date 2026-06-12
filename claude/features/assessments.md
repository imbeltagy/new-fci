# Assessments — Quizzes & Assignments

Online assessment inside a subject. Two kinds: **quizzes** (auto-graded multiple choice in
a short window) and **assignments** (file submissions graded manually over days).

## Common rules

- Created by a **teacher or sub-teacher**, and **linked to a subject**. "The students of an
  assessment" = the enrolled students of that subject.
- Has dates (a start and an end). Submission outside the window is blocked.
- Each assessment carries a **`mark_readable`** flag (default off) — it controls whether
  students can see their marks (see *Marks & visibility*).
- **Announcements** are tied to assessments at two points (see *Announcing*).

## Quizzes

### Structure

> As a teacher/sub-teacher, I want to build a quiz from multiple-choice questions, so
> students are assessed automatically.

- Each **question** has at least **2 options** (a, b, c, …) with **exactly one correct
  answer**; the teacher marks which option is correct.
- Each question has a **degree** (points) — default **1**, the teacher can set 1, 2, etc.
- The quiz total is the sum of its questions' degrees.

### Timing & taking

> As a teacher/sub-teacher, I want a start and end time (often a short window, e.g. ~1 hour)
> so the quiz is taken in a controlled period.

> As a student, I want to join and solve the quiz within its window, so I'm assessed online.

- **One attempt** per student; the window is enforced **server-side**.
- On submit, the mark is **auto-calculated** immediately from the correct answers.

## Assignments

### Structure & submission

> As a teacher/sub-teacher, I want to create an assignment with a single total **mark** (no
> per-part splitting) and a deadline (usually days), so students submit work online.

> As a student, I want to upload attachment(s) (e.g. PDF) as my solution and replace them
> until the deadline (latest counts), so my best work is graded.

- Assignments are file submissions, **not** questions.
- Late submission is blocked after the deadline.

### Grading

> As a teacher/sub-teacher, I want to review each submission and add its mark manually, so
> students get a fair result.

- Unlike quizzes, assignment marks are **not** auto-calculated — the teacher reviews and
  assigns the mark.

## Two visibility flags

An assessment has **two independent visibility flags**, both controlled by the
teacher/sub-teacher.

### 1. Assessment visibility (is the quiz/assignment shown to students)

> As a teacher/sub-teacher, I want to publish a hidden assessment when it's ready, so
> students see it ahead of time.

- A newly created assessment is **hidden** from students.
- The teacher can mark it **visible**; doing so **sends an announcement** to the
  assessment's students (priority chosen by the teacher, **default `medium`**).
- It must be made visible **at least one day before its start date** — publishing later
  than that is not allowed.
- After it's visible, the teacher can send **additional announcements** about it (reminders)
  as long as the assessment **period has not ended**.

### 2. Mark visibility (`mark_readable`)

> As a teacher/sub-teacher, I want to release marks when I'm ready, so students don't see
> results prematurely.

- The teacher/sub-teacher **can see marks at any time** — quiz marks immediately (auto),
  assignment marks once they've graded.
- A **student cannot see their mark** until the teacher sets **`mark_readable`**.
- Setting `mark_readable` **automatically sends an announcement** to the assessment's
  students with **`low`** priority, saying the mark is now available.

## Student's view of assessments

> As a student, I want to see all the visible quizzes and assignments of my subjects —
> including ones already ended and ones not yet started — so I can plan and review.

- A student sees every assessment in their subjects that the teacher has made **visible**
  (whether it has ended, is running, or hasn't started yet). Hidden assessments never
  appear.

All announcements above use the announcements system (see
[announcements.md](./announcements.md)).
