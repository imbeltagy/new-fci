export interface JoinYear {
  id: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJoinYearBody {
  year: number;
}

export interface UpdateJoinYearBody {
  year?: number;
}
