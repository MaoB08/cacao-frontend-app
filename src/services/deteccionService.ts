import { api } from './api';
import { Deteccion, DeteccionMarker, CrearDeteccionRequest } from '../types/geo';

/**
 * Servicio HTTP para Detecciones Georreferenciadas de enfermedades.
 */
export const deteccionService = {
  crear: async (data: CrearDeteccionRequest): Promise<Deteccion> => {
    const response = await api.post('/detecciones', data);
    return response.data;
  },

  listarPorLote: async (loteId: string): Promise<Deteccion[]> => {
    const response = await api.get(`/lotes/${loteId}/detecciones`);
    return response.data;
  },

  obtenerDetalle: async (deteccionId: string): Promise<Deteccion> => {
    const response = await api.get(`/detecciones/${deteccionId}`);
    return response.data;
  },

  obtenerTodasMapa: async (): Promise<DeteccionMarker[]> => {
    const response = await api.get('/detecciones/mapa');
    return response.data;
  },
};
