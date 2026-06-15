"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Badge } from "@repo/common/components/ui/badge";
import { Button } from "@repo/common/components/ui/button";
import { ConfirmDialog } from "@repo/common/components/custom/confirm-dialog";
import { Input } from "@repo/common/components/ui/input";
import { Label } from "@repo/common/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/common/components/ui/table";
import {
  useAddQuestionMutation,
  useAssessmentDetailQuery,
  useAssessmentSubmissionsQuery,
  useDeleteAssessmentMutation,
  useDeleteQuestionMutation,
  useGradeSubmissionMutation,
  useUpdateAssessmentMutation,
} from "@repo/common/queries/assessments.query";
import type { AssignmentSubmission, QuizQuestion, QuizSubmission } from "@repo/common/types/assessment";
import { PageHeader } from "@/components/control-panel/page-header";

function fmt(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function QuizQuestionsPanel({ assessmentId, locked }: { assessmentId: string; locked: boolean }) {
  const { data: detailData } = useAssessmentDetailQuery(assessmentId);
  const { mutate: addQ, isPending: adding } = useAddQuestionMutation(assessmentId);
  const { mutate: delQ } = useDeleteQuestionMutation(assessmentId);
  const [optCount, setOptCount] = useState(2);
  const { register, handleSubmit, reset, watch, setValue } = useForm<{ text: string; degree: number; options: string[]; correctOption: number }>({
    defaultValues: { degree: 1, correctOption: 0 },
  });

  const questions: QuizQuestion[] = detailData?.data?.assessment?.questions ?? [];
  const totalMark = questions.reduce((s, q) => s + q.degree, 0);

  function removeOpt(index: number) {
    const current = (watch("options") as string[]) ?? [];
    const remaining = current.filter((_, i) => i !== index);
    remaining.forEach((val, i) => setValue(`options.${i}` as any, val));
    const correct = Number(watch("correctOption"));
    if (correct === index) setValue("correctOption", 0);
    else if (correct > index) setValue("correctOption", correct - 1);
    setOptCount((n) => n - 1);
  }

  function onAdd(data: any) {
    const options: string[] = Array.from({ length: optCount }, (_, i) => data.options?.[i] ?? "");
    if (options.some((o: string) => !o.trim())) { toast.error("Fill all options."); return; }
    addQ(
      { text: data.text, degree: Number(data.degree), options, correctOption: Number(data.correctOption) },
      { onSuccess: () => { toast.success("Question added."); reset(); setOptCount(2); }, onError: (e: any) => toast.error(e?.message ?? "Failed.") },
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Questions ({questions.length}) · Total: {totalMark} pts</h3>
      {locked && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          Quiz is published — questions are locked.
        </p>
      )}
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium">{i + 1}. {q.text} <span className="text-xs text-muted-foreground">({q.degree} pts)</span></p>
            {!locked && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => delQ(q.id, { onSuccess: () => toast.success("Deleted."), onError: (e: any) => toast.error(e?.message ?? "Failed.") })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {q.options.map((opt) => (
              <div key={opt.id} className={`rounded px-2 py-1 text-xs ${opt.index === q.correctOption ? "bg-green-100 text-green-800 dark:bg-green-900/30 font-medium" : "text-muted-foreground"}`}>
                {String.fromCharCode(65 + opt.index)}. {opt.text} {opt.index === q.correctOption && "✓"}
              </div>
            ))}
          </div>
        </div>
      ))}
      {!locked && (
        <form onSubmit={handleSubmit(onAdd)} className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-semibold">Add Question</p>
          <div><Label className="text-xs">Text</Label><Input {...register("text", { required: true })} /></div>
          <div className="flex gap-3">
            <div className="flex-1"><Label className="text-xs">Degree</Label><Input type="number" min={1} {...register("degree")} /></div>
            <div className="flex-1">
              <Label className="text-xs">Correct option</Label>
              <select {...register("correctOption")} className="w-full rounded-md border px-3 py-2 text-sm bg-background">
                {Array.from({ length: optCount }, (_, i) => (
                  <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            {Array.from({ length: optCount }, (_, i) => (
              <div key={i} className="flex gap-2">
                <Input {...register(`options.${i}` as any)} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                {i >= 2 && (
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeOpt(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {optCount < 6 && <Button type="button" variant="outline" size="sm" onClick={() => setOptCount((n) => n + 1)}><Plus className="h-3.5 w-3.5 mr-1" />Add Option</Button>}
          </div>
          <Button type="submit" disabled={adding} className="w-full">{adding ? "Adding…" : "Add Question"}</Button>
        </form>
      )}
    </div>
  );
}

function SubmissionsPanel({ assessmentId, totalMark, type }: { assessmentId: string; totalMark: number; type: string }) {
  const { data: subsData } = useAssessmentSubmissionsQuery(assessmentId);
  const { mutate: grade } = useGradeSubmissionMutation(assessmentId);
  const [marks, setMarks] = useState<Record<string, string>>({});

  const submissions = subsData?.data && "submissions" in subsData.data ? subsData.data.submissions as any[] : [];

  if (type === "quiz") {
    const quizSubs = submissions as QuizSubmission[];
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Submissions ({quizSubs.length})</h3>
        <Table>
          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Mark</TableHead><TableHead>Submitted</TableHead></TableRow></TableHeader>
          <TableBody>
            {quizSubs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">None yet.</TableCell></TableRow>}
            {quizSubs.map((s) => (
              <TableRow key={s.id}>
                <TableCell><p className="font-medium">{s.student?.name}</p><p className="text-xs text-muted-foreground">{s.student?.email}</p></TableCell>
                <TableCell>{s.mark} / {totalMark}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(s.submittedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const asgSubs = submissions as AssignmentSubmission[];
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Submissions ({asgSubs.length})</h3>
      {asgSubs.map((s) => (
        <div key={s.id} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-sm font-medium">{s.student?.name}</p><p className="text-xs text-muted-foreground">{s.student?.email}</p></div>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={totalMark} value={marks[s.id] ?? s.mark ?? ""} onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))} className="w-20 h-8 text-sm" placeholder="Mark" />
              <span className="text-sm">/ {totalMark}</span>
              <Button size="sm" onClick={() => { const m = parseInt(marks[s.id] ?? ""); if (isNaN(m)) { toast.error("Enter mark"); return; } grade({ submissionId: s.id, mark: m }, { onSuccess: () => toast.success("Graded."), onError: (e: any) => toast.error(e?.message ?? "Failed.") }); }}>Save</Button>
            </div>
          </div>
          <div className="space-y-1">
            {s.files.map((f: any) => <a key={f.id} href={f.file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">{f.file.name}</a>)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminAssessmentDetailView({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const { data, isPending } = useAssessmentDetailQuery(assessmentId);
  const { mutate: update, isPending: updating } = useUpdateAssessmentMutation(assessmentId);
  const { mutate: del } = useDeleteAssessmentMutation();
  const [delOpen, setDelOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "questions" | "submissions">("overview");

  const assessment = data?.data?.assessment;
  if (isPending) return <p className="py-8 text-sm text-muted-foreground">Loading…</p>;
  if (!assessment) return <p className="py-8 text-sm text-destructive">Not found.</p>;

  const totalMark = assessment.totalMark ?? 0;

  function toggle(field: "isVisible" | "markReadable") {
    update(
      { [field]: !assessment![field] },
      {
        onSuccess: () => toast.success("Updated."),
        onError: (e: any) => toast.error(e?.message ?? "Failed."),
      },
    );
  }

  async function handleDelete() {
    del(assessmentId, {
      onSuccess: () => { toast.success("Deleted."); router.push("/assessments"); },
      onError: (e: any) => { toast.error(e?.message ?? "Failed."); throw e; },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={assessment.title}
        breadcrumbs={[{ label: "Control Panel", href: "/" }, { label: "Assessments", href: "/assessments" }, { label: assessment.title }]}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => toggle("isVisible")} disabled={updating}>
          {assessment.isVisible ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Hide</> : <><Eye className="h-3.5 w-3.5 mr-1" />Publish</>}
        </Button>
        <Button variant="outline" size="sm" onClick={() => toggle("markReadable")} disabled={updating}>
          {assessment.markReadable ? "Hide Marks" : "Release Marks"}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setDelOpen(true)} className="ml-auto">
          Delete
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="capitalize">{assessment.type}</Badge>
          <Badge variant={assessment.isVisible ? "default" : "secondary"}>{assessment.isVisible ? "Visible" : "Hidden"}</Badge>
          {assessment.markReadable && <Badge variant="outline">Marks visible</Badge>}
        </div>
        <p><span className="font-medium">Subject:</span> {assessment.subject.code} — {assessment.subject.name}</p>
        <p><span className="font-medium">Creator:</span> {assessment.creator.name}</p>
        <p><span className="font-medium">Start:</span> {fmt(assessment.startDate)}</p>
        <p><span className="font-medium">End:</span> {fmt(assessment.endDate)}</p>
        {totalMark > 0 && <p><span className="font-medium">Total mark:</span> {totalMark} pts</p>}
      </div>

      <div className="flex gap-1 border-b">
        {(["overview", assessment.type === "quiz" ? "questions" : null, "submissions"].filter(Boolean) as string[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Use the buttons above to publish/hide and release marks.</p>
          <p>Published at: {assessment.publishedAt ? fmt(assessment.publishedAt) : "Not published yet"}</p>
        </div>
      )}
      {tab === "questions" && assessment.type === "quiz" && (
        <QuizQuestionsPanel assessmentId={assessmentId} locked={false} />
      )}
      {tab === "submissions" && (
        <SubmissionsPanel assessmentId={assessmentId} totalMark={totalMark} type={assessment.type} />
      )}

      <ConfirmDialog
        open={delOpen}
        title="Delete Assessment"
        message={`Delete "${assessment.title}"? This cannot be undone.`}
        onClose={() => setDelOpen(false)}
        onSubmit={handleDelete}
      />
    </div>
  );
}
