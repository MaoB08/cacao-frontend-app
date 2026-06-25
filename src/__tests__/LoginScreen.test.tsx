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
});
