import { create } from 'zustand';
import { DiagnosticoResult, AnalisisRequestPayload } from '../types/diagnostico';
import { diagnosticoService } from '../services/diagnosticoService';

interface DiagnosticoState {
  currentImageUri: string | null;
  currentDiagnosis: DiagnosticoResult | null;
  historial: DiagnosticoResult[];
  isAnalyzing: boolean;
  modoSimulacion: 'AUTO' | 'ENFERMA' | 'SANA';
  
  setCurrentImageUri: (uri: string | null) => void;
  setCurrentDiagnosis: (diagnosis: DiagnosticoResult | null) => void;
  setModoSimulacion: (modo: 'AUTO' | 'ENFERMA' | 'SANA') => void;
  ejecutarAnalisis: (imageUri: string) => Promise<DiagnosticoResult>;
  guardarEnHistorial: (diagnosis: DiagnosticoResult) => Promise<boolean>;
  cargarHistorial: () => Promise<void>;
}

export const useDiagnosticoStore = create<DiagnosticoState>((set, get) => ({
  currentImageUri: null,
  currentDiagnosis: null,
  historial: [],
  isAnalyzing: false,
  modoSimulacion: 'AUTO',

  setCurrentImageUri: (uri) => set({ currentImageUri: uri }),
  setCurrentDiagnosis: (diagnosis) => set({ currentDiagnosis: diagnosis }),
  setModoSimulacion: (modo) => set({ modoSimulacion: modo }),

  ejecutarAnalisis: async (imageUri) => {
    set({ isAnalyzing: true, currentImageUri: imageUri });
    try {
      const payload: AnalisisRequestPayload = {
        imagenUri: imageUri,
        simulacionTipo: get().modoSimulacion,
      };
      const result = await diagnosticoService.analizarImagen(payload);
      set({ currentDiagnosis: result, isAnalyzing: false });
      return result;
    } catch (error) {
      set({ isAnalyzing: false });
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
    const list = await diagnosticoService.obtenerHistorial();
    set({ historial: list });
  },
}));
