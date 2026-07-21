import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const inMemoryStore = new Map<string, string>();

/**
 * Almacenamiento seguro e infalible compatible con Web, Expo Go, Android e iOS.
 * Previene el error [AsyncStorageError: Native module is null].
 */
export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // 1. Intentar en Web con localStorage
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const val = window.localStorage.getItem(key);
          if (val !== null) return val;
        }
      } catch (e) {
        // Ignorar error de web
      }
    }

    // 2. Intentar con SecureStore
    try {
      const secureVal = await SecureStore.getItemAsync(key);
      if (secureVal !== null) return secureVal;
    } catch (e) {
      // Ignorar error de SecureStore
    }

    // 3. Intentar con AsyncStorage
    try {
      const asyncVal = await AsyncStorage.getItem(key);
      if (asyncVal !== null) return asyncVal;
    } catch (e) {
      // Ignorar error de AsyncStorage (Native module is null)
    }

    // 4. Retornar del almacén en memoria
    return inMemoryStore.get(key) || null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    inMemoryStore.set(key, value);

    // 1. Guardar en Web si aplica
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch (e) {
        // Ignorar error web
      }
    }

    // 2. Guardar en SecureStore
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch (e) {
      // Ignorar error SecureStore
    }

    // 3. Guardar en AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch (e) {
      // Ignorar error de AsyncStorage (Native module is null)
    }
  },

  removeItem: async (key: string): Promise<void> => {
    inMemoryStore.delete(key);

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {}
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {}

    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  },
};
