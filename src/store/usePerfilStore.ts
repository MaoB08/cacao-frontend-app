import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './useAuthStore';
import { biometricService } from '../services/biometricService';
import { resolveMediaUrl } from '../utils/mediaUtils';

export interface FincaInfo {
  nombre: string;
  departamento: string;
  municipio: string;
  hectareas: number;
}

export interface EstadisticasInfo {
  totalAnalisis: number;
  estadoSaludPorcentaje: number;
  estadoSaludEtiqueta: string;
}

export interface Perfil {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  finca: FincaInfo;
  fotoPerfil: string | null;
  estadisticas: EstadisticasInfo;
  notificacionesActivas: boolean;
  versionApp: string;
}

interface PerfilState {
  perfil: Perfil | null;
  loading: boolean;
  error: string | null;
  fetchPerfil: () => Promise<void>;
  updatePerfil: (request: Partial<Omit<Perfil, 'id' | 'email' | 'estadisticas' | 'versionApp'>>) => Promise<void>;
  updateFoto: (fileUri: string) => Promise<string>;
  logout: () => Promise<void>;
}

const sanitizeUrl = (url: string | null): string | null => {
  return resolveMediaUrl(url);
};

export const usePerfilStore = create<PerfilState>((set, get) => ({
  perfil: null,
  loading: false,
  error: null,

  fetchPerfil: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/perfil');
      const data = res.data;
      if (data) {
        data.fotoPerfil = sanitizeUrl(data.fotoPerfil);
      }
      set({ perfil: data, loading: false });
    } catch (e: any) {
      set({ error: e.mensaje || e.error || 'Error al obtener perfil', loading: false });
    }
  },

  updatePerfil: async (request) => {
    set({ loading: true, error: null });
    try {
      const res = await api.patch('/perfil', request);
      const data = res.data;
      if (data) {
        data.fotoPerfil = sanitizeUrl(data.fotoPerfil);
      }
      set({ perfil: data, loading: false });
      
      // Sincronizar el nombre con useAuthStore
      const authUser = useAuthStore.getState().user;
      if (authUser && request.nombre) {
        useAuthStore.getState().setSession(
          { ...authUser, nombre: request.nombre },
          useAuthStore.getState().accessToken!,
          useAuthStore.getState().refreshToken!
        );
      }
    } catch (e: any) {
      set({ error: e.mensaje || e.error || 'Error al actualizar perfil', loading: false });
      throw e;
    }
  },

  updateFoto: async (fileUri: string) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      const filename = fileUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('foto', {
        uri: fileUri,
        name: filename,
        type,
      } as any);

      const res = await api.post('/perfil/foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fotoUrl = sanitizeUrl(res.data.fotoPerfil) || '';
      
      // Optimistic update
      const current = get().perfil;
      if (current) {
        set({ perfil: { ...current, fotoPerfil: fotoUrl }, loading: false });
      } else {
        set({ loading: false });
      }
      return fotoUrl;
    } catch (e: any) {
      set({ error: e.mensaje || e.error || 'Error al subir foto de perfil', loading: false });
      throw e;
    }
  },

  logout: async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.warn('Error llamando endpoint de logout', e);
    } finally {
      // Siempre limpiar la sesión localmente
      await biometricService.disableBiometrics();
      await useAuthStore.getState().clearSession();
      set({ perfil: null });
    }
  },
}));
