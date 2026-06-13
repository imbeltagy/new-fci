"use client";

import { create } from "zustand";

import { COOKIES } from "../constants/cookies";
import { deleteCookie, getCookie } from "../lib/cookies";
import type { AuthUser } from "../types/auth";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  initAuth: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  loading: true,
  user: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (loading) => set({ loading }),

  initAuth: () => {
    const raw = getCookie(COOKIES.USER);
    if (raw) {
      try {
        const user: AuthUser = JSON.parse(decodeURIComponent(raw));
        set({ user, isAuthenticated: true, loading: false });
        return;
      } catch {
        deleteCookie(COOKIES.USER);
      }
    }
    set({ user: null, isAuthenticated: false, loading: false });
  },

  clearAuth: () => {
    deleteCookie(COOKIES.USER);
    deleteCookie(COOKIES.ACCESS_TOKEN);
    deleteCookie(COOKIES.REFRESH_TOKEN);
    deleteCookie(COOKIES.SHOULD_CHANGE_PASSWORD);
    set({ user: null, isAuthenticated: false, loading: false });
  },
}));
