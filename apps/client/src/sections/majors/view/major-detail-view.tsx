"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessagesSquare } from "lucide-react";

import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { useMajorDetailQuery } from "@repo/common/queries/majors.query";
import { useAuthStore } from "@repo/common/stores/auth.store";
import type { MajorDetailPerson } from "@repo/common/types/major";
import { MessageButton } from "@/components/message-button";

const ROLE_LABEL: Record<string, string> = {
  teacher: "Teacher",
  sub_teacher: "Sub Teacher",
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

function PersonRow({ person, showMessage }: { person: MajorDetailPerson; showMessage: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Avatar url={person.avatarUrl} name={person.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{person.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {person.role ? (ROLE_LABEL[person.role] ?? person.role) : person.email}
        </p>
      </div>
      {showMessage && <MessageButton userId={person.id} />}
    </div>
  );
}

export function MajorDetailView({
  majorId,
  joinYearId,
}: {
  majorId: string;
  joinYearId: string;
}) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [search, setSearch] = useState("");
  const { data, isPending, isError } = useMajorDetailQuery(majorId, joinYearId);

  const detail = data?.data;

  if (isPending) {
    return <p className="py-6 text-sm text-muted-foreground">Loading...</p>;
  }
  if (isError || !detail) {
    return <p className="py-6 text-sm text-destructive">Failed to load major.</p>;
  }

  const { major, joinYear, channelId, subjects, teachers, students } = detail;
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
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{major.code}</span>
            <h1 className="truncate text-lg font-bold">{major.name}</h1>
          </div>
          <p className="text-xs text-muted-foreground">Join year {joinYear.year}</p>
        </div>
      </div>

      {channelId && (
        <Button className="w-full" onClick={() => router.push(`/community/${channelId}`)}>
          <MessagesSquare className="mr-2 h-4 w-4" />
          Go to major channel
        </Button>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Subjects ({subjects.length})
        </h2>
        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subjects.</p>
        ) : (
          <div className="space-y-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/subjects/${s.id}`)}
                className="flex w-full items-center gap-2 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted"
              >
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{s.code}</span>
                <span className="truncate text-sm font-medium">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Teachers ({teachers.length})
        </h2>
        {teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teachers assigned.</p>
        ) : (
          <div className="space-y-2">
            {teachers.map((t) => (
              <PersonRow key={t.id} person={t} showMessage={t.id !== currentUserId} />
            ))}
          </div>
        )}
      </div>

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
              <PersonRow key={s.id} person={s} showMessage={s.id !== currentUserId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
