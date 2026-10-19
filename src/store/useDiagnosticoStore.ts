import { create } from 'zustand';
import { DiagnosticoResult } from '../types/diagnostico';
import { diagnosticoService } from '../services/diagnosticoService';

interface DiagnosticoState {
  currentImageUri: string | null;
  currentDiagnosis: DiagnosticoResult | null;
  historial: DiagnosticoResult[];
  isAnalyzing: boolean;
  error: string | null;

  setCurrentImageUri: (uri: string | null) => void;
  setCurrentDiagnosis: (diagnosis: DiagnosticoResult | null) => void;
  clearError: () => void;
  ejecutarAnalisis: (imageUri: string) => Promise<DiagnosticoResult>;
  guardarEnHistorial: (diagnosis: DiagnosticoResult) => Promise<boolean>;
  cargarHistorial: () => Promise<void>;
}

export const useDiagnosticoStore = create<DiagnosticoState>((set, get) => ({
  currentImageUri: null,
  currentDiagnosis: null,
  historial: [],
  isAnalyzing: false,
  error: null,

  setCurrentImageUri: (uri) => set({ currentImageUri: uri }),
  setCurrentDiagnosis: (diagnosis) => set({ currentDiagnosis: diagnosis }),
  clearError: () => set({ error: null }),

  ejecutarAnalisis: async (imageUri) => {
    set({ isAnalyzing: true, currentImageUri: imageUri, error: null });
    try {
      const result = await diagnosticoService.analizarImagen(imageUri);
      // Garantizar que la imagen a renderizar tenga una URI válida (local o remota)
      const tieneUriValida = result.imagenUrl && (
        result.imagenUrl.startsWith('http://') ||
        result.imagenUrl.startsWith('https://') ||
        result.imagenUrl.startsWith('file:') ||
        result.imagenUrl.startsWith('data:') ||
        result.imagenUrl.startsWith('content:') ||
        result.imagenUrl.startsWith('blob:')
      );
      const finalResult: DiagnosticoResult = {
        ...result,
        imagenUrl: tieneUriValida ? result.imagenUrl : imageUri,
      };
      set({ currentDiagnosis: finalResult, isAnalyzing: false });
      return finalResult;
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message
        || 'No se pudo analizar la fotografía. Verifique su conexión y el servicio de análisis.';
      set({ isAnalyzing: false, error: errorMsg });
      throw error;
    }
  },

  guardarEnHistorial: async (diagnosis) => {
    try {
      const saved = await diagnosticoService.guardarDiagnostico(diagnosis);
      set((state) => ({
        historial: [saved, ...state.historial.filter((h) => h.id !== saved.id)],
      }));
      return true;
    } catch (e) {
      return false;
    }
  },

  cargarHistorial: async () => {
    try {
      const list = await diagnosticoService.obtenerHistorial();
      set({ historial: list });
    } catch (e) {
      // Mantener historial local si falla la consulta remota
    }
  },
}));
