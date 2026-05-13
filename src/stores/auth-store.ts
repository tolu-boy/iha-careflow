"use client";

import { create } from "zustand";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type AuthUser = {
  uid: string;
  userId: string;
  email: string;
  fullName: string;
  displayName: string;
  photoURL: string;
  role: string;
  active: boolean;
};

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  resetUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) =>
    set({
      user,
      status: user ? "authenticated" : "unauthenticated",
    }),
  setStatus: (status) => set({ status }),
  resetUser: () => set({ user: null, status: "unauthenticated" }),
}));
