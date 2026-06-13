export type Semester = "first" | "second" | "summer";

export interface Subject {
  id: string;
  code: string;
  name: string;
  semester: Semester;
  joinYearId: string;
  joinYear: { id: string; year: number };
  majorId: string;
  major: { id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectBody {
  code: string;
  name: string;
  semester: Semester;
  joinYearId: string;
  majorId: string;
}

export interface UpdateSubjectBody {
  code?: string;
  name?: string;
  semester?: Semester;
}

export interface SubjectStaffMember {
  id: string;
  userId: string;
  user: { id: string; name: string; role: string };
  createdAt: string;
}

export interface SubjectEnrollment {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  createdAt: string;
}

export interface ListSubjectsFilter {
  joinYearId?: string;
  majorId?: string;
}

export interface StudentSubjectEntry {
  id: string;
  subjectId: string;
  subject: {
    id: string;
    code: string;
    name: string;
    semester: Semester;
    joinYear: { id: string; year: number };
    major: { id: string; name: string; code: string };
    staffAssignments: { user: { id: string; name: string; role: string } }[];
  };
}

export interface StaffSubjectEntry {
  id: string;
  subjectId: string;
  subject: {
    id: string;
    code: string;
    name: string;
    semester: Semester;
    joinYear: { id: string; year: number };
    major: { id: string; name: string; code: string };
  };
}

export interface StaffMajorEntry {
  id: string;
  majorId: string;
  joinYearId: string;
  major: { id: string; name: string; code: string };
  joinYear: { id: string; year: number };
}

export interface SubjectDetailStaff {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

export interface SubjectDetailStudent {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface SubjectDetail {
  subject: {
    id: string;
    code: string;
    name: string;
    semester: Semester;
    major: { id: string; name: string; code: string };
    joinYear: { id: string; year: number };
  };
  channelId: string | null;
  staff: SubjectDetailStaff[];
  students: SubjectDetailStudent[];
}
