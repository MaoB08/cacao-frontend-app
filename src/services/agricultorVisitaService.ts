import { api } from './api';
import {
  VisitaAgricultorResumen,
  VisitasAgricultorDashboard,
  PageResponse,
} from '../types/visita';

/**
 * Servicio para consumir los endpoints de visitas del agricultor.
 * Solo lectura — el agricultor no puede crear, editar ni cancelar visitas.
 */
export const agricultorVisitaService = {
  /**
   * Lista las visitas técnicas asociadas a las fincas del agricultor autenticado.
   */
  listarVisitas: async (
    fincaId?: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<VisitaAgricultorResumen>> => {
    const params: Record<string, any> = { page, size };
    if (fincaId) params.fincaId = fincaId;
    const response = await api.get('/agricultores/visitas', { params });
    return response.data;
  },

  /**
   * Obtiene el resumen de visitas para el dashboard del agricultor.
   */
  getResumenVisitas: async (): Promise<VisitasAgricultorDashboard> => {
    const response = await api.get('/agricultores/visitas/resumen');
    return response.data;
  },
};
