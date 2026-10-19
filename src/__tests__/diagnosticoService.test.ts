import { diagnosticoService } from '../services/diagnosticoService';
import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
}));

describe('diagnosticoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('analizarImagen envía FormData con imagen al endpoint /diagnosticos/analizar', async () => {
    const mockResult = {
      id: 'diag-123',
      imagenUrl: 'mazorca_test.jpg',
      tieneEnfermedad: true,
      nombreEnfermedad: 'Moniliasis — Etapa inicial',
      nombreCientifico: 'Moniliophthora roreri',
      codigoClase: 'monilia_m1',
      probabilidad: 0.88,
      confianza: '88.0%',
      severidad: 'Baja — abultamientos o deformaciones visibles',
      modelVersion: 'monilia-efficientnet_b0-0.1.0',
      concluyente: true,
      recomendaciones: [],
    };

    (api.post as jest.Mock).mockResolvedValue({ data: mockResult });

    const result = await diagnosticoService.analizarImagen('file:///var/image/mazorca_1.jpg');

    expect(api.post).toHaveBeenCalledWith(
      '/diagnosticos/analizar',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
    );
    expect(result).toEqual(mockResult);
    expect(result.codigoClase).toBe('monilia_m1');
    expect(result.modelVersion).toBe('monilia-efficientnet_b0-0.1.0');
  });

  it('analizarImagen propaga error si el backend falla (no inventa resultados simulados)', async () => {
    const error = new Error('Servicio de análisis no disponible');
    (api.post as jest.Mock).mockRejectedValue(error);

    await expect(
      diagnosticoService.analizarImagen('file:///var/image/mazorca_err.jpg')
    ).rejects.toThrow('Servicio de análisis no disponible');
  });

  it('guardarDiagnostico guarda el resultado en /diagnosticos', async () => {
    const mockDiag = {
      id: 'd-1',
      imagenUrl: 'url',
      tieneEnfermedad: false,
      nombreEnfermedad: 'Mazorca Sana',
      nombreCientifico: 'Theobroma cacao L.',
      codigoClase: 'healthy',
      probabilidad: 0.96,
      confianza: '96.0%',
      severidad: 'Nula',
      modelVersion: 'monilia-efficientnet_b0-0.1.0',
      concluyente: true,
      recomendaciones: [],
    };
    (api.post as jest.Mock).mockResolvedValue({ data: mockDiag });

    const res = await diagnosticoService.guardarDiagnostico(mockDiag);
    expect(api.post).toHaveBeenCalledWith('/diagnosticos', mockDiag);
    expect(res).toEqual(mockDiag);
  });

  it('obtenerHistorial llama a GET /diagnosticos', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    const list = await diagnosticoService.obtenerHistorial();
    expect(api.get).toHaveBeenCalledWith('/diagnosticos');
    expect(list).toEqual([]);
  });
});
