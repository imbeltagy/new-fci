"use client";

import { useEffect, useState } from "react";
import { Plus, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { sendCredentials } from "@repo/common/actions/users.action";
import { Button } from "@repo/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/common/components/ui/dialog";
import { Input } from "@repo/common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/common/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/common/components/ui/table";
import { USER_KEYS, useListUsersQuery } from "@repo/common/queries/users.query";
import type { User, UserRole } from "@repo/common/types/user";
import { PageHeader } from "@/components/control-panel/page-header";
import { CreateUserForm } from "../create-user-form";
import { EditUserForm } from "../edit-user-form";

const ROLE_OPTIONS: { label: string; value: UserRole | "all" }[] = [
  { label: "All Roles", value: "all" },
  { label: "Student", value: "student" },
  { label: "Teacher", value: "teacher" },
  { label: "Sub Teacher", value: "sub_teacher" },
  { label: "IT", value: "it" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Create User Dialog ────────────────────────────────────────────────────────

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserDialog({ open, onClose, onCreated }: CreateUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        <CreateUserForm
          onSuccess={() => { onCreated(); onClose(); }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

// ── Edit User Dialog ──────────────────────────────────────────────────────────

interface EditUserDialogProps {
  user: User | null;
  onClose: () => void;
  onUpdated: () => void;
}

function EditUserDialog({ user, onClose, onUpdated }: EditUserDialogProps) {
  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        {user && (
          <EditUserForm
            user={user}
            onSuccess={() => { onUpdated(); onClose(); }}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────

export function UsersListView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isPending, isError } = useListUsersQuery({
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(roleFilter !== "all" && { role: roleFilter }),
  });

  const users = data?.data?.users ?? [];

  async function handleSendCredentials(userId: string) {
    const res = await sendCredentials([userId]);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success("Credentials sent.");
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        breadcrumbs={[
          { label: "Control Panel", href: "/" },
          { label: "Users" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as UserRole | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {isPending && <p className="text-muted-foreground text-sm">Loading...</p>}
      {isError && (
        <p className="text-destructive text-sm">Failed to load users.</p>
      )}

      {!isPending && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {users.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">
                  {user.role.replace("_", " ")}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      user.isActive
                        ? "text-green-600 text-xs font-medium"
                        : "text-red-500 text-xs font-medium"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditUser(user)}
                    >
                      Edit
                    </Button>
                    {user.mustChangePassword && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendCredentials(user.id)}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Send Credentials
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={invalidate}
      />
      <EditUserDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onUpdated={invalidate}
      />
    </div>
  );
}
