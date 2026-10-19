import { agronomoService } from '../services/agronomoService';
import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('agronomoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getDashboard calls /agronomo/dashboard and returns data', async () => {
    const mockDashboard = {
      agronomo: { nombre: 'Ing. Carlos', fincasAsignadas: 5 },
      contadores: { programadas: 3, enCurso: 1, completadasMes: 12 },
      proximasVisitas: [],
    };
    (api.get as jest.Mock).mockResolvedValue({ data: mockDashboard });

    const result = await agronomoService.getDashboard();

    expect(api.get).toHaveBeenCalledWith('/agronomo/dashboard');
    expect(result).toEqual(mockDashboard);
  });

  it('getFincasAsignadas passes search and pagination parameters', async () => {
    const mockPage = {
      content: [{ id: 'finca-1', nombre: 'La Esmeralda', activa: true }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };
    (api.get as jest.Mock).mockResolvedValue({ data: mockPage });

    const result = await agronomoService.getFincasAsignadas('Esmeralda', 1, 10);

    expect(api.get).toHaveBeenCalledWith('/agronomo/fincas', {
      params: { search: 'Esmeralda', page: 1, size: 10 },
    });
    expect(result).toEqual(mockPage);
  });

  it('getFincaDetalle calls /agronomo/fincas/{id}/detalle', async () => {
    const mockDetalle = {
      id: 'f-1',
      nombre: 'Finca Cacao Real',
      agricultorNombre: 'Don José',
      lotes: [],
    };
    (api.get as jest.Mock).mockResolvedValue({ data: mockDetalle });

    const result = await agronomoService.getFincaDetalle('f-1');

    expect(api.get).toHaveBeenCalledWith('/agronomo/fincas/f-1/detalle');
    expect(result.agricultorNombre).toBe('Don José');
  });
});
