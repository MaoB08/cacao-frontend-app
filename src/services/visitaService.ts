import { Platform } from 'react-native';
import { api } from './api';
import { safeStorage } from '../utils/safeStorage';
import {
  VisitaResumen,
  VisitaDetalle,
  VisitaImagen,
  AnalisisImagenResult,
  BorradorVisita,
  CrearVisitaRequest,
  ReprogramarVisitaRequest,
  CancelarVisitaRequest,
  FinalizarVisitaRequest,
  PageResponse,
} from '../types/visita';

export interface ListarVisitasParams {
  estado?: string;
  fincaId?: string;
  desde?: string; // ISO date string YYYY-MM-DDTHH:mm:ss
  hasta?: string;
  page?: number;
  size?: number;
}

/**
 * Servicio para la gestión integral de visitas técnicas del agrónomo.
 */
export const visitaService = {
  /**
   * Lista visitas técnicas del agrónomo con filtros y paginación.
   */
  listarVisitas: async (params?: ListarVisitasParams): Promise<PageResponse<VisitaResumen>> => {
    const response = await api.get('/visitas', { params });
    return response.data;
  },

  /**
   * Obtiene el detalle completo de una visita técnica.
   */
  obtenerDetalle: async (id: string): Promise<VisitaDetalle> => {
    const response = await api.get(`/visitas/${id}`);
    return response.data;
  },

  /**
   * Agenda una nueva visita técnica a una finca autorizada.
   */
  crearVisita: async (data: CrearVisitaRequest): Promise<VisitaDetalle> => {
    const response = await api.post('/visitas', data);
    return response.data;
  },

  /**
   * Reprograma fecha, hora o notas de una visita PROGRAMADA o REPROGRAMADA.
   */
  reprogramarVisita: async (
    id: string,
    data: ReprogramarVisitaRequest
  ): Promise<VisitaDetalle> => {
    const response = await api.patch(`/visitas/${id}`, data);
    return response.data;
  },

  /**
   * Cancela una visita antes de su inicio registrando motivo.
   */
  cancelarVisita: async (
    id: string,
    motivoCancelacion: string
  ): Promise<VisitaDetalle> => {
    const body: CancelarVisitaRequest = { motivoCancelacion };
    const response = await api.post(`/visitas/${id}/cancelar`, body);
    return response.data;
  },

  /**
   * Inicia la visita en campo cambiando su estado a EN_CURSO.
   */
  iniciarVisita: async (id: string): Promise<VisitaDetalle> => {
    const response = await api.post(`/visitas/${id}/iniciar`);
    return response.data;
  },

  /**
   * Finaliza la visita técnica con informe, observaciones y recomendaciones.
   */
  finalizarVisita: async (
    id: string,
    data: FinalizarVisitaRequest
  ): Promise<VisitaDetalle> => {
    const response = await api.post(`/visitas/${id}/finalizar`, data);
    return response.data;
  },

  /**
   * Sube una imagen de evidencia fotográfica vinculada a la visita en curso.
   */
  subirImagen: async (
    visitaId: string,
    imageUri: string,
    loteId?: string,
    notas?: string
  ): Promise<VisitaImagen> => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'evidencia.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    // En web vs nativo
    if (Platform.OS === 'web') {
      try {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        formData.append('file', blob, filename);
      } catch {
        formData.append('file', { uri: imageUri, name: filename, type: mime } as any);
      }
    } else {
      formData.append('file', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: filename,
        type: mime,
      } as any);
    }

    if (loteId) formData.append('loteId', loteId);
    if (notas) formData.append('notas', notas);

    const response = await api.post(`/visitas/${visitaId}/imagenes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Obtiene la lista de evidencias fotográficas cargadas para la visita.
   */
  listarImagenes: async (visitaId: string): Promise<VisitaImagen[]> => {
    const response = await api.get(`/visitas/${visitaId}/imagenes`);
    return response.data;
  },

  /**
   * Solicita el análisis IA (detección de moniliasis/enfermedad) de una imagen de visita.
   */
  analizarImagen: async (
    visitaId: string,
    imagenId: string
  ): Promise<AnalisisImagenResult> => {
    const response = await api.post(`/visitas/${visitaId}/imagenes/${imagenId}/analizar`);
    return response.data;
  },

  /**
   * Guarda un borrador local de la visita en progreso para soporte offline en campo.
   */
  guardarBorrador: async (
    visitaId: string,
    borrador: BorradorVisita
  ): Promise<void> => {
    await safeStorage.setItem(
      `@borrador_visita_${visitaId}`,
      JSON.stringify(borrador)
    );
  },

  /**
   * Recupera el borrador guardado localmente de una visita técnica.
   */
  obtenerBorrador: async (visitaId: string): Promise<BorradorVisita | null> => {
    const json = await safeStorage.getItem(`@borrador_visita_${visitaId}`);
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  },

  /**
   * Elimina el borrador local tras finalizar con éxito la visita técnica.
   */
  limpiarBorrador: async (visitaId: string): Promise<void> => {
    await safeStorage.removeItem(`@borrador_visita_${visitaId}`);
  },
};

