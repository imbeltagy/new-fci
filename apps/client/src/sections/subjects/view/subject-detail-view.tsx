"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessagesSquare } from "lucide-react";

import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { useSubjectDetailQuery } from "@repo/common/queries/subjects.query";
import { useAuthStore } from "@repo/common/stores/auth.store";
import type { SubjectDetailStaff, SubjectDetailStudent } from "@repo/common/types/subject";
import { MessageButton } from "@/components/message-button";
import { SubjectAssessmentsSection } from "@/sections/assessments/subject-assessments-section";

const SEMESTER_LABEL: Record<string, string> = {
  first: "First Semester",
  second: "Second Semester",
  summer: "Summer",
};

const ROLE_LABEL: Record<string, string> = {
  teacher: "Teacher",
  sub_teacher: "Sub Teacher",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Avatar({ url, name, className }: { url: string | null; name: string; className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground ${className ?? "h-9 w-9"}`}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}

function StaffRow({ person, showMessage }: { person: SubjectDetailStaff; showMessage: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Link href={`/users/${encodeURIComponent(person.email)}`} className="flex shrink-0">
        <Avatar url={person.avatarUrl} name={person.name} />
      </Link>
      <Link
        href={`/users/${encodeURIComponent(person.email)}`}
        className="min-w-0 flex-1"
      >
        <p className="truncate text-sm font-medium hover:underline">{person.name}</p>
        <p className="text-xs text-muted-foreground">{ROLE_LABEL[person.role] ?? person.role}</p>
      </Link>
      {showMessage && <MessageButton userId={person.id} />}
    </div>
  );
}

function StudentRow({ person, showMessage }: { person: SubjectDetailStudent; showMessage: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Link href={`/users/${encodeURIComponent(person.email)}`} className="flex shrink-0">
        <Avatar url={person.avatarUrl} name={person.name} className="h-8 w-8" />
      </Link>
      <Link
        href={`/users/${encodeURIComponent(person.email)}`}
        className="min-w-0 flex-1"
      >
        <p className="truncate text-sm font-medium hover:underline">{person.name}</p>
        <p className="truncate text-xs text-muted-foreground">{person.email}</p>
      </Link>
      {showMessage && <MessageButton userId={person.id} />}
    </div>
  );
}

export function SubjectDetailView({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [search, setSearch] = useState("");
  const { data, isPending, isError } = useSubjectDetailQuery(subjectId);

  const detail = data?.data;

  if (isPending) {
    return <p className="py-6 text-sm text-muted-foreground">Loading...</p>;
  }
  if (isError || !detail) {
    return <p className="py-6 text-sm text-destructive">Failed to load subject.</p>;
  }

  const { subject, channelId, staff, students } = detail;
  const filteredStudents = search
    ? students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : students;

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{subject.code}</span>
            <h1 className="truncate text-lg font-bold">{subject.name}</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {subject.major.name} · {subject.joinYear.year} ·{" "}
            {SEMESTER_LABEL[subject.semester] ?? subject.semester}
          </p>
        </div>
      </div>

      {channelId && (
        <Button className="w-full" onClick={() => router.push(`/community/${channelId}`)}>
          <MessagesSquare className="mr-2 h-4 w-4" />
          Go to subject channel
        </Button>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Staff</h2>
        {staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff assigned.</p>
        ) : (
          <div className="space-y-2">
            {staff.map((s) => (
              <StaffRow key={s.id} person={s} showMessage={s.id !== currentUserId} />
            ))}
          </div>
        )}
      </div>

      <SubjectAssessmentsSection subjectId={subjectId} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Students ({students.length})
        </h2>
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filteredStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students found.</p>
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((s) => (
              <StudentRow key={s.id} person={s} showMessage={s.id !== currentUserId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
