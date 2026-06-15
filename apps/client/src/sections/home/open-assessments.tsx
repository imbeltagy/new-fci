"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { Button } from "@repo/common/components/ui/button";
import { useListAssessmentsQuery } from "@repo/common/queries/assessments.query";

import { AssessmentCard } from "../assessments/assessment-card";

export function OpenAssessments() {
  const { data, isPending } = useListAssessmentsQuery({ type: "assignment", limit: 3 });
  const items = data?.data?.assessments ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Assignments</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/assessments?tab=assignment">Show All</Link>
        </Button>
      </div>
      {isPending && <p className="text-xs text-muted-foreground">Loading…</p>}
      {!isPending && items.map((a) => <AssessmentCard key={a.id} assessment={a} />)}
    </div>
  );
}
