"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteMajor } from "@repo/common/actions/majors.action";
import { ConfirmDialog } from "@repo/common/components/custom/confirm-dialog";
import { Button } from "@repo/common/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/common/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/common/components/ui/table";
import { MAJOR_KEYS, useListMajorsQuery } from "@repo/common/queries/majors.query";
import type { Major } from "@repo/common/types/major";
import { PageHeader } from "@/components/control-panel/page-header";
import { MajorForm } from "../major-form";
import { MajorStaffPanel } from "../major-staff-panel";

function MajorFormDialog({
  major,
  createMode,
  onClose,
  onSaved,
}: {
  major: Major | null;
  createMode: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={createMode || !!major} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{major ? "Edit Major" : "Create Major"}</DialogTitle>
        </DialogHeader>
        <MajorForm
          major={major}
          onSuccess={() => { onSaved(); onClose(); }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function MajorStaffDialog({ major, onClose }: { major: Major | null; onClose: () => void }) {
  return (
    <Dialog open={!!major} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Staff — {major?.name} ({major?.code})</DialogTitle>
        </DialogHeader>
        {major && <MajorStaffPanel major={major} />}
      </DialogContent>
    </Dialog>
  );
}

export function MajorsListView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Major | null>(null);
  const [staffTarget, setStaffTarget] = useState<Major | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Major | null>(null);

  const { data, isPending, isError } = useListMajorsQuery();
  const majors: Major[] = data?.data?.majors ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: MAJOR_KEYS.all });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteMajor(deleteTarget.id);
    if (!res.success) {
      toast.error(res.message);
      throw new Error(res.message);
    }
    toast.success("Major deleted.");
    invalidate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Majors"
        breadcrumbs={[
          { label: "Control Panel", href: "/" },
          { label: "Majors" },
        ]}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{majors.length} major(s)</p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Major
        </Button>
      </div>

      {isPending && <p className="text-muted-foreground text-sm">Loading...</p>}
      {isError && <p className="text-destructive text-sm">Failed to load majors.</p>}

      {!isPending && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {majors.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No majors yet.
                </TableCell>
              </TableRow>
            )}
            {majors.map((major) => (
              <TableRow key={major.id}>
                <TableCell className="font-medium">{major.name}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{major.code}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setStaffTarget(major)}>
                      <Users className="h-3.5 w-3.5 mr-1" />Staff
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditTarget(major)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(major)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <MajorFormDialog
        major={editTarget}
        createMode={createOpen}
        onClose={() => { setCreateOpen(false); setEditTarget(null); }}
        onSaved={invalidate}
      />
      <MajorStaffDialog major={staffTarget} onClose={() => setStaffTarget(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Major"
        message={`Delete major "${deleteTarget?.name ?? ""}"? This will remove all subjects in this major.`}
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleDelete}
      />
    </div>
  );
}
