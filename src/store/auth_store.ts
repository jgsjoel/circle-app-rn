import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;

  setAuthenticated: (value: boolean) => void;
  setUserId: (id: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,

  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setUserId: (id) => set({ userId: id }),
}));
