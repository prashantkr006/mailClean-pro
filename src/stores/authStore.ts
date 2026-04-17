import { create } from 'zustand';
import type { UserProfile } from '@/types/domain';

interface AuthStore {
  signedIn: boolean;
  user: UserProfile | null;
  setAuth: (signedIn: boolean, user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  signedIn: false,
  user: null,
  setAuth: (signedIn, user) => set({ signedIn, user }),
}));