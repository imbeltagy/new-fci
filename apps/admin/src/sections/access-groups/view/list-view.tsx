"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteGroup } from "@repo/common/actions/access-groups.action";
import { listUsers, updateUser } from "@repo/common/actions/users.action";
import { ConfirmDialog } from "@repo/common/components/custom/confirm-dialog";
import { Button } from "@repo/common/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/common/components/ui/dialog";
import { Input } from "@repo/common/components/ui/input";
import { Separator } from "@repo/common/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/common/components/ui/table";
import { ACCESS_GROUP_KEYS, useListGroupsQuery } from "@repo/common/queries/access-groups.query";
import { USER_KEYS, useListUsersQuery } from "@repo/common/queries/users.query";
import type { ListUsersFilter } from "@repo/common/types/user";
import type { AccessGroup } from "@repo/common/types/access-group";
import { PageHeader } from "@/components/control-panel/page-header";
import { GroupForm } from "../group-form";

// ── Group Form Dialog ─────────────────────────────────────────────────────────

interface GroupFormDialogProps {
  group: AccessGroup | null;
  createMode: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function GroupFormDialog({ group, createMode, onClose, onSaved }: GroupFormDialogProps) {
  const open = createMode || !!group;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group ? "Edit Access Group" : "Create Access Group"}</DialogTitle>
        </DialogHeader>
        <GroupForm
          group={group}
          onSuccess={() => { onSaved(); onClose(); }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

// ── Assign Users Dialog ───────────────────────────────────────────────────────

interface AssignUsersDialogProps {
  group: AccessGroup | null;
  onClose: () => void;
}

function AssignUsersDialog({ group, onClose }: AssignUsersDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const assignedFilter: ListUsersFilter | undefined = group
    ? { accessGroupId: group.id, role: "it" }
    : undefined;
  const searchFilter: ListUsersFilter = {
    role: "it",
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const { data: assignedData, isLoading: loadingAssigned } = useListUsersQuery(assignedFilter);

  const { data: searchData, isLoading: loadingSearch } = useQuery({
    queryKey: USER_KEYS.list(searchFilter),
    queryFn: () => listUsers(searchFilter),
    enabled: !!group,
  });

  const assignedUsers = assignedData?.data?.users ?? [];
  const searchResults = (searchData?.data?.users ?? []).filter(
    (u) => u.accessGroupId !== group?.id
  );

  async function assign(userId: string) {
    if (!group) return;
    const res = await updateUser(userId, { accessGroupId: group.id });
    if (!res.success) { toast.error(res.message); return; }
    toast.success("User assigned.");
    queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
  }

  async function unassign(userId: string) {
    const res = await updateUser(userId, { accessGroupId: null });
    if (!res.success) { toast.error(res.message); return; }
    toast.success("User removed from group.");
    queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
  }

  return (
    <Dialog open={!!group} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Users — {group?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Assigned Users</p>
            {loadingAssigned && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!loadingAssigned && assignedUsers.length === 0 && (
              <p className="text-sm text-muted-foreground">No users assigned yet.</p>
            )}
            {assignedUsers.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => unassign(u.id)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Add Users</p>
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loadingSearch && <p className="text-sm text-muted-foreground">Searching...</p>}
            {!loadingSearch && debouncedSearch && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground">No users found.</p>
            )}
            {searchResults.length > 0 && (
              <Table>
                <TableBody>
                  {searchResults.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => assign(u.id)}>
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function AccessGroupsListView() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<AccessGroup | null>(null);
  const [assignGroup, setAssignGroup] = useState<AccessGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccessGroup | null>(null);

  const { data, isPending, isError } = useListGroupsQuery();
  const groups: AccessGroup[] = data?.data?.groups ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ACCESS_GROUP_KEYS.all });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteGroup(deleteTarget.id);
    if (!res.success) {
      toast.error(res.message);
      throw new Error(res.message);
    }
    toast.success("Access group deleted.");
    invalidate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Groups"
        breadcrumbs={[
          { label: "Control Panel", href: "/" },
          { label: "Access Groups" },
        ]}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{groups.length} group(s)</p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {isPending && <p className="text-muted-foreground text-sm">Loading...</p>}
      {isError && <p className="text-destructive text-sm">Failed to load groups.</p>}

      {!isPending && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No access groups yet.
                </TableCell>
              </TableRow>
            )}
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {group.description ?? "—"}
                </TableCell>
                <TableCell>{group.permissions.length} permissions</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssignGroup(group)}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Users
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditGroup(group)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(group)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <GroupFormDialog
        group={editGroup}
        createMode={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditGroup(null);
        }}
        onSaved={invalidate}
      />

      <AssignUsersDialog
        group={assignGroup}
        onClose={() => setAssignGroup(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Access Group"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"?`}
        onClose={() => setDeleteTarget(null)}
        onSubmit={handleDelete}
      />
    </div>
  );
}
