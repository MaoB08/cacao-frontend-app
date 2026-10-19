import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DashboardAgronomoScreen } from '../screens/DashboardAgronomoScreen';
import { agronomoService } from '../services/agronomoService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../contexts/AccesibilidadContext', () => ({
  useAccesibilidad: () => ({
    colores: require('../constants/theme').Theme.colors,
    escalaTexto: 1.0,
    escalaBoton: 1.0,
    botonesGrandes: false,
    altoContraste: false,
    lectorPantalla: false,
    tamanoTexto: 'normal',
  }),
}));

jest.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: {
        id: 'agronomo-1',
        nombre: 'Dr. Carlos Gómez',
        email: 'experto@cacao.com',
        rol: 'EXPERTO',
      },
    }),
}));

jest.mock('../services/agronomoService', () => ({
  agronomoService: {
    getDashboard: jest.fn(),
  },
}));

describe('DashboardAgronomoScreen', () => {
  const mockDashboardData = {
    agronomo: {
      nombre: 'Dr. Carlos Gómez',
      fincasAsignadas: 3,
    },
    contadores: {
      programadas: 4,
      enCurso: 1,
      completadasMes: 15,
    },
    proximasVisitas: [
      {
        id: 'visita-1',
        estado: 'PROGRAMADA',
        fechaProgramada: '2026-10-20T09:00:00',
        fincaNombre: 'Finca La Esmeralda',
        fincaMunicipio: 'Ocaña',
        agricultorNombre: 'Juan Pérez',
        loteNombre: 'Lote El Manantial',
        motivo: 'Evaluación de Monilia',
      },
      {
        id: 'visita-2',
        estado: 'EN_CURSO',
        fechaProgramada: '2026-10-18T14:00:00',
        fincaNombre: 'Finca Villa Cacao',
        fincaMunicipio: 'San Vicente',
        agricultorNombre: 'Pedro Agricultor',
        motivo: 'Seguimiento de poda',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (agronomoService.getDashboard as jest.Mock).mockResolvedValue(mockDashboardData);
  });

  it('renders dashboard with agronomist info, KPIs and upcoming visits', async () => {
    const navigation = { navigate: jest.fn() };
    const screen = await render(<DashboardAgronomoScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Dr. Carlos Gómez')).toBeTruthy();
      expect(screen.getByText(/3 fincas asignadas/i)).toBeTruthy();
      expect(screen.getByText('4')).toBeTruthy(); // Programadas
      expect(screen.getByText('1')).toBeTruthy(); // En curso
      expect(screen.getByText('15')).toBeTruthy(); // Completadas mes
      expect(screen.getByText('Finca La Esmeralda')).toBeTruthy();
      expect(screen.getByText('Finca Villa Cacao')).toBeTruthy();
    });
  });

  it('navigates to ProgramarVisita when action button is pressed', async () => {
    const navigation = { navigate: jest.fn() };
    const screen = await render(<DashboardAgronomoScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText(/Programar visita técnica/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Programar visita técnica/i));
    expect(navigation.navigate).toHaveBeenCalledWith('Visitas', { screen: 'ProgramarVisita' });
  });

  it('renders error state and retries on press', async () => {
    (agronomoService.getDashboard as jest.Mock).mockRejectedValueOnce({
      mensaje: 'Fallo al conectar con el servidor',
    });

    const navigation = { navigate: jest.fn() };
    const screen = await render(<DashboardAgronomoScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Fallo al conectar con el servidor')).toBeTruthy();
      expect(screen.getByText('Reintentar')).toBeTruthy();
    });

    (agronomoService.getDashboard as jest.Mock).mockResolvedValueOnce(mockDashboardData);
    fireEvent.press(screen.getByText('Reintentar'));

    await waitFor(() => {
      expect(screen.getByText('Dr. Carlos Gómez')).toBeTruthy();
    });
  });
});
