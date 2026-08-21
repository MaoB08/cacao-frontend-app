import { api } from './api';
import { Inspeccion, InspeccionDetalle, CrearInspeccionRequest } from '../types/geo';

/**
 * Servicio HTTP para la gestión de Inspecciones de campo.
 */
export const inspeccionService = {
  crear: async (loteId: string, data: CrearInspeccionRequest): Promise<Inspeccion> => {
    const response = await api.post(`/lotes/${loteId}/inspecciones`, data);
    return response.data;
  },

  listarPorLote: async (loteId: string): Promise<Inspeccion[]> => {
    const response = await api.get(`/lotes/${loteId}/inspecciones`);
    return response.data;
  },

  obtenerDetalle: async (inspeccionId: string): Promise<InspeccionDetalle> => {
    const response = await api.get(`/inspecciones/${inspeccionId}`);
    return response.data;
  },
};
