"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { assignSubjectStaff, removeSubjectStaff } from "@repo/common/actions/subjects.action";
import { listUsers } from "@repo/common/actions/users.action";
import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { Separator } from "@repo/common/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/common/components/ui/table";
import { SUBJECT_KEYS, useSubjectStaffQuery } from "@repo/common/queries/subjects.query";
import type { Subject } from "@repo/common/types/subject";
import type { User } from "@repo/common/types/user";

interface SubjectStaffPanelProps {
  subject: Subject;
}

export function SubjectStaffPanel({ subject }: SubjectStaffPanelProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: staffData, isLoading } = useSubjectStaffQuery(subject.id);
  const staff = staffData?.data?.staff ?? [];

  async function handleSearch(value: string) {
    setSearch(value);
    if (!value.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const [r1, r2] = await Promise.all([
      listUsers({ search: value, role: "teacher" }),
      listUsers({ search: value, role: "sub_teacher" }),
    ]);
    setSearchResults([...(r1.data?.users ?? []), ...(r2.data?.users ?? [])]);
    setSearching(false);
  }

  async function handleAssign(userId: string) {
    const res = await assignSubjectStaff(subject.id, userId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Staff assigned.");
    queryClient.invalidateQueries({ queryKey: SUBJECT_KEYS.staff(subject.id) });
    setSearch("");
    setSearchResults([]);
  }

  async function handleRemove(userId: string) {
    const res = await removeSubjectStaff(subject.id, userId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Staff removed.");
    queryClient.invalidateQueries({ queryKey: SUBJECT_KEYS.staff(subject.id) });
  }

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">
                  No staff assigned.
                </TableCell>
              </TableRow>
            )}
            {staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.user.name}</TableCell>
                <TableCell className="capitalize">{s.user.role.replace("_", " ")}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemove(s.userId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-medium">Add Staff</p>
        <Input
          placeholder="Search teacher by name..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searching && <p className="text-sm text-muted-foreground">Searching...</p>}
        {searchResults.length > 0 && (
          <Table>
            <TableBody>
              {searchResults.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell className="capitalize">{u.role.replace("_", " ")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleAssign(u.id)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Assign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
