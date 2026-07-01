import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';

// Mock de react-navigation
const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

// Mock de Zustand store para pruebas
jest.mock('../store/useAuthStore', () => ({
  useAuthStore: (selector: any) => selector({
    setSession: jest.fn(),
    isConnected: true,
  }),
}));

// Mock de API Axios
jest.mock('../services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

// Mock de biometricService
jest.mock('../services/biometricService', () => ({
  biometricService: {
    isBiometricsAvailable: jest.fn().mockResolvedValue(false),
    isBiometricsEnabled: jest.fn().mockResolvedValue(false),
    getSavedEmail: jest.fn().mockResolvedValue(null),
    enableBiometrics: jest.fn().mockResolvedValue(true),
    disableBiometrics: jest.fn().mockResolvedValue(undefined),
    authenticate: jest.fn().mockResolvedValue(null),
  },
}));

describe('Pruebas de Validación del Formulario de Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar correctamente los campos del formulario', () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    expect(getByPlaceholderText('Ingrese su contacto')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Iniciar Sesión')).toBeTruthy();
  });

  it('debe mostrar errores de validación si el formulario se envía vacío', async () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Iniciar Sesión'));

    await waitFor(() => {
      expect(getByText('Ingrese su correo o teléfono')).toBeTruthy();
      expect(getByText('La contraseña es requerida')).toBeTruthy();
    });
  });

  it('debe alertar al usuario si intenta usar la huella sin tenerla configurada', async () => {
    const { biometricService } = require('../services/biometricService');
    biometricService.isBiometricsAvailable.mockResolvedValueOnce(true);
    biometricService.isBiometricsEnabled.mockResolvedValueOnce(false);
    
    const { Alert } = require('react-native');
    const spyAlert = jest.spyOn(Alert, 'alert');

    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    const biometricButton = getByText('Huella');
    fireEvent.press(biometricButton);

    await waitFor(() => {
      expect(spyAlert).toHaveBeenCalledWith(
        'Huella no configurada',
        'Por favor, inicie sesión con su correo y contraseña primero para activar el inicio con huella.'
      );
    });
    spyAlert.mockRestore();
  });
});
