"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Link } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/common/components/ui/button";
import { useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import { useListMajorsQuery } from "@repo/common/queries/majors.query";
import { useUserProfileQuery } from "@repo/common/queries/users.query";
import { useAuthStore } from "@repo/common/stores/auth.store";

import { MessageButton } from "@/components/message-button";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  teacher: "Faculty",
  sub_teacher: "Faculty",
  it: "IT",
  superadmin: "Admin",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function UserProfileView({ email }: { email: string }) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data, isPending, isError } = useUserProfileQuery(email);
  const { data: majorsData } = useListMajorsQuery();
  const { data: joinYearsData } = useListJoinYearsQuery();

  const profile = data?.data?.profile;

  const majorName = profile?.majorId
    ? (majorsData?.data?.majors ?? []).find((m) => m.id === profile.majorId)?.name
    : null;
  const joinYear = profile?.joinYearId
    ? (joinYearsData?.data?.joinYears ?? []).find((jy) => jy.id === profile.joinYearId)?.year
    : null;

  function copyLink() {
    const url = `${window.location.origin}/users/${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied!"));
  }

  const isOwn = !!currentUserId && profile?.id === currentUserId;

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="flex-1 font-semibold">Profile</p>
        <Button variant="ghost" size="icon" onClick={copyLink} title="Copy profile link">
          <Link className="h-5 w-5" />
        </Button>
      </div>

      {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && <p className="text-sm text-destructive">User not found.</p>}

      {profile && (
        <>
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-border">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {getInitials(profile.name)}
                </span>
              )}
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{ROLE_LABEL[profile.role] ?? profile.role}</p>
            </div>
            {!isOwn && (
              <MessageButton userId={profile.id} />
            )}
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-4">
            {majorName && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Major</p>
                <p className="text-sm font-medium">{majorName}</p>
              </div>
            )}
            {joinYear && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Join Year</p>
                <p className="text-sm font-medium">{joinYear}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
