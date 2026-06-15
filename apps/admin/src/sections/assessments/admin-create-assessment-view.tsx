"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock } from "lucide-react";

import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { Label } from "@repo/common/components/ui/label";
import { useCreateAssessmentMutation } from "@repo/common/queries/assessments.query";
import { useListSubjectsQuery } from "@repo/common/queries/subjects.query";
import type { AssessmentType } from "@repo/common/types/assessment";
import { PageHeader } from "@/components/control-panel/page-header";

function openTimePicker(id: string) {
  const el = document.getElementById(id) as HTMLInputElement | null;
  try { el?.showPicker(); } catch { el?.focus(); }
}

export function AdminCreateAssessmentView() {
  const router = useRouter();
  const startTimeId = useId();
  const endTimeId = useId();

  const { data: subjectsData } = useListSubjectsQuery({});
  const subjects = subjectsData?.data?.subjects ?? [];

  const [type, setType] = useState<AssessmentType>("quiz");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalMark, setTotalMark] = useState("");

  const { mutate, isPending } = useCreateAssessmentMutation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId) { toast.error("Select a subject."); return; }
    if (!title.trim()) { toast.error("Enter a title."); return; }
    if (!startDate || !startTime || !endDate || !endTime) { toast.error("Set start and end date/time."); return; }
    if (type === "assignment" && !totalMark) { toast.error("Enter total mark for assignment."); return; }

    mutate(
      {
        type,
        subjectId,
        title: title.trim(),
        startDate: new Date(`${startDate}T${startTime}`).toISOString(),
        endDate: new Date(`${endDate}T${endTime}`).toISOString(),
        ...(type === "assignment" && { totalMark: parseInt(totalMark) }),
      },
      {
        onSuccess: (res) => {
          toast.success("Assessment created.");
          router.push(`/assessments/${res.data?.assessment.id}`);
        },
        onError: (e: any) => toast.error(e?.message ?? "Failed to create."),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Assessment"
        breadcrumbs={[{ label: "Control Panel", href: "/" }, { label: "Assessments", href: "/assessments" }, { label: "New" }]}
      />

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <Label>Type</Label>
          <div className="flex gap-2 mt-1">
            {(["quiz", "assignment"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-colors ${
                  type === t ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Subject</Label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
          >
            <option value="">Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Title</Label>
          <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Assessment title" />
        </div>

        <div>
          <Label>Start date &amp; time</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <div className="relative">
              <Input id={startTimeId} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="pr-9" />
              <button type="button" onClick={() => openTimePicker(startTimeId)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Clock className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <Label>End date &amp; time</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            <div className="relative">
              <Input id={endTimeId} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="pr-9" />
              <button type="button" onClick={() => openTimePicker(endTimeId)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Clock className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {type === "assignment" && (
          <div>
            <Label>Total mark</Label>
            <Input className="mt-1" type="number" min={1} value={totalMark} onChange={(e) => setTotalMark(e.target.value)} required />
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Assessment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
