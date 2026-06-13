"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { assignMajorStaff, removeMajorStaff } from "@repo/common/actions/majors.action";
import { listUsers } from "@repo/common/actions/users.action";
import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { Label } from "@repo/common/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/common/components/ui/select";
import { Separator } from "@repo/common/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/common/components/ui/table";
import { MAJOR_KEYS, useMajorStaffQuery } from "@repo/common/queries/majors.query";
import { useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import type { Major } from "@repo/common/types/major";
import type { User } from "@repo/common/types/user";

interface MajorStaffPanelProps {
  major: Major;
}

export function MajorStaffPanel({ major }: MajorStaffPanelProps) {
  const queryClient = useQueryClient();
  const [selectedJoinYearId, setSelectedJoinYearId] = useState("all");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [addJoinYearId, setAddJoinYearId] = useState("");

  const { data: joinYearsData } = useListJoinYearsQuery();
  const joinYears = joinYearsData?.data?.joinYears ?? [];

  const { data: staffData, isLoading } = useMajorStaffQuery(major.id, selectedJoinYearId !== "all" ? selectedJoinYearId : undefined);
  const staff = staffData?.data?.staff ?? [];

  async function handleSearch(value: string) {
    setSearch(value);
    if (!value.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const res = await listUsers({ search: value, role: "teacher" });
    const res2 = await listUsers({ search: value, role: "sub_teacher" });
    const combined = [...(res.data?.users ?? []), ...(res2.data?.users ?? [])];
    setSearchResults(combined);
    setSearching(false);
  }

  async function handleAssign(userId: string) {
    if (!addJoinYearId) { toast.error("Select a join year first."); return; }
    const res = await assignMajorStaff(major.id, { userId, joinYearId: addJoinYearId });
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Staff assigned.");
    queryClient.invalidateQueries({ queryKey: MAJOR_KEYS.all });
    setSearch("");
    setSearchResults([]);
  }

  async function handleRemove(userId: string, joinYearId: string) {
    const res = await removeMajorStaff(major.id, userId, joinYearId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Staff removed.");
    queryClient.invalidateQueries({ queryKey: MAJOR_KEYS.all });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label className="shrink-0">Filter by join year</Label>
        <Select value={selectedJoinYearId} onValueChange={setSelectedJoinYearId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {joinYears.map((jy) => (
              <SelectItem key={jy.id} value={jy.id}>{jy.year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Join Year</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                  No staff assigned.
                </TableCell>
              </TableRow>
            )}
            {staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.user.name}</TableCell>
                <TableCell className="capitalize">{s.user.role.replace("_", " ")}</TableCell>
                <TableCell>{s.joinYear.year}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemove(s.userId, s.joinYearId)}
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

      <div className="space-y-3">
        <p className="text-sm font-medium">Add Staff</p>
        <div className="flex items-center gap-2">
          <Label className="shrink-0 text-sm">Join year</Label>
          <Select value={addJoinYearId} onValueChange={setAddJoinYearId}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {joinYears.map((jy) => (
                <SelectItem key={jy.id} value={jy.id}>{jy.year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
