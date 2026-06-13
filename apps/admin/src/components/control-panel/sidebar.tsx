"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react";

import { cn } from "@repo/common/lib/utils";

const NAV_ITEMS = [
  { name: "Users", path: "/users", icon: Users },
  { name: "Access Groups", path: "/access-groups", icon: Shield },
  { name: "Join Years", path: "/join-years", icon: CalendarDays },
  { name: "Majors", path: "/majors", icon: GraduationCap },
  { name: "Subjects", path: "/subjects", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex h-screen w-64 border-r flex-col bg-card">
      <div className="flex h-14 items-center gap-2 px-6">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold">Control Panel</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ name, path, icon: Icon }) => (
          <Link
            key={path}
            href={path}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(path)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
