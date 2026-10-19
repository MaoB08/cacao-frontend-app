import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { VisitaEnCursoScreen } from '../screens/VisitaEnCursoScreen';
import { visitaService } from '../services/visitaService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('../services/visitaService', () => ({
  visitaService: {
    obtenerDetalle: jest.fn(),
    iniciarVisita: jest.fn(),
    listarImagenes: jest.fn(),
    subirImagen: jest.fn(),
    analizarImagen: jest.fn(),
    finalizarVisita: jest.fn(),
    obtenerBorrador: jest.fn(),
    guardarBorrador: jest.fn(),
    limpiarBorrador: jest.fn(),
  },
}));

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

describe('VisitaEnCursoScreen', () => {
  const mockVisita = {
    id: 'visita-123',
    estado: 'EN_CURSO',
    fechaProgramada: '2026-10-20T10:00:00',
    fechaInicioReal: '2026-10-20T10:05:00',
    fincaNombre: 'Finca Villa Cacao',
    fincaMunicipio: 'Lebrija',
    agricultorNombre: 'Carlos Gómez',
    loteNombre: 'Lote Central',
    totalImagenes: 0,
    imagenes: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (visitaService.obtenerDetalle as jest.Mock).mockResolvedValue(mockVisita);
    (visitaService.obtenerBorrador as jest.Mock).mockResolvedValue(null);
    (visitaService.listarImagenes as jest.Mock).mockResolvedValue([]);
  });

  it('renders field attention form with context and buttons', async () => {
    const route = { params: { visitaId: 'visita-123' } };
    const navigation = { navigate: jest.fn(), goBack: jest.fn(), setParams: jest.fn() };

    const screen = await render(
      <VisitaEnCursoScreen route={route} navigation={navigation} />
    );

    await waitFor(() => {
      expect(screen.getByText('Atención Técnica en Campo')).toBeTruthy();
      expect(screen.getByText('Finca Villa Cacao')).toBeTruthy();
      expect(screen.getByText('Carlos Gómez')).toBeTruthy();
    });

    expect(screen.getByText(/Evidencias de Campo/)).toBeTruthy();
    expect(screen.getByText('Cámara')).toBeTruthy();
    expect(screen.getByText('Galería')).toBeTruthy();
    expect(screen.getByText('Escáner IA')).toBeTruthy();
    expect(screen.getByText('Finalizar Visita Técnica')).toBeTruthy();

    expect(
      screen.getByPlaceholderText(/Se observa floración abundante/i)
    ).toBeTruthy();
  });
});
