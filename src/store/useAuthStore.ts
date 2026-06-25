import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'AGRICULTOR' | 'EXPERTO' | 'ADMIN';
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
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      set({ user, accessToken, refreshToken });
    } catch (e) {
      console.error('Error saving session to SecureStore', e);
    }
  },

  clearSession: async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      set({ user: null, accessToken: null, refreshToken: null });
    } catch (e) {
      console.error('Error clearing session from SecureStore', e);
    }
  },

  loadSession: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const userStr = await SecureStore.getItemAsync('user');
      
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
      console.error('Error loading session from SecureStore', e);
      set({ isInitializing: false });
    }
  },

  setConnected: (isConnected) => {
    set({ isConnected });
  },

  updateAccessToken: async (accessToken) => {
    try {
      await SecureStore.setItemAsync('accessToken', accessToken);
      set({ accessToken });
    } catch (e) {
      console.error('Error updating accessToken in SecureStore', e);
    }
  }
}));
