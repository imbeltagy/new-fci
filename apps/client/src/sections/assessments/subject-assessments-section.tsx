"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { Button } from "@repo/common/components/ui/button";
import { useListAssessmentsQuery } from "@repo/common/queries/assessments.query";
import { useAuthStore } from "@repo/common/stores/auth.store";

import { AssessmentCard } from "./assessment-card";

export function SubjectAssessmentsSection({ subjectId }: { subjectId: string }) {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isPending } = useListAssessmentsQuery({ subjectId, showOld: true });
  const items = data?.data?.assessments ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground">Assessments</h2>
        </div>
        {(role === "teacher" || role === "sub_teacher") && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/assessments/create?subjectId=${subjectId}`}>+ New</Link>
          </Button>
        )}
      </div>
      {isPending && <p className="text-xs text-muted-foreground">Loading…</p>}
      {!isPending && items.length === 0 && (
        <p className="text-sm text-muted-foreground">No assessments yet.</p>
      )}
      <div className="space-y-2">
        {items.map((a) => <AssessmentCard key={a.id} assessment={a} />)}
      </div>
    </div>
  );
}
