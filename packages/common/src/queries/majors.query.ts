"use client";

import { useQuery } from "@tanstack/react-query";

import { getMajorStaff, listMajors } from "../actions/majors.action";

export const MAJOR_KEYS = {
  all: ["majors"] as const,
  list: () => ["majors", "list"] as const,
  staff: (majorId: string, joinYearId?: string) => ["majors", "staff", majorId, joinYearId] as const,
};

export function useListMajorsQuery() {
  return useQuery({
    queryKey: MAJOR_KEYS.list(),
    queryFn: listMajors,
  });
}

export function useMajorStaffQuery(majorId: string, joinYearId?: string) {
  return useQuery({
    queryKey: MAJOR_KEYS.staff(majorId, joinYearId),
    queryFn: () => getMajorStaff(majorId, joinYearId),
    enabled: !!majorId,
  });
}
