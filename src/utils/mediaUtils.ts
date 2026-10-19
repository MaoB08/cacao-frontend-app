import { api } from '../services/api';

/**
 * Obtiene la URL base del servidor backend (sin /api/v1 ni barra final).
 * Ejemplo: 'http://192.168.1.15:8080' o 'http://10.0.2.2:8080' o 'http://localhost:8080'
 */
export const getServerBaseUrl = (): string => {
  const currentBase = api.defaults.baseURL || 'http://localhost:8080/api/v1';
  return currentBase.replace(/\/api(\/v\d+)?\/?$/, '').replace(/\/$/, '');
};

/**
 * Normaliza y resuelve cualquier URL o URI de imagen para que sea cargable por React Native:
 * 1. Mantiene URIs locales nativas de captura: file:, content:, data:, blob:
 * 2. Reemplaza 'localhost:8080' o '127.0.0.1:8080' por el host real alcanzable por el dispositivo/emulador
 * 3. Convierte rutas relativas (/uploads/...) en URLs absolutas válidas
 * 4. Maneja nombres de archivo aislados (ej. 'foto.jpg') apuntando a /uploads/diagnosticos/
 */
export const resolveMediaUrl = (uri?: string | null): string | null => {
  if (!uri || typeof uri !== 'string') {
    return null;
  }

  const clean = uri.trim();
  if (clean === '') {
    return null;
  }

  // 1. URIs locales directas en el dispositivo
  if (
    clean.startsWith('file:') ||
    clean.startsWith('content:') ||
    clean.startsWith('data:') ||
    clean.startsWith('blob:')
  ) {
    return clean;
  }

  const serverBase = getServerBaseUrl();

  // 2. URLs que contienen localhost o 127.0.0.1
  if (clean.includes('localhost:8080') || clean.includes('127.0.0.1:8080')) {
    return clean
      .replace(/https?:\/\/localhost:8080/, serverBase)
      .replace(/https?:\/\/127\.0\.0\.1:8080/, serverBase);
  }

  // 3. Rutas relativas que inician con /
  if (clean.startsWith('/')) {
    return `${serverBase}${clean}`;
  }

  // 4. Rutas relativas como uploads/...
  if (clean.startsWith('uploads/')) {
    return `${serverBase}/${clean}`;
  }

  // 5. Nombre de archivo simple (ej. '128aca2a-fed5.jpg')
  if (/^[a-zA-Z0-9_\-.]+\.(jpg|jpeg|png|webp)$/i.test(clean)) {
    return `${serverBase}/uploads/diagnosticos/${clean}`;
  }

  // 6. URL absoluta HTTP/HTTPS
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  return clean;
};
