import { useState, useRef, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import {
  CoordenadaGPS,
  GpsTrackerState,
  EstadoGPS,
} from '../types/geo';
import {
  filtrarCoordenadaGPS,
  calcularDistanciaTotal,
  calcularAreaAproximadaHectareas,
  simplificarCoordenadas,
} from '../utils/geoUtils';

interface UseGpsTrackerOptions {
  /** Intervalo mínimo entre lecturas GPS en milisegundos */
  intervaloMs?: number;
  /** Distancia mínima entre lecturas en metros */
  distanciaMinima?: number;
}

/**
 * Hook reactivo para rastreo GPS estilo Strava.
 *
 * Maneja el ciclo: idle → tracking → paused → tracking → finished.
 * Filtra automáticamente ruido GPS (precisión, velocidad, distancia mínima).
 * Calcula en tiempo real: distancia recorrida, área aproximada, precisión GPS.
 */
export function useGpsTracker(options: UseGpsTrackerOptions = {}) {
  const { intervaloMs = 2000, distanciaMinima = 2 } = options;

  const [state, setState] = useState<GpsTrackerState>({
    estado: 'idle',
    coordenadas: [],
    distanciaTotal: 0,
    areaAproximada: 0,
    precisionActual: 0,
    duracionSegundos: 0,
  });

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coordenadasRef = useRef<CoordenadaGPS[]>([]);
  const duracionSegundosRef = useRef<number>(0);

  const iniciarTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      duracionSegundosRef.current += 1;
      setState((prev) => ({
        ...prev,
        duracionSegundos: duracionSegundosRef.current,
      }));
    }, 1000);
  }, []);

  const detenerTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Solicita permisos de ubicación y comienza el rastreo GPS.
   */
  const iniciarRecorrido = useCallback(async () => {
    // Limpiar cualquier sesión anterior activa
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    detenerTimer();

    // Solicitar permisos de ubicación en primer plano
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permisos de ubicación denegados. Activa el GPS para delimitar tu lote.');
    }

    // Verificar que el GPS esté habilitado
    const gpsEnabled = await Location.hasServicesEnabledAsync();
    if (!gpsEnabled) {
      throw new Error('El GPS está desactivado. Actívalo en los ajustes de tu dispositivo.');
    }

    // Resetear estado
    coordenadasRef.current = [];
    duracionSegundosRef.current = 0;
    const tiempoInicio = Date.now();

    setState({
      estado: 'tracking',
      coordenadas: [],
      distanciaTotal: 0,
      areaAproximada: 0,
      precisionActual: 0,
      tiempoInicio,
      duracionSegundos: 0,
    });

    iniciarTimer();

    // Iniciar suscripción GPS de alta precisión
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: intervaloMs,
        distanceInterval: distanciaMinima,
      },
      (location) => {
        const nuevaCoordenada: CoordenadaGPS = {
          latitud: location.coords.latitude,
          longitud: location.coords.longitude,
          altitud: location.coords.altitude ?? undefined,
          precision: location.coords.accuracy ?? undefined,
          velocidad: location.coords.speed ?? undefined,
          timestamp: location.timestamp,
        };

        const ultimaCoordenada =
          coordenadasRef.current.length > 0
            ? coordenadasRef.current[coordenadasRef.current.length - 1]
            : null;

        // Aplicar filtro de ruido GPS
        if (filtrarCoordenadaGPS(nuevaCoordenada, ultimaCoordenada)) {
          coordenadasRef.current = [...coordenadasRef.current, nuevaCoordenada];

          const coordsSimples = coordenadasRef.current.map((c) => ({
            latitud: c.latitud,
            longitud: c.longitud,
          }));

          setState((prev) => ({
            ...prev,
            coordenadas: coordenadasRef.current,
            distanciaTotal: calcularDistanciaTotal(coordsSimples),
            areaAproximada:
              coordsSimples.length >= 3
                ? calcularAreaAproximadaHectareas(coordsSimples)
                : 0,
            precisionActual: nuevaCoordenada.precision ?? 0,
          }));
        } else {
          // Actualizar la precisión actual aunque se descarte el punto
          setState((prev) => ({
            ...prev,
            precisionActual: nuevaCoordenada.precision ?? prev.precisionActual,
          }));
        }
      }
    );

    subscriptionRef.current = subscription;
  }, [intervaloMs, distanciaMinima, iniciarTimer, detenerTimer]);

  /**
   * Pausa el rastreo GPS (mantiene las coordenadas recolectadas).
   */
  const pausarRecorrido = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    detenerTimer();
    setState((prev) => ({ ...prev, estado: 'paused' }));
  }, [detenerTimer]);

  /**
   * Reanuda el rastreo GPS después de una pausa.
   */
  const reanudarRecorrido = useCallback(async () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    setState((prev) => ({ ...prev, estado: 'tracking' }));
    iniciarTimer();

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: intervaloMs,
        distanceInterval: distanciaMinima,
      },
      (location) => {
        const nuevaCoordenada: CoordenadaGPS = {
          latitud: location.coords.latitude,
          longitud: location.coords.longitude,
          altitud: location.coords.altitude ?? undefined,
          precision: location.coords.accuracy ?? undefined,
          velocidad: location.coords.speed ?? undefined,
          timestamp: location.timestamp,
        };

        const ultimaCoordenada =
          coordenadasRef.current.length > 0
            ? coordenadasRef.current[coordenadasRef.current.length - 1]
            : null;

        if (filtrarCoordenadaGPS(nuevaCoordenada, ultimaCoordenada)) {
          coordenadasRef.current = [...coordenadasRef.current, nuevaCoordenada];

          const coordsSimples = coordenadasRef.current.map((c) => ({
            latitud: c.latitud,
            longitud: c.longitud,
          }));

          setState((prev) => ({
            ...prev,
            coordenadas: coordenadasRef.current,
            distanciaTotal: calcularDistanciaTotal(coordsSimples),
            areaAproximada:
              coordsSimples.length >= 3
                ? calcularAreaAproximadaHectareas(coordsSimples)
                : 0,
            precisionActual: nuevaCoordenada.precision ?? 0,
          }));
        }
      }
    );

    subscriptionRef.current = subscription;
  }, [intervaloMs, distanciaMinima, iniciarTimer]);

  /**
   * Finaliza el recorrido y devuelve las coordenadas simplificadas.
   * Aplica Douglas-Peucker para reducir vértices redundantes.
   */
  const finalizarRecorrido = useCallback(() => {
    // Detener suscripción GPS
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    // Detener timer de duración
    detenerTimer();

    // Simplificar coordenadas con Douglas-Peucker
    const coordsSimples = coordenadasRef.current.map((c) => ({
      latitud: c.latitud,
      longitud: c.longitud,
    }));

    const simplificadas = simplificarCoordenadas(coordsSimples);

    setState((prev) => ({ ...prev, estado: 'finished' }));

    return simplificadas;
  }, [detenerTimer]);

  /**
   * Cancela completamente el recorrido y limpia el estado.
   */
  const cancelarRecorrido = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    detenerTimer();
    coordenadasRef.current = [];
    duracionSegundosRef.current = 0;
    setState({
      estado: 'idle',
      coordenadas: [],
      distanciaTotal: 0,
      areaAproximada: 0,
      precisionActual: 0,
      duracionSegundos: 0,
    });
  }, [detenerTimer]);

  // Limpiar suscripciones al desmontar
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    iniciarRecorrido,
    pausarRecorrido,
    reanudarRecorrido,
    finalizarRecorrido,
    cancelarRecorrido,
  };
}
