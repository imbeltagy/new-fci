"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";

import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import {
  useAssessmentDetailQuery,
  useAssessmentSubmissionsQuery,
  useGradeSubmissionMutation,
} from "@repo/common/queries/assessments.query";
import type { AssignmentSubmission } from "@repo/common/types/assessment";

function SubmissionRow({
  sub,
  totalMark,
  assessmentId,
}: {
  sub: AssignmentSubmission;
  totalMark: number;
  assessmentId: string;
}) {
  const [markInput, setMarkInput] = useState(sub.mark?.toString() ?? "");
  const { mutate: grade, isPending } = useGradeSubmissionMutation(assessmentId);

  function handleGrade() {
    const m = parseInt(markInput);
    if (isNaN(m) || m < 0) { toast.error("Enter a valid mark."); return; }
    grade(
      { submissionId: sub.id, mark: m },
      {
        onSuccess: () => toast.success("Graded."),
        onError: (e: any) => toast.error(e?.message ?? "Failed."),
      },
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{sub.student?.name}</p>
          <p className="text-xs text-muted-foreground">{sub.student?.email}</p>
          <p className="text-xs text-muted-foreground">{new Date(sub.updatedAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={totalMark}
            value={markInput}
            onChange={(e) => setMarkInput(e.target.value)}
            className="w-20 h-8 text-sm"
            placeholder="Mark"
          />
          <span className="text-sm text-muted-foreground">/ {totalMark}</span>
          <Button size="sm" onClick={handleGrade} disabled={isPending}>
            {isPending ? "…" : "Save"}
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        {sub.files.map((f) => (
          <a
            key={f.id}
            href={f.file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-primary hover:underline"
          >
            <Paperclip className="h-3 w-3" />
            {f.file.name}
          </a>
        ))}
      </div>
    </div>
  );
}

export function AssignmentManageView({ assessmentId }: { assessmentId: string }) {
  const { data: detailData, isPending: detailPending } = useAssessmentDetailQuery(assessmentId);
  const { data: subsData, isPending: subsPending } = useAssessmentSubmissionsQuery(assessmentId);

  const assessment = detailData?.data?.assessment;
  const submissions: AssignmentSubmission[] =
    subsData?.data && "submissions" in subsData.data
      ? (subsData.data.submissions as AssignmentSubmission[])
      : [];

  if (detailPending || subsPending) return <p className="py-4 text-sm text-muted-foreground">Loading…</p>;
  if (!assessment) return <p className="py-4 text-sm text-destructive">Not found.</p>;

  const totalMark = assessment.totalMark ?? 0;

  return (
    <div className="space-y-4 py-4">
      <h3 className="text-sm font-semibold">
        Submissions ({submissions.length}) · Total: {totalMark} pts
      </h3>
      {submissions.length === 0 && (
        <p className="text-sm text-muted-foreground">No submissions yet.</p>
      )}
      {submissions.map((s) => (
        <SubmissionRow key={s.id} sub={s} totalMark={totalMark} assessmentId={assessmentId} />
      ))}
    </div>
  );
}
