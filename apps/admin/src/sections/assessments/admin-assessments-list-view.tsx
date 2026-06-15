"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FileText, Plus } from "lucide-react";

import { Badge } from "@repo/common/components/ui/badge";
import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/common/components/ui/table";
import { useListAssessmentsQuery } from "@repo/common/queries/assessments.query";
import type { Assessment, AssessmentType } from "@repo/common/types/assessment";
import { PageHeader } from "@/components/control-panel/page-header";

function statusBadge(a: Assessment) {
  const now = Date.now();
  const start = new Date(a.startDate).getTime();
  const end = new Date(a.endDate).getTime();
  if (!a.isVisible) return <Badge variant="secondary">Hidden</Badge>;
  if (now < start) return <Badge variant="outline">Upcoming</Badge>;
  if (now <= end) return <Badge>Open</Badge>;
  return <Badge variant="outline">Ended</Badge>;
}

export function AdminAssessmentsListView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssessmentType | "all">("all");
  const [showOld, setShowOld] = useState(false);

  const { data, isPending, isError } = useListAssessmentsQuery({
    type: typeFilter === "all" ? undefined : typeFilter,
    showOld,
  });
  const all = data?.data?.assessments ?? [];
  const items = search
    ? all.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.subject.code.toLowerCase().includes(search.toLowerCase()),
      )
    : all;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        breadcrumbs={[{ label: "Control Panel", href: "/" }, { label: "Assessments" }]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex rounded-md border overflow-hidden">
          {(["all", "assignment", "quiz"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                typeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowOld((v) => !v)}>
          {showOld ? "Hide Old" : "Show Old"}
        </Button>
        <Button className="ml-auto" onClick={() => router.push("/assessments/create")}>
          <Plus className="mr-2 h-4 w-4" /> New Assessment
        </Button>
      </div>

      {isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {isError && <p className="text-sm text-destructive">Failed to load assessments.</p>}

      {!isPending && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Mark</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No assessments found.
                </TableCell>
              </TableRow>
            )}
            {items.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium max-w-xs truncate">{a.title}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                    {a.type === "quiz" ? <ClipboardList className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    {a.type}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{a.subject.code}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(a.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(a.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm">{a.totalMark ?? "—"}</TableCell>
                <TableCell>{statusBadge(a)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/assessments/${a.id}`)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
