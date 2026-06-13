"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { useGetMeQuery, useUpdateMeMutation } from "@repo/common/queries/users.query";
import { useAuthStore } from "@repo/common/stores/auth.store";
import { PageHeader } from "@/components/control-panel/page-header";

const ROLE_LABEL: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  sub_teacher: "Sub Teacher",
  it: "IT",
  superadmin: "Super Admin",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export function AdminProfileView() {
  const storeUser = useAuthStore((s) => s.user);
  const { data: meData, isPending } = useGetMeQuery();
  const { mutateAsync: updateMe, isPending: isSaving } = useUpdateMeMutation();

  const user = meData?.data?.user;
  const name = user?.name ?? storeUser?.name ?? "";
  const role = user?.role ?? storeUser?.role ?? "";
  const avatarUrl = user?.avatar?.url;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const res = await updateMe({ avatar: file });
    setAvatarUploading(false);
    if (!res.success) {
      toast.error(res.message);
    } else {
      toast.success("Avatar updated.");
    }
    e.target.value = "";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        breadcrumbs={[{ label: "Control Panel", href: "/" }, { label: "Profile" }]}
      />

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="max-w-sm space-y-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading || isSaving}
              className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-border transition-opacity hover:opacity-80 disabled:opacity-50"
              aria-label="Change avatar"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {getInitials(name)}
                </span>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-xs text-white">Saving…</span>
                </div>
              )}
            </button>
            <p className="text-xs text-muted-foreground">Click to change avatar</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Info */}
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <ReadOnlyField label="Name" value={name} />
            <ReadOnlyField label="Email" value={user?.email} />
            <ReadOnlyField label="Role" value={ROLE_LABEL[role] ?? role} />
          </div>
        </div>
      )}
    </div>
  );
}
