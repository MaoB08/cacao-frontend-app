import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// URL del backend configurada en .env
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de Peticiones
api.interceptors.request.use(
  async (config) => {
    // 1. Validar estado de conectividad antes de enviar la petición
    const isConnected = useAuthStore.getState().isConnected;
    if (!isConnected) {
      return Promise.reject(new Error('no_connectivity'));
    }

    // 2. Inyectar token de acceso si existe
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Manejar caso de falta de conectividad
    if (error.message === 'no_connectivity') {
      return Promise.reject({ error: 'offline', mensaje: 'No hay conexión a internet. Revisa tu señal.' });
    }

    // Manejar caso de caída del servidor (Timeout o Red)
    if (!error.response) {
      return Promise.reject({ error: 'sin_servidor', mensaje: 'Servidor inaccesible. Por favor intenta más tarde.' });
    }

    // Interceptar error 401 (No autorizado) para renovar el token automáticamente
    if (error.response.status === 401 && !originalRequest._retry) {
      
      // Si el error 401 viene del login o del refresh, fallar directamente
      if (originalRequest.url === '/auth/login' || originalRequest.url === '/auth/refresh') {
        return Promise.reject(error.response.data);
      }

      if (isRefreshing) {
        // Encolar peticiones mientras se está refrescando el token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        await useAuthStore.getState().clearSession();
        isRefreshing = false;
        return Promise.reject(error.response.data);
      }

      try {
        // Petición directa a axios para saltarse los interceptores
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Actualizar tokens en store y SecureStore
        await useAuthStore.getState().updateAccessToken(newAccessToken);
        if (newRefreshToken) {
          await useAuthStore.getState().setSession(
            useAuthStore.getState().user!,
            newAccessToken,
            newRefreshToken
          );
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresco de token falla (refresh token expiró en Postgres), desloguear
        processQueue(refreshError, null);
        await useAuthStore.getState().clearSession();
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response.data);
  }
);
