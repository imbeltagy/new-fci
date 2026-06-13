"use client";

import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "@repo/common/stores/auth.store";

import { BottomNav } from "@/components/layout/bottom-nav";
import { MainHeader } from "@/components/layout/main-header";

export default function MainLayout({ children }: { children: ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="min-h-dvh">
      <MainHeader />
      <main className="px-4 pt-14 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
