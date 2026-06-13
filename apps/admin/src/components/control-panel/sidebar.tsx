"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Users, Shield, CalendarDays, GraduationCap, BookOpen } from "lucide-react";
import { toast } from "sonner";

import { adminLogout } from "@repo/common/actions/auth.action";
import { Button } from "@repo/common/components/ui/button";
import { Separator } from "@repo/common/components/ui/separator";
import { cn } from "@repo/common/lib/utils";
import { useAuthStore } from "@repo/common/stores/auth.store";

const NAV_ITEMS = [
  { name: "Users", path: "/users", icon: Users },
  { name: "Access Groups", path: "/access-groups", icon: Shield },
  { name: "Join Years", path: "/join-years", icon: CalendarDays },
  { name: "Majors", path: "/majors", icon: GraduationCap },
  { name: "Subjects", path: "/subjects", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleLogout() {
    const res = await adminLogout();
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    clearAuth();
    router.push("/auth/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 px-6">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg">Control Panel</span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ name, path, icon: Icon }) => (
          <Link
            key={path}
            href={path}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(path)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {name}
          </Link>
        ))}
      </nav>

      <Separator />
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
