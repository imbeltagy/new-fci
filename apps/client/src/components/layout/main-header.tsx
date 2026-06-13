"use client";

import { Bell } from "lucide-react";

import { Button } from "@repo/common/components/ui/button";
import { useListMajorsQuery } from "@repo/common/queries/majors.query";
import { useGetMeQuery } from "@repo/common/queries/users.query";
import { useAuthStore } from "@repo/common/stores/auth.store";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function MainHeader() {
  const storeUser = useAuthStore((s) => s.user);
  const { data: meData } = useGetMeQuery();
  const { data: majorsData } = useListMajorsQuery();

  const user = meData?.data?.user;
  const name = user?.name ?? storeUser?.name ?? "";
  const role = user?.role ?? storeUser?.role ?? "";
  const avatarUrl = user?.avatarUrl;
  const majorId = user?.majorId;

  const isStudent = role === "student";
  const majorName =
    isStudent && majorId
      ? (majorsData?.data?.majors ?? []).find((m) => m.id === majorId)?.name
      : undefined;

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b bg-card px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              {getInitials(name)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{name}</p>
          {isStudent && majorName && (
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {majorName}
            </p>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0" aria-label="Announcements">
        <Bell className="h-5 w-5" />
      </Button>
    </header>
  );
}
