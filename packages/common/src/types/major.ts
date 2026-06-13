export interface Major {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMajorBody {
  name: string;
  code: string;
}

export interface UpdateMajorBody {
  name?: string;
  code?: string;
}

export interface MajorStaffMember {
  id: string;
  userId: string;
  user: { id: string; name: string; role: string };
  joinYearId: string;
  joinYear: { id: string; year: number };
  createdAt: string;
}

export interface MajorDetailPerson {
  id: string;
  name: string;
  role?: string;
  email?: string;
  avatarUrl: string | null;
}

export interface MajorDetail {
  major: Major;
  joinYear: { id: string; year: number };
  channelId: string | null;
  subjects: { id: string; code: string; name: string; semester: string }[];
  teachers: MajorDetailPerson[];
  students: MajorDetailPerson[];
}
