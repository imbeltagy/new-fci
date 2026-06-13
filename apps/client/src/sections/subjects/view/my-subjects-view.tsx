"use client";

import Link from "next/link";

import { useAuthStore } from "@repo/common/stores/auth.store";
import { useMySubjectsQuery } from "@repo/common/queries/subjects.query";
import type {
  StaffMajorEntry,
  StaffSubjectEntry,
  StudentSubjectEntry,
} from "@repo/common/types/subject";

const SEMESTER_LABEL: Record<string, string> = {
  first: "First Semester",
  second: "Second Semester",
  summer: "Summer",
};

function StudentView({ subjects }: { subjects: StudentSubjectEntry[] }) {
  if (subjects.length === 0) {
    return <p className="text-muted-foreground text-sm">You are not enrolled in any subjects yet.</p>;
  }

  return (
    <div className="space-y-3">
      {subjects.map((entry) => {
        const s = entry.subject;
        const staff = s.staffAssignments.map((a) => a.user);
        return (
          <Link
            key={entry.id}
            href={`/subjects/${s.id}`}
            className="block space-y-1 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">{s.code}</span>
                <span className="font-semibold">{s.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{SEMESTER_LABEL[s.semester] ?? s.semester}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {s.major.name} · {s.joinYear.year}
            </p>
            {staff.length > 0 && (
              <p className="text-sm">
                <span className="text-muted-foreground">Staff: </span>
                {staff.map((u) => u.name).join(", ")}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function StaffView({
  subjects,
  majorAssignments,
}: {
  subjects: StaffSubjectEntry[];
  majorAssignments: StaffMajorEntry[];
}) {
  return (
    <div className="space-y-8">
      {majorAssignments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Major Assignments</h2>
          {majorAssignments.map((a) => (
            <Link
              key={a.id}
              href={`/majors/${a.major.id}?year=${a.joinYearId}`}
              className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
            >
              <span className="font-semibold">{a.major.name}</span>
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded ml-2">{a.major.code}</span>
              <span className="text-sm text-muted-foreground ml-2">· {a.joinYear.year}</span>
            </Link>
          ))}
        </div>
      )}

      {subjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Subject Assignments</h2>
          {subjects.map((entry) => {
            const s = entry.subject;
            return (
              <Link
                key={entry.id}
                href={`/subjects/${s.id}`}
                className="block space-y-1 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">{s.code}</span>
                    <span className="font-semibold">{s.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{SEMESTER_LABEL[s.semester] ?? s.semester}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {s.major.name} · {s.joinYear.year}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {majorAssignments.length === 0 && subjects.length === 0 && (
        <p className="text-muted-foreground text-sm">No assignments yet.</p>
      )}
    </div>
  );
}

export function MySubjectsView() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isPending, isError } = useMySubjectsQuery();

  const isStudent = role === "student";
  const payload = data?.data as any;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Subjects</h1>

      {isPending && <p className="text-muted-foreground text-sm">Loading...</p>}
      {isError && <p className="text-destructive text-sm">Failed to load subjects.</p>}

      {!isPending && !isError && payload && (
        isStudent
          ? <StudentView subjects={payload.subjects ?? []} />
          : <StaffView subjects={payload.subjects ?? []} majorAssignments={payload.majorAssignments ?? []} />
      )}
    </div>
  );
}
