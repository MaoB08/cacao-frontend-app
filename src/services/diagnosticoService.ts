import { Platform } from 'react-native';
import { api } from './api';
import { DiagnosticoResult } from '../types/diagnostico';
import * as FileSystem from 'expo-file-system/legacy';

export const diagnosticoService = {
  /**
   * Envía la imagen al backend Spring Boot como multipart/form-data.
   * NO tiene fallback simulado: si el servidor o red falla, se propaga el error
   * para que la interfaz muestre el estado de error real al usuario.
   */
  analizarImagen: async (imageUri: string): Promise<DiagnosticoResult> => {
    // Validar existencia del archivo si es posible
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('El archivo de fotografía no existe en el almacenamiento.');
      }
    } catch (e: any) {
      if (e?.message?.includes('no existe')) {
        throw e;
      }
      // En web o entornos donde getInfoAsync no aplique, continuar con imageUri
    }

    // Determinar nombre y tipo MIME por extensión
    const filename = imageUri.split('/').pop()?.split('?')[0] || `mazorca_${Date.now()}.jpg`;
    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = extension === 'png' ? 'image/png'
                   : extension === 'webp' ? 'image/webp'
                   : 'image/jpeg';

    const cleanUri = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;

    // React Native FormData con especificación de archivo
    const formData = new FormData();
    formData.append('imagen', {
      uri: cleanUri,
      name: filename,
      type: mimeType,
    } as any);

    const response = await api.post<DiagnosticoResult>(
      '/diagnosticos/analizar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60s para inferencia y transferencia
      }
    );

    return response.data;
  },

  /**
   * Guarda el diagnóstico en el historial del servidor.
   */
  guardarDiagnostico: async (diagnostico: DiagnosticoResult): Promise<DiagnosticoResult> => {
    const response = await api.post<DiagnosticoResult>('/diagnosticos', diagnostico);
    return response.data;
  },

  /**
   * Obtiene el historial de diagnósticos del usuario autenticado.
   */
  obtenerHistorial: async (): Promise<DiagnosticoResult[]> => {
    const response = await api.get<DiagnosticoResult[]>('/diagnosticos');
    return response.data;
  },
};
