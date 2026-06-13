"use client";

import { useEffect } from "react";

import { Toaster } from "@repo/common/components/ui/sonner";
import { useAuthStore } from "@repo/common/stores/auth.store";

import { Sidebar } from "@/components/control-panel/sidebar";
import { TopBar, TOP_BAR_HEIGHT } from "@/components/control-panel/top-bar";

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
    <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main
        className="ml-64 px-8"
        style={{ paddingTop: TOP_BAR_HEIGHT + 24 }}
      >
        <div className="mx-auto max-w-screen-2xl space-y-6 pb-8">{children}</div>
      </main>
      <Toaster richColors />
    </div>
  );
}
