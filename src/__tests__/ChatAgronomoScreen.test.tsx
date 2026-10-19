import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatAgronomoScreen } from '../screens/ChatAgronomoScreen';

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

describe('ChatAgronomoScreen', () => {
  it('renders correctly with information about channel availability', async () => {
    const { getByText } = await render(<ChatAgronomoScreen />);

    expect(getByText('Canal de Mensajería')).toBeTruthy();
    expect(getByText('En desarrollo')).toBeTruthy();
    expect(
      getByText(
        'La mensajería directa y coordinación técnica con agricultores estará disponible en una próxima actualización.'
      )
    ).toBeTruthy();
  });
});
