"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Users, UserCog } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteSubject } from "@repo/common/actions/subjects.action";
import { ConfirmDialog } from "@repo/common/components/custom/confirm-dialog";
import { Button } from "@repo/common/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/common/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/common/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/common/components/ui/table";
import { useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import { useListMajorsQuery } from "@repo/common/queries/majors.query";
import { SUBJECT_KEYS, useListSubjectsQuery } from "@repo/common/queries/subjects.query";
import type { Subject } from "@repo/common/types/subject";
import { PageHeader } from "@/components/control-panel/page-header";
import { SubjectEnrollmentsPanel } from "../subject-enrollments-panel";
import { SubjectForm } from "../subject-form";
import { SubjectStaffPanel } from "../subject-staff-panel";

const SEMESTER_LABEL: Record<string, string> = {
  first: "First",
  second: "Second",
  summer: "Summer",
};

function SubjectFormDialog({
  subject,
  createMode,
  onClose,
  onSaved,
}: {
  subject: Subject | null;
  createMode: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={createMode || !!subject} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subject ? "Edit Subject" : "Create Subject"}</DialogTitle>
        </DialogHeader>
        <SubjectForm
          subject={subject}
          onSuccess={() => { onSaved(); onClose(); }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function SubjectStaffDialog({ subject, onClose }: { subject: Subject | null; onClose: () => void }) {
  return (
    <Dialog open={!!subject} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Staff — {subject?.name}</DialogTitle>
        </DialogHeader>
        {subject && <SubjectStaffPanel subject={subject} />}
      </DialogContent>
    </Dialog>
  );
}

function SubjectEnrollmentsDialog({ subject, onClose }: { subject: Subject | null; onClose: () => void }) {
  return (
    <Dialog open={!!subject} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enrollments — {subject?.name}</DialogTitle>
        </DialogHeader>
        {subject && <SubjectEnrollmentsPanel subject={subject} />}
      </DialogContent>
    </Dialog>
  );
}

export function SubjectsListView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [staffTarget, setStaffTarget] = useState<Subject | null>(null);
  const [enrollTarget, setEnrollTarget] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [filterJoinYearId, setFilterJoinYearId] = useState("all");
  const [filterMajorId, setFilterMajorId] = useState("all");

  const { data: joinYearsData } = useListJoinYearsQuery();
  const { data: majorsData } = useListMajorsQuery();
  const joinYears = joinYearsData?.data?.joinYears ?? [];
  const majors = majorsData?.data?.majors ?? [];

  const { data, isPending, isError } = useListSubjectsQuery({
    joinYearId: filterJoinYearId !== "all" ? filterJoinYearId : undefined,
    majorId: filterMajorId !== "all" ? filterMajorId : undefined,
  });
  const subjects: Subject[] = data?.data?.subjects ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: SUBJECT_KEYS.all });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteSubject(deleteTarget.id);
    if (!res.success) {
      toast.error(res.message);
      throw new Error(res.message);
    }
    toast.success("Subject deleted.");
    invalidate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        breadcrumbs={[
          { label: "Control Panel", href: "/" },
          { label: "Subjects" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterJoinYearId} onValueChange={setFilterJoinYearId}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {joinYears.map((jy) => (
              <SelectItem key={jy.id} value={jy.id}>{jy.year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterMajorId} onValueChange={setFilterMajorId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All majors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All majors</SelectItem>
            {majors.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {isPending && <p className="text-muted-foreground text-sm">Loading...</p>}
      {isError && <p className="text-destructive text-sm">Failed to load subjects.</p>}

      {!isPending && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Major</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No subjects found.
                </TableCell>
              </TableRow>
            )}
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{subject.code}</span>
                </TableCell>
                <TableCell className="font-medium">{subject.name}</TableCell>
                <TableCell>{SEMESTER_LABEL[subject.semester] ?? subject.semester}</TableCell>
                <TableCell>{subject.major.code}</TableCell>
                <TableCell>{subject.joinYear.year}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setStaffTarget(subject)}>
                      <UserCog className="h-3.5 w-3.5 mr-1" />Staff
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEnrollTarget(subject)}>
                      <Users className="h-3.5 w-3.5 mr-1" />Students
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditTarget(subject)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(subject)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SubjectFormDialog
        subject={editTarget}
        createMode={createOpen}
        onClose={() => { setCreateOpen(false); setEditTarget(null); }}
        onSaved={invalidate}
      />
      <SubjectStaffDialog subject={staffTarget} onClose={() => setStaffTarget(null)} />
      <SubjectEnrollmentsDialog subject={enrollTarget} onClose={() => setEnrollTarget(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Subject"
        message={`Delete subject "${deleteTarget?.name ?? ""}"? All enrollments will be removed.`}
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleDelete}
      />
    </div>
  );
}
