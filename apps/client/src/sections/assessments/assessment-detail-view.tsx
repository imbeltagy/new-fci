"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye } from "lucide-react";

import { Badge } from "@repo/common/components/ui/badge";
import { Button } from "@repo/common/components/ui/button";
import {
  useAssessmentDetailQuery,
  useAssessmentSubmissionsQuery,
  useUpdateAssessmentMutation,
} from "@repo/common/queries/assessments.query";
import { useAuthStore } from "@repo/common/stores/auth.store";

import { AssignmentManageView } from "./assignment-manage-view";
import { AssignmentSubmitView } from "./assignment-submit-view";
import { QuizManageView } from "./quiz-manage-view";
import { QuizTakeView } from "./quiz-take-view";

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AssessmentDetailView({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const { data, isPending, isError } = useAssessmentDetailQuery(assessmentId);
  const { mutate: update, isPending: updating } = useUpdateAssessmentMutation(assessmentId);

  const assessment = data?.data?.assessment;
  const isStaff = role === "teacher" || role === "sub_teacher";
  const isStudent = !isStaff && role !== undefined;
  const { data: submissionsData } = useAssessmentSubmissionsQuery(assessmentId);
  const hasSubmitted = isStudent && submissionsData?.data != null && "submission" in submissionsData.data && submissionsData.data.submission != null;

  if (isPending) return <p className="py-8 text-sm text-muted-foreground">Loading…</p>;
  if (isError || !assessment) return <p className="py-8 text-sm text-destructive">Assessment not found.</p>;

  const hasEnded = new Date() > new Date(assessment.endDate);

  function toggleVisible() {
    update(
      { isVisible: true },
      {
        onSuccess: () => toast.success("Published to students."),
        onError: (e: any) => toast.error(e?.message ?? "Failed."),
      },
    );
  }

  function releaseMarks() {
    update(
      { markReadable: true },
      {
        onSuccess: () => toast.success("Marks released to students."),
        onError: (e: any) => toast.error(e?.message ?? "Failed."),
      },
    );
  }

  const canPublish = isStaff && !assessment.isVisible;
  const canReleaseMarks = isStaff && assessment.isVisible && !assessment.markReadable && hasEnded;

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{assessment.type}</Badge>
            {!assessment.isVisible && isStaff && (
              <Badge variant="secondary">Hidden</Badge>
            )}
            {hasSubmitted && (
              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                Submitted
              </Badge>
            )}
            <h1 className="text-base font-bold leading-snug">{assessment.title}</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {assessment.subject.code} · {assessment.subject.name}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-3 space-y-1 text-xs text-muted-foreground">
        <p><span className="font-medium text-foreground">Start:</span> {fmt(assessment.startDate)}</p>
        <p><span className="font-medium text-foreground">End:</span> {fmt(assessment.endDate)}</p>
        {assessment.totalMark !== null && (
          <p><span className="font-medium text-foreground">Total mark:</span> {assessment.totalMark} pts</p>
        )}
      </div>

      {(canPublish || canReleaseMarks) && (
        <div className="flex gap-2">
          {canPublish && (
            <Button variant="outline" size="sm" onClick={toggleVisible} disabled={updating}>
              <Eye className="h-3.5 w-3.5 mr-1" />Publish
            </Button>
          )}
          {canReleaseMarks && (
            <Button variant="outline" size="sm" onClick={releaseMarks} disabled={updating}>
              Release Marks
            </Button>
          )}
        </div>
      )}

      {isStaff
        ? assessment.type === "quiz"
          ? <QuizManageView assessmentId={assessmentId} />
          : <AssignmentManageView assessmentId={assessmentId} />
        : assessment.type === "quiz"
          ? <QuizTakeView assessmentId={assessmentId} />
          : <AssignmentSubmitView assessmentId={assessmentId} />
      }
    </div>
  );
}
