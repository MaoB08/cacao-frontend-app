import { api } from './api';
import { Finca, FincaDetalle, CrearFincaRequest } from '../types/geo';

/**
 * Servicio HTTP para la gestión de Fincas agrícolas.
 */
export const fincaService = {
  crear: async (data: CrearFincaRequest): Promise<Finca> => {
    const response = await api.post('/fincas', data);
    return response.data;
  },

  listar: async (): Promise<Finca[]> => {
    const response = await api.get('/fincas');
    return response.data;
  },

  obtenerDetalle: async (fincaId: string): Promise<FincaDetalle> => {
    const response = await api.get(`/fincas/${fincaId}`);
    return response.data;
  },
};
