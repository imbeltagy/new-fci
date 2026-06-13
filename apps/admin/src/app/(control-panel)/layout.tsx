"use client";

import { useEffect } from "react";
import { Toaster } from "@repo/common/components/ui/sonner";
import { useAuthStore } from "@repo/common/stores/auth.store";
import { Sidebar } from "@/components/control-panel/sidebar";

export default function ControlPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-6 p-8">{children}</div>
      </main>
      <Toaster richColors />
    </div>
  );
}
