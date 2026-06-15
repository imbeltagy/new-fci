import Link from "next/link";
import { CalendarDays, ClipboardList, FileText } from "lucide-react";

import { Badge } from "@repo/common/components/ui/badge";
import type { Assessment } from "@repo/common/types/assessment";

function getStatus(a: Assessment): { label: string; variant: "default" | "secondary" | "outline" } {
  const now = Date.now();
  const start = new Date(a.startDate).getTime();
  const end = new Date(a.endDate).getTime();
  if (now < start) return { label: "Upcoming", variant: "secondary" };
  if (now <= end) return { label: "Open", variant: "default" };
  return { label: "Ended", variant: "outline" };
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AssessmentCard({ assessment }: { assessment: Assessment }) {
  const status = getStatus(assessment);
  const Icon = assessment.type === "quiz" ? ClipboardList : FileText;

  return (
    <Link
      href={`/assessments/${assessment.id}`}
      className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug line-clamp-2">{assessment.title}</p>
          <div className="flex shrink-0 flex-wrap gap-1 justify-end">
            <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
            {assessment.hasSubmitted && (
              <Badge className="text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                Submitted
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {assessment.subject.code} · {assessment.subject.name}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          <span>{fmt(assessment.startDate)} – {fmt(assessment.endDate)}</span>
        </div>
        {assessment.totalMark !== null && (
          <p className="text-xs text-muted-foreground">Total: {assessment.totalMark} pts</p>
        )}
      </div>
    </Link>
  );
}
