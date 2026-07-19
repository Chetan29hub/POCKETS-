import { create } from 'zustand';
import { fetchUser, updateUser } from '@/database/queries/user';
import type { User } from '@/database/types';

interface UserState {
  user: User | null;
  isLoaded: boolean;
  loadUser: () => void;
  updateProfile: (fields: Partial<Omit<User, 'id' | 'created_at'>>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoaded: false,

  loadUser: () => {
    try {
      const user = fetchUser();
      set({ user, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  updateProfile: (fields) => {
    updateUser(fields);
    const user = fetchUser();
    set({ user });
  },
}));
