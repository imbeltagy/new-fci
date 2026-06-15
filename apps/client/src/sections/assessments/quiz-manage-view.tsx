"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { Label } from "@repo/common/components/ui/label";
import {
  useAddQuestionMutation,
  useAssessmentDetailQuery,
  useAssessmentSubmissionsQuery,
  useDeleteQuestionMutation,
} from "@repo/common/queries/assessments.query";
import type { QuizQuestion, QuizSubmission } from "@repo/common/types/assessment";

function QuestionCard({
  question,
  index,
  locked,
  onDelete,
}: {
  question: QuizQuestion;
  index: number;
  locked: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">
          {index + 1}. {question.text}
          <span className="ml-2 text-xs text-muted-foreground">({question.degree} pt{question.degree !== 1 ? "s" : ""})</span>
        </p>
        {!locked && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="space-y-1">
        {question.options.map((opt) => (
          <div
            key={opt.id}
            className={`rounded px-2 py-1 text-xs ${opt.index === question.correctOption ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium" : "text-muted-foreground"}`}
          >
            {String.fromCharCode(65 + opt.index)}. {opt.text}
            {opt.index === question.correctOption && " ✓"}
          </div>
        ))}
      </div>
    </div>
  );
}

function AddQuestionForm({ assessmentId }: { assessmentId: string }) {
  const { mutate: add, isPending } = useAddQuestionMutation(assessmentId);
  const [optionCount, setOptionCount] = useState(2);
  const { register, handleSubmit, reset, watch, setValue } = useForm<{
    text: string;
    degree: number;
    options: string[];
    correctOption: number;
  }>({ defaultValues: { degree: 1, correctOption: 0 } });

  function removeOption(index: number) {
    const current = (watch("options") as string[]) ?? [];
    const remaining = current.filter((_, i) => i !== index);
    remaining.forEach((val, i) => setValue(`options.${i}` as any, val));
    const correct = Number(watch("correctOption"));
    if (correct === index) setValue("correctOption", 0);
    else if (correct > index) setValue("correctOption", correct - 1);
    setOptionCount((n) => n - 1);
  }

  function onSubmit(data: any) {
    const options: string[] = Array.from({ length: optionCount }, (_, i) => data.options?.[i] ?? "");
    if (options.some((o) => !o.trim())) { toast.error("All options must be filled."); return; }
    add(
      { text: data.text, degree: Number(data.degree), options, correctOption: Number(data.correctOption) },
      {
        onSuccess: () => { toast.success("Question added."); reset(); setOptionCount(2); },
        onError: (e: any) => toast.error(e?.message ?? "Failed to add question."),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold">Add Question</p>
      <div>
        <Label className="text-xs">Question text</Label>
        <Input {...register("text", { required: true })} placeholder="Enter question…" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Label className="text-xs">Degree (pts)</Label>
          <Input type="number" min={1} {...register("degree")} />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Correct option</Label>
          <select {...register("correctOption")} className="w-full rounded-md border px-3 py-2 text-sm bg-background">
            {Array.from({ length: optionCount }, (_, i) => (
              <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Options</Label>
        {Array.from({ length: optionCount }, (_, i) => (
          <div key={i} className="flex gap-2">
            <Input {...register(`options.${i}` as any)} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
            {i >= 2 && (
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeOption(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        {optionCount < 6 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setOptionCount((n) => n + 1)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
          </Button>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Adding…" : "Add Question"}
      </Button>
    </form>
  );
}

export function QuizManageView({ assessmentId }: { assessmentId: string }) {
  const { data: detailData, isPending } = useAssessmentDetailQuery(assessmentId);
  const { data: subsData } = useAssessmentSubmissionsQuery(assessmentId);
  const { mutate: deleteQ } = useDeleteQuestionMutation(assessmentId);

  const assessment = detailData?.data?.assessment;
  const questions: QuizQuestion[] = assessment?.questions ?? [];
  const submissions: QuizSubmission[] = subsData?.data && "submissions" in subsData.data
    ? (subsData.data.submissions as QuizSubmission[])
    : [];

  if (isPending) return <p className="py-4 text-sm text-muted-foreground">Loading…</p>;
  if (!assessment) return <p className="py-4 text-sm text-destructive">Not found.</p>;

  const locked = assessment.isVisible;
  const totalMark = questions.reduce((s, q) => s + q.degree, 0);

  function handleDelete(questionId: string) {
    deleteQ(questionId, {
      onSuccess: () => toast.success("Question deleted."),
      onError: (e: any) => toast.error(e?.message ?? "Failed."),
    });
  }

  return (
    <div className="space-y-6 py-4">
      {locked && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          Quiz is published — questions are locked.
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Questions ({questions.length}) · Total: {totalMark} pts</h3>
        {questions.length === 0 && <p className="text-sm text-muted-foreground">No questions yet.</p>}
        {questions.map((q, i) => (
          <QuestionCard key={q.id} question={q} index={i} locked={locked} onDelete={() => handleDelete(q.id)} />
        ))}
      </div>
      {!locked && <AddQuestionForm assessmentId={assessmentId} />}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Submissions ({submissions.length})</h3>
        {submissions.length === 0 && <p className="text-sm text-muted-foreground">No submissions yet.</p>}
        {submissions.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm">
            <div>
              <p className="font-medium">{s.student?.name}</p>
              <p className="text-xs text-muted-foreground">{s.student?.email}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{s.mark ?? "—"} / {totalMark}</p>
              <p className="text-xs text-muted-foreground">{new Date(s.submittedAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
