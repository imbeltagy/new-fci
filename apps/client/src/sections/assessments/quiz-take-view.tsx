"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@repo/common/components/ui/button";
import {
  useAssessmentDetailQuery,
  useAssessmentSubmissionsQuery,
  useSubmitQuizMutation,
} from "@repo/common/queries/assessments.query";
import type { QuizQuestion } from "@repo/common/types/assessment";

function OptionButton({
  text,
  selected,
  correct,
  showResult,
  onClick,
}: {
  text: string;
  selected: boolean;
  correct?: boolean;
  showResult: boolean;
  onClick: () => void;
}) {
  let cls = "w-full text-left rounded-lg border p-3 text-sm transition-colors ";
  if (showResult) {
    cls += correct ? "border-green-500 bg-green-50 dark:bg-green-950/30" : selected ? "border-destructive bg-destructive/10" : "bg-muted/30";
  } else {
    cls += selected ? "border-primary bg-primary/10" : "hover:bg-accent/50";
  }
  return (
    <button className={cls} onClick={onClick} disabled={showResult}>
      {text}
    </button>
  );
}

export function QuizTakeView({ assessmentId }: { assessmentId: string }) {
  const { data: detailData, isPending: detailPending } = useAssessmentDetailQuery(assessmentId);
  const { data: subsData, isPending: subsPending } = useAssessmentSubmissionsQuery(assessmentId);
  const { mutate: submit, isPending: submitting } = useSubmitQuizMutation(assessmentId);

  const assessment = detailData?.data?.assessment;
  const subsResult = subsData?.data;

  const existingSubmission =
    subsResult && subsResult.type === "quiz" && "submission" in subsResult
      ? (subsResult as { type: "quiz"; submission: import("@repo/common/types/assessment").QuizSubmission | null }).submission
      : null;

  const [answers, setAnswers] = useState<Record<string, number>>({});

  if (detailPending || subsPending) {
    return <p className="py-4 text-sm text-muted-foreground">Loading...</p>;
  }
  if (!assessment) {
    return <p className="py-4 text-sm text-destructive">Assessment not found.</p>;
  }

  const now = new Date();
  const started = now >= new Date(assessment.startDate);
  const ended = now > new Date(assessment.endDate);
  const questions: QuizQuestion[] = assessment.questions ?? [];

  if (!started) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        This quiz starts on {new Date(assessment.startDate).toLocaleString()}.
      </p>
    );
  }

  if (existingSubmission) {
    return (
      <div className="space-y-4 py-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium">Quiz submitted</p>
          {assessment.markReadable && existingSubmission.mark !== null ? (
            <p className="mt-1 text-2xl font-bold">
              {existingSubmission.mark} / {assessment.totalMark ?? "?"} pts
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Marks will be released by the teacher.</p>
          )}
        </div>
        {questions.length > 0 && existingSubmission.answers?.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Your answers</h3>
            {questions.map((q, qi) => {
              const ans = existingSubmission.answers.find((a) => a.questionId === q.id);
              return (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">{qi + 1}. {q.text}</p>
                  <div className="space-y-1">
                    {q.options.map((opt) => (
                      <OptionButton
                        key={opt.id}
                        text={opt.text}
                        selected={ans?.selectedOption === opt.index}
                        correct={opt.index === q.correctOption}
                        showResult={assessment.markReadable}
                        onClick={() => {}}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (ended) {
    return <p className="py-4 text-sm text-muted-foreground">The quiz window has closed.</p>;
  }

  if (questions.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">No questions available yet.</p>;
  }

  function handleSubmit() {
    const answerList = questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] ?? -1,
    }));
    const unanswered = answerList.filter((a) => a.selectedOption === -1);
    if (unanswered.length) {
      toast.error(`Please answer all ${unanswered.length} remaining question(s).`);
      return;
    }
    submit(
      { answers: answerList },
      {
        onSuccess: () => toast.success("Quiz submitted!"),
        onError: (e: any) => toast.error(e?.message ?? "Failed to submit."),
      },
    );
  }

  return (
    <div className="space-y-6 py-4">
      {questions.map((q, qi) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm font-medium">
            {qi + 1}. {q.text}
            <span className="ml-2 text-xs text-muted-foreground">({q.degree} pt{q.degree !== 1 ? "s" : ""})</span>
          </p>
          <div className="space-y-1">
            {q.options.map((opt) => (
              <OptionButton
                key={opt.id}
                text={opt.text}
                selected={answers[q.id] === opt.index}
                showResult={false}
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.index }))}
              />
            ))}
          </div>
        </div>
      ))}
      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Quiz"}
      </Button>
    </div>
  );
}
