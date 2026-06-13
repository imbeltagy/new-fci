"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  assignJoinYear,
  assignMajor,
  assignSubject,
  removeMajor,
  removeJoinYear,
  removeSubject,
} from "@repo/common/actions/assignments.action";
import { Button } from "@repo/common/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/common/components/ui/select";
import { Separator } from "@repo/common/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/common/components/ui/table";
import { ASSIGNMENT_KEYS, useAssignmentsQuery } from "@repo/common/queries/assignments.query";
import { useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import { useListMajorsQuery } from "@repo/common/queries/majors.query";
import { useListSubjectsQuery } from "@repo/common/queries/subjects.query";

interface UserAssignmentsPanelProps {
  userId: string;
}

export function UserAssignmentsPanel({ userId }: UserAssignmentsPanelProps) {
  const queryClient = useQueryClient();
  const [addJoinYearId, setAddJoinYearId] = useState("");
  const [addMajorId, setAddMajorId] = useState("");
  const [addMajorJoinYearId, setAddMajorJoinYearId] = useState("");
  const [addSubjectId, setAddSubjectId] = useState("");

  const { data: assignmentsData, isLoading } = useAssignmentsQuery(userId);
  const assignments = assignmentsData?.data;

  const { data: joinYearsData } = useListJoinYearsQuery();
  const { data: majorsData } = useListMajorsQuery();
  const { data: subjectsData } = useListSubjectsQuery();

  const joinYears = joinYearsData?.data?.joinYears ?? [];
  const majors = majorsData?.data?.majors ?? [];
  const subjects = subjectsData?.data?.subjects ?? [];

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ASSIGNMENT_KEYS.forUser(userId) });
  }

  async function handleAddJoinYear() {
    if (!addJoinYearId) return;
    const res = await assignJoinYear(userId, addJoinYearId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Join year assigned.");
    setAddJoinYearId("");
    invalidate();
  }

  async function handleRemoveJoinYear(joinYearId: string) {
    const res = await removeJoinYear(userId, joinYearId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Join year removed.");
    invalidate();
  }

  async function handleAddMajor() {
    if (!addMajorId || !addMajorJoinYearId) { toast.error("Select both a major and join year."); return; }
    const res = await assignMajor(userId, { majorId: addMajorId, joinYearId: addMajorJoinYearId });
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Major assignment added.");
    setAddMajorId("");
    setAddMajorJoinYearId("");
    invalidate();
  }

  async function handleRemoveMajor(majorId: string, joinYearId: string) {
    const res = await removeMajor(userId, majorId, joinYearId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Major assignment removed.");
    invalidate();
  }

  async function handleAddSubject() {
    if (!addSubjectId) return;
    const res = await assignSubject(userId, addSubjectId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Subject assigned.");
    setAddSubjectId("");
    invalidate();
  }

  async function handleRemoveSubject(subjectId: string) {
    const res = await removeSubject(userId, subjectId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Subject assignment removed.");
    invalidate();
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading assignments...</p>;
  if (!assignments) return null;

  const assignedJoinYearIds = new Set(assignments.joinYears.map((a) => a.joinYearId));
  const assignedSubjectIds = new Set(assignments.subjects.map((a) => a.subjectId));

  return (
    <div className="space-y-6">

      {/* Join Years */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Community (Join Year)</p>
        {assignments.joinYears.length > 0 && (
          <Table>
            <TableBody>
              {assignments.joinYears.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.joinYear.year}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveJoinYear(a.joinYearId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex gap-2">
          <Select value={addJoinYearId} onValueChange={setAddJoinYearId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select join year" />
            </SelectTrigger>
            <SelectContent>
              {joinYears.filter((jy) => !assignedJoinYearIds.has(jy.id)).map((jy) => (
                <SelectItem key={jy.id} value={jy.id}>{jy.year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddJoinYear} disabled={!addJoinYearId}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Majors */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Major × Join Year</p>
        {assignments.majors.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Major</TableHead>
                <TableHead>Year</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.majors.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.major.name} ({a.major.code})</TableCell>
                  <TableCell>{a.joinYear.year}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMajor(a.majorId, a.joinYearId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex gap-2">
          <Select value={addMajorId} onValueChange={setAddMajorId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Major" />
            </SelectTrigger>
            <SelectContent>
              {majors.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={addMajorJoinYearId} onValueChange={setAddMajorJoinYearId}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {joinYears.map((jy) => (
                <SelectItem key={jy.id} value={jy.id}>{jy.year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddMajor}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Subjects */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Subjects</p>
        {assignments.subjects.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Major / Year</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.subjects.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{a.subject.code}</span>
                  </TableCell>
                  <TableCell>{a.subject.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {a.subject.major.code} / {a.subject.joinYear.year}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveSubject(a.subjectId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex gap-2">
          <Select value={addSubjectId} onValueChange={setAddSubjectId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.filter((s) => !assignedSubjectIds.has(s.id)).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code} — {s.name} ({s.major.code} {s.joinYear.year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddSubject} disabled={!addSubjectId}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
