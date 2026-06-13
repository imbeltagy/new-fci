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
