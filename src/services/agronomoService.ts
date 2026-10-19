import { api } from './api';
import {
  AgronomoDashboardData,
  FincaAgronomo,
  FincaDetalleAgronomo,
  PageResponse,
} from '../types/visita';

/**
 * Servicio para consumir endpoints del agrónomo: dashboard y fincas autorizadas.
 */
export const agronomoService = {
  /**
   * Obtiene resumen de agenda y contadores del agrónomo autenticado.
   */
  getDashboard: async (): Promise<AgronomoDashboardData> => {
    const response = await api.get('/agronomo/dashboard');
    return response.data;
  },

  /**
   * Lista las fincas activas asignadas al agrónomo con búsqueda y paginación opcional.
   */
  getFincasAsignadas: async (
    search?: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FincaAgronomo>> => {
    const params: Record<string, any> = { page, size };
    if (search && search.trim().length > 0) {
      params.search = search.trim();
    }
    const response = await api.get('/agronomo/fincas', { params });
    return response.data;
  },

  /**
   * Obtiene detalle de una finca asignada con sus lotes y datos del agricultor.
   */
  getFincaDetalle: async (id: string): Promise<FincaDetalleAgronomo> => {
    const response = await api.get(`/agronomo/fincas/${id}/detalle`);
    return response.data;
  },
};
