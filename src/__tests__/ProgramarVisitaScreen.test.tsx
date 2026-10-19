import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ProgramarVisitaScreen } from '../screens/ProgramarVisitaScreen';
import { agronomoService } from '../services/agronomoService';
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

jest.mock('../services/agronomoService', () => ({
  agronomoService: {
    getFincasAsignadas: jest.fn(),
    getFincaDetalle: jest.fn(),
  },
}));

jest.mock('../services/visitaService', () => ({
  visitaService: {
    crearVisita: jest.fn(),
  },
}));

describe('ProgramarVisitaScreen', () => {
  const mockFincasPage = {
    content: [
      {
        id: 'finca-1',
        nombre: 'Finca La Esmeralda',
        departamento: 'Norte de Santander',
        municipio: 'Ocaña',
        activa: true,
        totalLotes: 2,
        createdAt: '2026-01-01',
      },
    ],
    totalElements: 1,
    totalPages: 1,
    size: 50,
    number: 0,
    first: true,
    last: true,
    empty: false,
  };

  const mockFincaDetalle = {
    id: 'finca-1',
    nombre: 'Finca La Esmeralda',
    departamento: 'Norte de Santander',
    municipio: 'Ocaña',
    activa: true,
    totalLotes: 1,
    agricultorId: 'agri-1',
    agricultorNombre: 'Juan Pérez',
    agricultorTelefono: '3101234567',
    lotes: [
      {
        id: 'lote-1',
        nombre: 'Lote El Manantial',
        variedadCacao: 'CCN-51',
        activo: true,
      },
    ],
    createdAt: '2026-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (agronomoService.getFincasAsignadas as jest.Mock).mockResolvedValue(mockFincasPage);
    (agronomoService.getFincaDetalle as jest.Mock).mockResolvedValue(mockFincaDetalle);
    (visitaService.crearVisita as jest.Mock).mockResolvedValue({
      id: 'visita-creada-1',
      estado: 'PROGRAMADA',
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders correctly with form fields and instructions', async () => {
    const navigation = { goBack: jest.fn(), navigate: jest.fn() };
    const route = { params: {} };
    const screen = await render(
      <ProgramarVisitaScreen navigation={navigation} route={route} />
    );

    await waitFor(() => {
      expect(screen.getByText('Programar Visita Técnica')).toBeTruthy();
      expect(screen.getByText(/Toca para seleccionar una finca asignada/i)).toBeTruthy();
      expect(screen.getByText(/Agendar visita técnica/i)).toBeTruthy();
    });
  });

  it('validates that a finca must be selected before saving', async () => {
    const navigation = { goBack: jest.fn(), navigate: jest.fn() };
    const route = { params: {} };
    const screen = await render(
      <ProgramarVisitaScreen navigation={navigation} route={route} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Agendar visita técnica/i)).toBeTruthy();
    });

    fireEvent.press(screen.getByText(/Agendar visita técnica/i));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Datos incompletos',
      'Debes seleccionar una finca para la visita'
    );
    expect(visitaService.crearVisita).not.toHaveBeenCalled();
  });
});
