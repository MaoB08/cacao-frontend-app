import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HistorialVisitasAgricultorModal } from '../components/HistorialVisitasAgricultorModal';
import { agricultorVisitaService } from '../services/agricultorVisitaService';

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

jest.mock('../services/agricultorVisitaService', () => ({
  agricultorVisitaService: {
    listarVisitas: jest.fn(),
  },
}));

describe('HistorialVisitasAgricultorModal', () => {
  const mockVisitas = {
    content: [
      {
        id: 'vis-1',
        estado: 'COMPLETADA',
        fechaProgramada: '2026-10-10T10:00:00',
        motivo: 'Evaluación de Moniliasis',
        fincaNombre: 'Finca Santa Bárbara',
        loteNombre: 'Lote Norte',
        agronomoNombre: 'Dra. María Pérez',
        recomendaciones: 'Podar ramas secas y aplicar caldo bordelés cada 15 días',
        plantasRevisadas: 40,
        plantasEnfermas: 2,
      },
      {
        id: 'vis-2',
        estado: 'PROGRAMADA',
        fechaProgramada: '2026-10-25T08:00:00',
        motivo: 'Revisión de floración',
        fincaNombre: 'Finca Santa Bárbara',
        agronomoNombre: 'Ing. Carlos Ruiz',
        duracionEstimadaMin: 90,
      },
    ],
    totalElements: 2,
    totalPages: 1,
    size: 50,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (agricultorVisitaService.listarVisitas as jest.Mock).mockResolvedValue(mockVisitas);
  });

  it('renders correctly and displays list of visits with recommendations', async () => {
    const onClose = jest.fn();
    const screen = await render(
      <HistorialVisitasAgricultorModal visible={true} onClose={onClose} />
    );

    await waitFor(() => {
      expect(screen.getByText('Visitas Técnicas')).toBeTruthy();
      expect(screen.getByText('Evaluación de Moniliasis')).toBeTruthy();
      expect(screen.getByText('Dra. María Pérez')).toBeTruthy();
      expect(screen.getByText('Podar ramas secas y aplicar caldo bordelés cada 15 días')).toBeTruthy();
      expect(screen.getByText('Revisión de floración')).toBeTruthy();
      expect(screen.getByText('Ing. Carlos Ruiz')).toBeTruthy();
    });
  });

  it('filters by PROXIMAS and COMPLETADAS tabs', async () => {
    const onClose = jest.fn();
    const screen = await render(
      <HistorialVisitasAgricultorModal visible={true} onClose={onClose} />
    );

    await waitFor(() => {
      expect(screen.getByText('Evaluación de Moniliasis')).toBeTruthy();
    });

    // Tap on 'Próximas' tab
    fireEvent.press(screen.getByText('Próximas'));

    await waitFor(() => {
      expect(screen.getByText('Revisión de floración')).toBeTruthy();
      expect(screen.queryByText('Evaluación de Moniliasis')).toBeNull();
    });

    // Tap on 'Completadas' tab
    fireEvent.press(screen.getByText('Completadas'));

    await waitFor(() => {
      expect(screen.getByText('Evaluación de Moniliasis')).toBeTruthy();
      expect(screen.queryByText('Revisión de floración')).toBeNull();
    });
  });
});
