"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Settings, Users } from "lucide-react";

import { cn } from "@repo/common/lib/utils";

const TABS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Community", href: "/community", icon: Users },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

const NON_HOME_ROOTS = ["/community", "/chat", "/settings", "/users"];

function isTabActive(href: string, pathname: string) {
  if (href === "/") {
    return !NON_HOME_ROOTS.some((root) => pathname.startsWith(root));
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 h-16 border-t bg-card">
      <div className="flex h-full">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = isTabActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
