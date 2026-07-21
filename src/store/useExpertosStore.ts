import { create } from 'zustand';
import { api } from '../services/api';

export interface Experto {
  id: string;
  nombre: string;
  especialidad: string;
  descripcion: string;
  rating: number;
  fotoPerfil: string | null;
  disponible: boolean;
  tiempoEspera: number | null;
}

interface ExpertosState {
  expertos: Experto[];
  especialidades: string[];
  loading: boolean;
  error: string | null;
  fetchExpertos: (especialidad?: string, busqueda?: string) => Promise<void>;
  fetchEspecialidades: () => Promise<void>;
  iniciarChat: (expertoId: string) => Promise<{ chatId: string; mensaje: string }>;
}

export const useExpertosStore = create<ExpertosState>((set) => ({
  expertos: [],
  especialidades: ['Todos'],
  loading: false,
  error: null,

  fetchExpertos: async (especialidad, busqueda) => {
    set({ loading: true, error: null });
    try {
      const params: any = {};
      if (especialidad && especialidad !== 'Todos') {
        params.especialidad = especialidad;
      }
      if (busqueda) {
        params.busqueda = busqueda;
      }
      const res = await api.get('/expertos', { params });
      set({ expertos: res.data, loading: false });
    } catch (e: any) {
      set({ error: e.mensaje || e.error || 'Error al listar expertos', loading: false });
    }
  },

  fetchEspecialidades: async () => {
    try {
      const res = await api.get('/expertos/especialidades');
      set({ especialidades: res.data });
    } catch (e) {
      console.warn('Error al obtener especialidades', e);
    }
  },

  iniciarChat: async (expertoId) => {
    try {
      const res = await api.post('/chat/iniciar', { expertoId });
      return res.data;
    } catch (e: any) {
      // Devolver error tipado o relanzar
      throw e;
    }
  },
}));
