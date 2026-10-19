jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { resolveMediaUrl, getServerBaseUrl } from '../utils/mediaUtils';
import { api } from '../services/api';

describe('mediaUtils', () => {
  const originalBaseURL = api.defaults.baseURL;

  afterEach(() => {
    api.defaults.baseURL = originalBaseURL;
  });

  test('retorna null para valores vacíos o nulos', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl('')).toBeNull();
    expect(resolveMediaUrl('   ')).toBeNull();
  });

  test('mantiene URIs locales nativas del dispositivo sin alteración', () => {
    expect(resolveMediaUrl('file:///data/user/0/cache/image.jpg')).toBe('file:///data/user/0/cache/image.jpg');
    expect(resolveMediaUrl('content://media/external/images/123')).toBe('content://media/external/images/123');
    expect(resolveMediaUrl('data:image/jpeg;base64,abc123==')).toBe('data:image/jpeg;base64,abc123==');
    expect(resolveMediaUrl('blob:http://localhost:19006/abc')).toBe('blob:http://localhost:19006/abc');
  });

  test('reemplaza localhost y 127.0.0.1 por la URL base del backend', () => {
    api.defaults.baseURL = 'http://192.168.1.15:8080/api/v1';
    expect(resolveMediaUrl('http://localhost:8080/uploads/diagnosticos/mazorca.jpg'))
      .toBe('http://192.168.1.15:8080/uploads/diagnosticos/mazorca.jpg');
    expect(resolveMediaUrl('http://127.0.0.1:8080/uploads/diagnosticos/mazorca.jpg'))
      .toBe('http://192.168.1.15:8080/uploads/diagnosticos/mazorca.jpg');
  });

  test('convierte rutas relativas en URLs absolutas', () => {
    api.defaults.baseURL = 'http://10.0.2.2:8080/api/v1';
    expect(resolveMediaUrl('/uploads/diagnosticos/123.jpg'))
      .toBe('http://10.0.2.2:8080/uploads/diagnosticos/123.jpg');
    expect(resolveMediaUrl('uploads/visitas/v1/foto.png'))
      .toBe('http://10.0.2.2:8080/uploads/visitas/v1/foto.png');
  });

  test('convierte nombres de archivo de imagen simples a /uploads/diagnosticos/', () => {
    api.defaults.baseURL = 'http://localhost:8080/api/v1';
    expect(resolveMediaUrl('fruto_cacao.jpg'))
      .toBe('http://localhost:8080/uploads/diagnosticos/fruto_cacao.jpg');
  });
});
