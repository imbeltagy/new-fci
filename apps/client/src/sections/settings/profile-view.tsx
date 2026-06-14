"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/common/components/ui/button";
import { Input } from "@repo/common/components/ui/input";
import { Label } from "@repo/common/components/ui/label";
import { useListJoinYearsQuery } from "@repo/common/queries/join-years.query";
import { useListMajorsQuery } from "@repo/common/queries/majors.query";
import { useGetMeQuery, useUpdateMeMutation } from "@repo/common/queries/users.query";
import { useAuthStore } from "@repo/common/stores/auth.store";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function ReadOnlyField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export function ProfileView() {
  const storeUser = useAuthStore((s) => s.user);
  const { data: meData, isPending } = useGetMeQuery();
  const { mutateAsync: updateMe, isPending: isSaving } = useUpdateMeMutation();
  const { data: majorsData } = useListMajorsQuery();
  const { data: joinYearsData } = useListJoinYearsQuery();

  const user = meData?.data?.user;
  const name = user?.name ?? storeUser?.name ?? "";
  const role = user?.role ?? storeUser?.role ?? "";
  const isStudent = role === "student";

  const [whatsapp, setWhatsapp] = useState("");
  const savedWhatsapp = user?.whatsapp ?? "";
  const whatsappChanged = whatsapp !== savedWhatsapp;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    setWhatsapp(user?.whatsapp ?? "");
  }, [user?.whatsapp]);

  const majorName = user?.majorId
    ? (majorsData?.data?.majors ?? []).find((m) => m.id === user.majorId)?.name
    : null;
  const joinYear = user?.joinYearId
    ? (joinYearsData?.data?.joinYears ?? []).find((jy) => jy.id === user.joinYearId)?.year
    : null;

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

  async function handleSaveWhatsapp() {
    const res = await updateMe({ whatsapp: whatsapp.trim() || undefined });
    if (!res.success) {
      toast.error(res.message);
    } else {
      toast.success("WhatsApp number saved.");
    }
  }

  if (isPending) {
    return <p className="py-4 text-sm text-muted-foreground">Loading...</p>;
  }

  const avatarUrl = user?.avatar?.url;

  function copyLink() {
    const email = user?.email;
    if (!email) return;
    const url = `${window.location.origin}/users/${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied!"));
  }

  return (
    <div className="space-y-8 py-4">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarUploading}
          className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-border transition-opacity hover:opacity-80 disabled:opacity-50"
          aria-label="Change avatar"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">{getInitials(name)}</span>
          )}
          {avatarUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-xs text-white">Saving…</span>
            </div>
          )}
        </button>
        <p className="text-xs text-muted-foreground">Tap to change avatar</p>
        <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
          <Link className="h-4 w-4" />
          Copy profile link
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* Read-only fields */}
      <div className="space-y-4">
        <ReadOnlyField label="Name" value={name} />
        <ReadOnlyField label="Email" value={user?.email} />
        {isStudent && (
          <>
            <ReadOnlyField label="Major" value={majorName} />
            <ReadOnlyField label="Join Year" value={joinYear} />
          </>
        )}
      </div>

      {/* WhatsApp — students only */}
      {isStudent && (
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp number</Label>
          <div className="flex gap-2">
            <Input
              id="whatsapp"
              type="tel"
              placeholder="+20 xxx xxx xxxx"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <Button
              onClick={handleSaveWhatsapp}
              disabled={isSaving || !whatsappChanged}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
