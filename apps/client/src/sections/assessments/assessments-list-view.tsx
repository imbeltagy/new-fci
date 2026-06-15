"use client";

import { useState } from "react";

import { Button } from "@repo/common/components/ui/button";
import { useListAssessmentsQuery } from "@repo/common/queries/assessments.query";
import type { Assessment, AssessmentType } from "@repo/common/types/assessment";

import { AssessmentCard } from "./assessment-card";

function groupBySubject(items: Assessment[]) {
  const map = new Map<string, { subjectName: string; subjectCode: string; items: Assessment[] }>();
  for (const a of items) {
    const key = a.subjectId;
    if (!map.has(key)) {
      map.set(key, { subjectName: a.subject.name, subjectCode: a.subject.code, items: [] });
    }
    map.get(key)!.items.push(a);
  }
  return Array.from(map.values());
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function AssessmentsListView() {
  const [tab, setTab] = useState<AssessmentType>("assignment");
  const [showOld, setShowOld] = useState(false);

  const { data, isPending, isError } = useListAssessmentsQuery({ type: tab, showOld });
  const items = data?.data?.assessments ?? [];
  const groups = groupBySubject(items);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex border-b w-full">
          <Tab active={tab === "assignment"} onClick={() => setTab("assignment")}>Assignments</Tab>
          <Tab active={tab === "quiz"} onClick={() => setTab("quiz")}>Quizzes</Tab>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowOld((v) => !v)}>
          {showOld ? "Hide Old" : "Show Old"}
        </Button>
      </div>

      {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && <p className="text-sm text-destructive">Failed to load assessments.</p>}

      {!isPending && groups.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No {tab === "quiz" ? "quizzes" : "assignments"} found.
        </p>
      )}

      {groups.map((g) => (
        <div key={g.subjectCode} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {g.subjectCode} · {g.subjectName}
          </h2>
          <div className="space-y-2">
            {g.items.map((a) => (
              <AssessmentCard key={a.id} assessment={a} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
