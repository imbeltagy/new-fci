"use client";

import { create } from "zustand";

interface AppState {
  apiOnline: boolean;
  setApiOnline: (apiOnline: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  apiOnline: false,
  setApiOnline: (apiOnline) => set({ apiOnline }),
}));
