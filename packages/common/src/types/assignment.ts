export interface StaffAssignments {
  joinYears: {
    id: string;
    userId: string;
    joinYearId: string;
    joinYear: { id: string; year: number };
    createdAt: string;
  }[];
  majors: {
    id: string;
    userId: string;
    majorId: string;
    joinYearId: string;
    major: { id: string; name: string; code: string };
    joinYear: { id: string; year: number };
    createdAt: string;
  }[];
  subjects: {
    id: string;
    userId: string;
    subjectId: string;
    subject: {
      id: string;
      name: string;
      code: string;
      semester: string;
      joinYear: { id: string; year: number };
      major: { id: string; name: string; code: string };
    };
    createdAt: string;
  }[];
}

export interface AssignMajorBody {
  majorId: string;
  joinYearId: string;
}
