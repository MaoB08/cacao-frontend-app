export interface JwtPayload {
  sub: string;
  rol?: 'AGRICULTOR' | 'EXPERTO' | 'ADMIN';
  exp?: number;
  [key: string]: any;
}

const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const atobPolyfill = (input: string): string => {
  const str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) {
    return '';
  }
  for (
    let bc = 0, bs = 0, buffer, idx = 0;
    (buffer = str.charAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer),
      bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = b64chars.indexOf(buffer);
  }
  return output;
};

/**
 * Decodifica un token JWT para extraer su payload.
 */
export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decodificar base64 de forma compatible con React Native
    const raw = atobPolyfill(base64);
    const utf8 = decodeURIComponent(
      raw.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(utf8);
  } catch (error) {
    console.error('Error al decodificar el token JWT:', error);
    return null;
  }
};
