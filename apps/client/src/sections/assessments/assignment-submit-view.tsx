"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip, Upload } from "lucide-react";

import { Button } from "@repo/common/components/ui/button";
import {
  useAssessmentDetailQuery,
  useAssessmentSubmissionsQuery,
  useSubmitAssignmentMutation,
} from "@repo/common/queries/assessments.query";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssignmentSubmitView({ assessmentId }: { assessmentId: string }) {
  const { data: detailData, isPending: detailPending } = useAssessmentDetailQuery(assessmentId);
  const { data: subsData, isPending: subsPending } = useAssessmentSubmissionsQuery(assessmentId);
  const { mutate: submit, isPending: submitting } = useSubmitAssignmentMutation(assessmentId);

  const assessment = detailData?.data?.assessment;
  const subsResult = subsData?.data;
  const existing =
    subsResult && subsResult.type === "assignment" && "submission" in subsResult
      ? (subsResult as { type: "assignment"; submission: import("@repo/common/types/assessment").AssignmentSubmission | null }).submission
      : null;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (detailPending || subsPending) {
    return <p className="py-4 text-sm text-muted-foreground">Loading...</p>;
  }
  if (!assessment) {
    return <p className="py-4 text-sm text-destructive">Assessment not found.</p>;
  }

  const now = new Date();
  const started = now >= new Date(assessment.startDate);
  const ended = now > new Date(assessment.endDate);

  if (!started) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        This assignment opens on {new Date(assessment.startDate).toLocaleString()}.
      </p>
    );
  }

  if (existing) {
    return (
      <div className="space-y-4 py-4">
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Submission received</p>
            <p className="text-xs text-muted-foreground">
              {new Date(existing.submittedAt).toLocaleString()}
            </p>
          </div>
          {assessment.markReadable && existing.mark !== null ? (
            <p className="text-xl font-bold">{existing.mark} / {assessment.totalMark} pts</p>
          ) : (
            <p className="text-xs text-muted-foreground">Marks not yet released.</p>
          )}
          <div className="space-y-1">
            {existing.files.map((f) => (
              <a
                key={f.id}
                href={f.file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {f.file.name}
                <span className="text-xs text-muted-foreground">({formatSize(f.file.size)})</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function handleUpload() {
    if (!selectedFiles.length) { toast.error("Please select at least one file."); return; }
    submit(selectedFiles, {
      onSuccess: () => { toast.success("Submitted successfully."); setSelectedFiles([]); },
      onError: (e: any) => toast.error(e?.message ?? "Failed to submit."),
    });
  }

  if (ended) {
    return <p className="py-4 text-sm text-muted-foreground">The deadline has passed. No submission was made.</p>;
  }

  return (
    <div className="space-y-3 py-4">
      <p className="text-sm font-medium">Upload your solution</p>
      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Click to select files</p>
        {selectedFiles.length > 0 && (
          <p className="mt-1 text-xs text-primary">{selectedFiles.length} file(s) selected</p>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
      />
      {selectedFiles.length > 0 && (
        <div className="space-y-1">
          {selectedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{f.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">({formatSize(f.size)})</span>
            </div>
          ))}
        </div>
      )}
      <Button className="w-full" onClick={handleUpload} disabled={submitting || !selectedFiles.length}>
        {submitting ? "Uploading…" : "Submit Assignment"}
      </Button>
    </div>
  );
}
