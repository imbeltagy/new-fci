"use client";

import { Plus, Trash2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bulkEnrollSubject, enrollStudent, unenrollStudent } from "@repo/common/actions/subjects.action";
import { Button } from "@repo/common/components/ui/button";
import { Separator } from "@repo/common/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/common/components/ui/table";
import { SUBJECT_KEYS, useSubjectEnrollmentsQuery } from "@repo/common/queries/subjects.query";
import { useListUsersQuery } from "@repo/common/queries/users.query";
import type { Subject } from "@repo/common/types/subject";

interface SubjectEnrollmentsPanelProps {
  subject: Subject;
}

export function SubjectEnrollmentsPanel({ subject }: SubjectEnrollmentsPanelProps) {
  const queryClient = useQueryClient();

  const { data: enrollmentsData, isLoading } = useSubjectEnrollmentsQuery(subject.id);
  const enrollments = enrollmentsData?.data?.enrollments ?? [];

  const enrolledIds = new Set(enrollments.map((e) => e.userId));

  const { data: studentsData } = useListUsersQuery({
    role: "student",
  });
  const eligibleStudents = (studentsData?.data?.users ?? []).filter(
    (u) =>
      u.joinYearId === subject.joinYearId &&
      u.majorId === subject.majorId &&
      !enrolledIds.has(u.id),
  );

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: SUBJECT_KEYS.enrollments(subject.id) });
  }

  async function handleBulkEnroll() {
    const res = await bulkEnrollSubject(subject.id);
    if (!res.success) { toast.error(res.message); return; }
    toast.success(`Enrolled ${res.data?.count ?? 0} student(s).`);
    invalidate();
  }

  async function handleEnroll(userId: string) {
    const res = await enrollStudent(subject.id, userId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Student enrolled.");
    invalidate();
  }

  async function handleUnenroll(userId: string) {
    const res = await unenrollStudent(subject.id, userId);
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Student unenrolled.");
    invalidate();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{enrollments.length} enrolled student(s)</p>
        <Button variant="outline" size="sm" onClick={handleBulkEnroll}>
          <Users className="h-3.5 w-3.5 mr-1" />
          Bulk Enroll {subject.major.code} {subject.joinYear.year}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">
                  No students enrolled.
                </TableCell>
              </TableRow>
            )}
            {enrollments.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.user.name}</TableCell>
                <TableCell>{e.user.email}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleUnenroll(e.userId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {eligibleStudents.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Enroll Individual Student</p>
            <Table>
              <TableBody>
                {eligibleStudents.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEnroll(u.id)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />Enroll
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
