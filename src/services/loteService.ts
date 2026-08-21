import { api } from './api';
import {
  LoteMapa,
  LoteDetalle,
  CrearLoteRequest,
  ActualizarLoteRequest,
} from '../types/geo';

/**
 * Servicio HTTP para la gestión de Lotes agrícolas.
 */
export const loteService = {
  /**
   * Crea un lote con las coordenadas GPS del recorrido.
   * El backend construye el polígono PostGIS y calcula área/perímetro.
   */
  crear: async (data: CrearLoteRequest): Promise<LoteDetalle> => {
    const response = await api.post('/lotes', data);
    return response.data;
  },

  /**
   * Obtiene todos los lotes del usuario con polígonos y marcadores
   * de detecciones. Optimizado para renderizar la vista del mapa.
   */
  obtenerMapa: async (): Promise<LoteMapa[]> => {
    const response = await api.get('/lotes/mapa');
    return response.data;
  },

  obtenerDetalle: async (loteId: string): Promise<LoteDetalle> => {
    const response = await api.get(`/lotes/${loteId}`);
    return response.data;
  },

  actualizar: async (loteId: string, data: ActualizarLoteRequest): Promise<LoteDetalle> => {
    const response = await api.put(`/lotes/${loteId}`, data);
    return response.data;
  },

  eliminar: async (loteId: string): Promise<void> => {
    await api.delete(`/lotes/${loteId}`);
  },
};
