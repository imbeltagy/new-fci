"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteJoinYear } from "@repo/common/actions/join-years.action";
import { ConfirmDialog } from "@repo/common/components/custom/confirm-dialog";
import { Button } from "@repo/common/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/common/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/common/components/ui/table";
import { JOIN_YEAR_KEYS, useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import type { JoinYear } from "@repo/common/types/join-year";
import { PageHeader } from "@/components/control-panel/page-header";
import { JoinYearForm } from "../join-year-form";

function JoinYearDialog({
  joinYear,
  createMode,
  onClose,
  onSaved,
}: {
  joinYear: JoinYear | null;
  createMode: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={createMode || !!joinYear} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{joinYear ? "Edit Join Year" : "Create Join Year"}</DialogTitle>
        </DialogHeader>
        <JoinYearForm
          joinYear={joinYear}
          onSuccess={() => { onSaved(); onClose(); }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

export function JoinYearsListView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JoinYear | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JoinYear | null>(null);

  const { data, isPending, isError } = useListJoinYearsQuery();
  const joinYears: JoinYear[] = data?.data?.joinYears ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: JOIN_YEAR_KEYS.all });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteJoinYear(deleteTarget.id);
    if (!res.success) {
      toast.error(res.message);
      throw new Error(res.message);
    }
    toast.success("Join year deleted.");
    invalidate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Join Years"
        breadcrumbs={[
          { label: "Control Panel", href: "/" },
          { label: "Join Years" },
        ]}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{joinYears.length} join year(s)</p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Join Year
        </Button>
      </div>

      {isPending && <p className="text-muted-foreground text-sm">Loading...</p>}
      {isError && <p className="text-destructive text-sm">Failed to load join years.</p>}

      {!isPending && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {joinYears.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No join years yet.
                </TableCell>
              </TableRow>
            )}
            {joinYears.map((jy) => (
              <TableRow key={jy.id}>
                <TableCell className="font-medium">{jy.year}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(jy.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditTarget(jy)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(jy)}
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

      <JoinYearDialog
        joinYear={editTarget}
        createMode={createOpen}
        onClose={() => { setCreateOpen(false); setEditTarget(null); }}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Join Year"
        message={`Delete join year ${deleteTarget?.year ?? ""}? This will remove all subjects and enrollments tied to it.`}
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleDelete}
      />
    </div>
  );
}
