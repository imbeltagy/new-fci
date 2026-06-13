"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, LifeBuoy, LogOut, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuthStore } from "@repo/common/stores/auth.store";

function MenuRow({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  function handleLogout() {
    clearAuth();
    router.push("/auth/login");
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-1">
        <MenuRow icon={User} label="Profile" disabled />
        <MenuRow icon={LifeBuoy} label="Support tickets" disabled />
      </div>

      <div className="space-y-1">
        <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Settings
        </p>
        <InfoRow label="Language" value="English" />
        <InfoRow label="Theme" value="System" />
      </div>

      <div className="space-y-1">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}
