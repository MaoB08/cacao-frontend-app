import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VisitasScreen } from '../screens/VisitasScreen';
import { visitaService } from '../services/visitaService';

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

jest.mock('../services/visitaService', () => ({
  visitaService: {
    listarVisitas: jest.fn(),
  },
}));

describe('VisitasScreen', () => {
  const mockVisitasPage = {
    content: [
      {
        id: 'visita-101',
        estado: 'PROGRAMADA',
        fechaProgramada: '2026-10-22T08:30:00',
        duracionEstimadaMin: 60,
        motivo: 'Evaluación de clones',
        fincaId: 'finca-1',
        fincaNombre: 'Finca La Esmeralda',
        fincaMunicipio: 'Ocaña',
        agricultorNombre: 'Juan Pérez',
        loteNombre: 'Lote El Manantial',
        createdAt: '2026-10-10',
      },
      {
        id: 'visita-102',
        estado: 'EN_CURSO',
        fechaProgramada: '2026-10-18T10:00:00',
        duracionEstimadaMin: 90,
        motivo: 'Atención técnica en terreno',
        fincaId: 'finca-2',
        fincaNombre: 'Finca Villa Cacao',
        fincaMunicipio: 'San Vicente',
        agricultorNombre: 'Pedro Agricultor',
        createdAt: '2026-10-11',
      },
    ],
    totalElements: 2,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (visitaService.listarVisitas as jest.Mock).mockResolvedValue(mockVisitasPage);
  });

  it('renders visits screen with tabs and lists scheduled visits', async () => {
    const navigation = { navigate: jest.fn() };
    const screen = await render(<VisitasScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Agenda de Visitas')).toBeTruthy();
      expect(screen.getByText('Programadas')).toBeTruthy();
      expect(screen.getByText('Historial')).toBeTruthy();
      expect(screen.getByText('Finca La Esmeralda')).toBeTruthy();
      expect(screen.getByText('Finca Villa Cacao')).toBeTruthy();
      expect(screen.getByText(/Juan Pérez/)).toBeTruthy();
    });
  });

  it('navigates to DetalleVisita when a visit card is pressed', async () => {
    const navigation = { navigate: jest.fn() };
    const screen = await render(<VisitasScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Finca La Esmeralda')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Finca La Esmeralda'));

    expect(navigation.navigate).toHaveBeenCalledWith('DetalleVisita', {
      visitaId: 'visita-101',
    });
  });

  it('switches to Historial tab and fetches history', async () => {
    const mockHistorial = {
      content: [
        {
          id: 'visita-completada-1',
          estado: 'COMPLETADA',
          fechaProgramada: '2026-10-05T10:00:00',
          motivo: 'Control de plagas',
          fincaId: 'finca-1',
          fincaNombre: 'Finca La Esmeralda',
          fincaMunicipio: 'Ocaña',
          agricultorNombre: 'Juan Pérez',
          createdAt: '2026-10-01',
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

    (visitaService.listarVisitas as jest.Mock).mockResolvedValueOnce(mockVisitasPage);

    const navigation = { navigate: jest.fn() };
    const screen = await render(<VisitasScreen navigation={navigation} />);

    await waitFor(() => {
      expect(screen.getByText('Historial')).toBeTruthy();
    });

    (visitaService.listarVisitas as jest.Mock).mockResolvedValueOnce(mockHistorial);
    fireEvent.press(screen.getByText('Historial'));

    await waitFor(() => {
      expect(visitaService.listarVisitas).toHaveBeenCalled();
    });
  });
});
