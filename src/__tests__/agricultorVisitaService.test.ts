import { agricultorVisitaService } from '../services/agricultorVisitaService';
import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('agricultorVisitaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listarVisitas calls /agricultores/visitas with pagination and optional fincaId', async () => {
    const mockResponse = {
      content: [
        {
          id: 'visita-101',
          estado: 'COMPLETADA',
          fechaProgramada: '2026-10-14T09:00:00',
          fincaId: 'finca-1',
          fincaNombre: 'Finca El Roble',
          agronomoNombre: 'Dra. María Pérez',
          recomendaciones: 'Control biológico y poda preventiva',
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

    (api.get as jest.Mock).mockResolvedValue({ data: mockResponse });

    const res = await agricultorVisitaService.listarVisitas('finca-1', 0, 20);

    expect(api.get).toHaveBeenCalledWith('/agricultores/visitas', {
      params: { fincaId: 'finca-1', page: 0, size: 20 },
    });
    expect(res).toEqual(mockResponse);
  });

  it('listarVisitas calls /agricultores/visitas without fincaId if not provided', async () => {
    const mockResponse = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: true,
    };

    (api.get as jest.Mock).mockResolvedValue({ data: mockResponse });

    const res = await agricultorVisitaService.listarVisitas(undefined, 1, 10);

    expect(api.get).toHaveBeenCalledWith('/agricultores/visitas', {
      params: { page: 1, size: 10 },
    });
    expect(res.empty).toBe(true);
  });

  it('getResumenVisitas calls /agricultores/visitas/resumen', async () => {
    const mockResumen = {
      proximasVisitas: 2,
      completadasTotal: 5,
      proximas: [
        {
          id: 'visita-202',
          estado: 'PROGRAMADA',
          fechaProgramada: '2026-10-20T08:30:00',
          fincaNombre: 'La Cabaña',
          agronomoNombre: 'Ing. Carlos Ruiz',
          motivo: 'Revisión periódica',
        },
      ],
    };

    (api.get as jest.Mock).mockResolvedValue({ data: mockResumen });

    const res = await agricultorVisitaService.getResumenVisitas();

    expect(api.get).toHaveBeenCalledWith('/agricultores/visitas/resumen');
    expect(res.proximasVisitas).toBe(2);
    expect(res.completadasTotal).toBe(5);
    expect(res.proximas.length).toBe(1);
    expect(res.proximas[0].agronomoNombre).toBe('Ing. Carlos Ruiz');
  });
});
