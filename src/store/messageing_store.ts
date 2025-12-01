import { create } from "zustand";

interface CurrentUser {
  id: number;
  name: string;
  phone: string;
  publicId: string;
  isOnline?: boolean;
  localChatId?:any;
}

interface MessagingStore {
  isAuthenticated: boolean;
  user: CurrentUser | null;

  // Actions
  setAuthenticated: (value: boolean) => void;
  setUser: (user: CurrentUser) => void;
  setOnlineStatus: (status: boolean) => void;
  logout: () => void;
}

export const useMessagingStore = create<MessagingStore>((set, get) => ({
  isAuthenticated: false,
  user: null,

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  setUser: (user) => set({ user, isAuthenticated: true }),

  // Only updates isOnline without touching other fields
  setOnlineStatus: (status: boolean) => {
    const user = get().user;
    if (user) {
      set({ user: { ...user, isOnline: status } });
    }
  },

  logout: () => set({ user: null, isAuthenticated: false }),
}));
