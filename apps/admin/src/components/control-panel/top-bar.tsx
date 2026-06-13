"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Palette, User } from "lucide-react";
import { toast } from "sonner";

import { adminLogout } from "@repo/common/actions/auth.action";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/common/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/common/components/ui/dropdown-menu";
import { useGetMeQuery } from "@repo/common/queries/users.query";
import { useAuthStore } from "@repo/common/stores/auth.store";

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

export const TOP_BAR_HEIGHT = 56; // px

export function TopBar() {
  const router = useRouter();
  const storeUser = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: meData } = useGetMeQuery();

  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY;
      setHidden(currentY > lastScrollY.current && currentY > TOP_BAR_HEIGHT);
      lastScrollY.current = currentY;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    const res = await adminLogout();
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    clearAuth();
    router.push("/auth/login");
  }

  const user = meData?.data?.user;
  const name = user?.name ?? storeUser?.name ?? "";
  const role = user?.role ?? storeUser?.role ?? "";
  const avatarUrl = user?.avatar?.url;

  return (
    <header
      style={{ height: TOP_BAR_HEIGHT }}
      className={`fixed top-0 right-0 left-64 z-20 flex items-center justify-end border-b bg-card px-6 transition-transform duration-200 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-xs font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABEL[role] ?? role}</p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Palette className="mr-2 h-4 w-4" />
            Theme
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
