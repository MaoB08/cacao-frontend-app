import { create } from 'zustand';
import { safeStorage } from '../utils/safeStorage';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'AGRICULTOR' | 'EXPERTO' | 'ADMIN';
  telefono?: string;
  departamento?: string;
  municipio?: string;
  nombreFinca?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isConnected: boolean;
  isInitializing: boolean;
  setSession: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearSession: () => Promise<void>;
  loadSession: () => Promise<void>;
  setConnected: (isConnected: boolean) => void;
  updateAccessToken: (accessToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isConnected: true,
  isInitializing: true,

  setSession: async (user, accessToken, refreshToken) => {
    try {
      await safeStorage.setItem('accessToken', accessToken);
      await safeStorage.setItem('refreshToken', refreshToken);
      await safeStorage.setItem('user', JSON.stringify(user));
      set({ user, accessToken, refreshToken });
    } catch (e) {
      console.error('Error saving session to safeStorage', e);
    }
  },

  clearSession: async () => {
    try {
      await safeStorage.removeItem('accessToken');
      await safeStorage.removeItem('refreshToken');
      await safeStorage.removeItem('user');
      set({ user: null, accessToken: null, refreshToken: null });
    } catch (e) {
      console.error('Error clearing session from safeStorage', e);
    }
  },

  loadSession: async () => {
    try {
      const accessToken = await safeStorage.getItem('accessToken');
      const refreshToken = await safeStorage.getItem('refreshToken');
      const userStr = await safeStorage.getItem('user');
      
      if (accessToken && refreshToken && userStr) {
        set({ 
          accessToken, 
          refreshToken, 
          user: JSON.parse(userStr),
          isInitializing: false 
        });
      } else {
        set({ isInitializing: false });
      }
    } catch (e) {
      console.error('Error loading session from safeStorage', e);
      set({ isInitializing: false });
    }
  },

  setConnected: (isConnected) => {
    set({ isConnected });
  },

  updateAccessToken: async (accessToken) => {
    try {
      await safeStorage.setItem('accessToken', accessToken);
      set({ accessToken });
    } catch (e) {
      console.error('Error updating accessToken in safeStorage', e);
    }
  }
}));
