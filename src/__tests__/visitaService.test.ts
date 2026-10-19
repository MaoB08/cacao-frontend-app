import { visitaService } from '../services/visitaService';
import { api } from '../services/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('visitaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listarVisitas calls /visitas with params', async () => {
    const mockPage = {
      content: [
        {
          id: 'v-1',
          estado: 'PROGRAMADA',
          fincaNombre: 'Villa Sol',
          fechaProgramada: '2026-10-20T10:00:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };
    (api.get as jest.Mock).mockResolvedValue({ data: mockPage });

    const result = await visitaService.listarVisitas({ estado: 'PROGRAMADA', page: 0 });

    expect(api.get).toHaveBeenCalledWith('/visitas', {
      params: { estado: 'PROGRAMADA', page: 0 },
    });
    expect(result.content.length).toBe(1);
    expect(result.content[0].estado).toBe('PROGRAMADA');
  });

  it('obtenerDetalle calls /visitas/{id}', async () => {
    const mockDetalle = {
      id: 'v-123',
      estado: 'PROGRAMADA',
      fincaNombre: 'Finca El Cedro',
      agricultorNombre: 'María López',
    };
    (api.get as jest.Mock).mockResolvedValue({ data: mockDetalle });

    const result = await visitaService.obtenerDetalle('v-123');

    expect(api.get).toHaveBeenCalledWith('/visitas/v-123');
    expect(result.agricultorNombre).toBe('María López');
  });

  it('crearVisita posts to /visitas', async () => {
    const req = {
      fincaId: 'finca-uuid',
      fechaProgramada: '2026-10-25T09:00:00',
      motivo: 'Inspección de moniliasis',
    };
    const mockCreated = { id: 'new-v', ...req, estado: 'PROGRAMADA' };
    (api.post as jest.Mock).mockResolvedValue({ data: mockCreated });

    const result = await visitaService.crearVisita(req);

    expect(api.post).toHaveBeenCalledWith('/visitas', req);
    expect(result.id).toBe('new-v');
  });

  it('reprogramarVisita patches to /visitas/{id}', async () => {
    const req = { fechaProgramada: '2026-10-28T14:00:00' };
    const mockUpdated = { id: 'v-1', estado: 'REPROGRAMADA' };
    (api.patch as jest.Mock).mockResolvedValue({ data: mockUpdated });

    const result = await visitaService.reprogramarVisita('v-1', req);

    expect(api.patch).toHaveBeenCalledWith('/visitas/v-1', req);
    expect(result.estado).toBe('REPROGRAMADA');
  });

  it('cancelarVisita posts to /visitas/{id}/cancelar with reason', async () => {
    const mockCancelled = { id: 'v-1', estado: 'CANCELADA' };
    (api.post as jest.Mock).mockResolvedValue({ data: mockCancelled });

    const result = await visitaService.cancelarVisita('v-1', 'Cierre de vías');

    expect(api.post).toHaveBeenCalledWith('/visitas/v-1/cancelar', {
      motivoCancelacion: 'Cierre de vías',
    });
    expect(result.estado).toBe('CANCELADA');
  });

  it('iniciarVisita posts to /visitas/{id}/iniciar', async () => {
    const mockEnCurso = { id: 'v-1', estado: 'EN_CURSO' };
    (api.post as jest.Mock).mockResolvedValue({ data: mockEnCurso });

    const result = await visitaService.iniciarVisita('v-1');

    expect(api.post).toHaveBeenCalledWith('/visitas/v-1/iniciar');
    expect(result.estado).toBe('EN_CURSO');
  });

  it('finalizarVisita posts to /visitas/{id}/finalizar with report data', async () => {
    const req = {
      observaciones: 'Buena sanidad',
      recomendaciones: 'Podar ramas bajeras',
      plantasRevisadas: 40,
      plantasEnfermas: 2,
    };
    const mockCompletada = { id: 'v-1', estado: 'COMPLETADA', ...req };
    (api.post as jest.Mock).mockResolvedValue({ data: mockCompletada });

    const result = await visitaService.finalizarVisita('v-1', req);

    expect(api.post).toHaveBeenCalledWith('/visitas/v-1/finalizar', req);
    expect(result.estado).toBe('COMPLETADA');
  });

  it('subirImagen posts multipart data to /visitas/{id}/imagenes', async () => {
    const mockImagen = {
      id: 'img-1',
      imagenUrl: 'http://localhost:8080/api/v1/visitas/v-1/imagenes/img-1/archivo',
      notas: 'Mazorca sospechosa',
    };
    (api.post as jest.Mock).mockResolvedValue({ data: mockImagen });

    const result = await visitaService.subirImagen('v-1', 'file:///test/foto.jpg', 'lote-1', 'Mazorca sospechosa');

    expect(api.post).toHaveBeenCalledWith(
      '/visitas/v-1/imagenes',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
    expect(result.id).toBe('img-1');
  });

  it('listarImagenes gets /visitas/{id}/imagenes', async () => {
    const mockImgs = [{ id: 'img-1', imagenUrl: 'http://localhost:8080/img-1' }];
    (api.get as jest.Mock).mockResolvedValue({ data: mockImgs });

    const result = await visitaService.listarImagenes('v-1');

    expect(api.get).toHaveBeenCalledWith('/visitas/v-1/imagenes');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('img-1');
  });

  it('analizarImagen posts to /visitas/{id}/imagenes/{imgId}/analizar', async () => {
    const mockAnalisis = {
      status: 'no_disponible',
      mensaje: 'Servicio de análisis IA no disponible en este momento',
      imagenId: 'img-1',
    };
    (api.post as jest.Mock).mockResolvedValue({ data: mockAnalisis });

    const result = await visitaService.analizarImagen('v-1', 'img-1');

    expect(api.post).toHaveBeenCalledWith('/visitas/v-1/imagenes/img-1/analizar');
    expect(result.status).toBe('no_disponible');
  });

  it('saves, retrieves and cleans local draft for rural connectivity', async () => {
    const borrador = {
      visitaId: 'v-100',
      observaciones: 'Muchas malezas',
      recomendaciones: 'Control manual',
      guardadoEn: '2026-10-07T21:00:00Z',
    };

    await visitaService.guardarBorrador('v-100', borrador);
    const obtenido = await visitaService.obtenerBorrador('v-100');

    expect(obtenido).toEqual(borrador);

    await visitaService.limpiarBorrador('v-100');
    const trasLimpiar = await visitaService.obtenerBorrador('v-100');
    expect(trasLimpiar).toBeNull();
  });
});
