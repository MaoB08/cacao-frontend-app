/**
 * Utilidades geográficas para CacaoScan.
 *
 * Implementa:
 * - Filtro de ruido GPS (accuracy, velocidad, distancia mínima) estilo Strava.
 * - Cálculo de distancia Haversine entre dos puntos.
 * - Simplificación de polígonos mediante Douglas-Peucker.
 * - Cálculo aproximado de área (Shoelace formula para polígonos planos).
 */

import { Coordenada, CoordenadaGPS } from '../types/geo';

// ======================== Constantes de filtrado GPS ========================

/** Precisión máxima aceptable en metros. Lecturas con mayor error se descartan. */
const MAX_ACCURACY_METROS = 15;

/** Velocidad máxima a pie en terreno agrícola en m/s (~15 km/h). */
const MAX_VELOCIDAD_MS = 4.17;

/** Distancia mínima en metros entre puntos consecutivos para evitar acumulación en pausa. */
const MIN_DISTANCIA_METROS = 3;

/** Tolerancia para el algoritmo Douglas-Peucker (en grados lat/lng, ~11m a nivel del ecuador). */
const DOUGLAS_PEUCKER_TOLERANCIA = 0.0001;

// ======================== Haversine ========================

const RADIO_TIERRA_METROS = 6371000;

/**
 * Calcula la distancia en metros entre dos coordenadas GPS
 * usando la fórmula de Haversine (geometría esférica).
 */
export function calcularDistancia(p1: Coordenada, p2: Coordenada): number {
  const lat1 = toRadians(p1.latitud);
  const lat2 = toRadians(p2.latitud);
  const dLat = toRadians(p2.latitud - p1.latitud);
  const dLon = toRadians(p2.longitud - p1.longitud);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return RADIO_TIERRA_METROS * c;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ======================== Filtro de coordenadas GPS ========================

/**
 * Filtra una nueva coordenada GPS entrante según los criterios de calidad
 * definidos para el recorrido estilo Strava.
 *
 * @returns true si la coordenada es válida y debe agregarse al recorrido.
 */
export function filtrarCoordenadaGPS(
  nueva: CoordenadaGPS,
  anterior: CoordenadaGPS | null
): boolean {
  // 1. Filtro de precisión: descartar lecturas con alta incertidumbre
  if (nueva.precision !== undefined && nueva.precision > MAX_ACCURACY_METROS) {
    return false;
  }

  // Sin punto anterior, aceptar la primera lectura válida
  if (!anterior) {
    return true;
  }

  // 2. Filtro de distancia mínima: evitar "nubes" de puntos en pausas
  const distancia = calcularDistancia(
    { latitud: anterior.latitud, longitud: anterior.longitud },
    { latitud: nueva.latitud, longitud: nueva.longitud }
  );

  if (distancia < MIN_DISTANCIA_METROS) {
    return false;
  }

  // 3. Filtro de teletransportación / velocidad: descartar saltos anómalos
  const tiempoTranscurrido = (nueva.timestamp - anterior.timestamp) / 1000; // segundos
  if (tiempoTranscurrido > 0) {
    const velocidad = distancia / tiempoTranscurrido;
    if (velocidad > MAX_VELOCIDAD_MS) {
      return false;
    }
  }

  return true;
}

// ======================== Douglas-Peucker ========================

/**
 * Simplifica una lista de coordenadas eliminando puntos redundantes
 * que no aportan curvatura significativa al trazado.
 *
 * Implementación del algoritmo Douglas-Peucker para reducir la cantidad
 * de vértices antes de enviar el polígono al backend.
 */
export function simplificarCoordenadas(
  coordenadas: Coordenada[],
  tolerancia: number = DOUGLAS_PEUCKER_TOLERANCIA
): Coordenada[] {
  if (coordenadas.length <= 3) return coordenadas;

  let maxDistancia = 0;
  let maxIndex = 0;

  const inicio = coordenadas[0];
  const fin = coordenadas[coordenadas.length - 1];

  for (let i = 1; i < coordenadas.length - 1; i++) {
    const dist = distanciaPuntoALinea(coordenadas[i], inicio, fin);
    if (dist > maxDistancia) {
      maxDistancia = dist;
      maxIndex = i;
    }
  }

  if (maxDistancia > tolerancia) {
    const izquierda = simplificarCoordenadas(
      coordenadas.slice(0, maxIndex + 1),
      tolerancia
    );
    const derecha = simplificarCoordenadas(
      coordenadas.slice(maxIndex),
      tolerancia
    );

    return [...izquierda.slice(0, -1), ...derecha];
  }

  return [inicio, fin];
}

/**
 * Calcula la distancia perpendicular de un punto a una línea definida
 * por dos puntos extremos (en grados lat/lng para simplicidad 2D).
 */
function distanciaPuntoALinea(
  punto: Coordenada,
  lineaInicio: Coordenada,
  lineaFin: Coordenada
): number {
  const dx = lineaFin.longitud - lineaInicio.longitud;
  const dy = lineaFin.latitud - lineaInicio.latitud;

  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      Math.pow(punto.longitud - lineaInicio.longitud, 2) +
        Math.pow(punto.latitud - lineaInicio.latitud, 2)
    );
  }

  const t =
    ((punto.longitud - lineaInicio.longitud) * dx +
      (punto.latitud - lineaInicio.latitud) * dy) /
    (dx * dx + dy * dy);

  const tClamped = Math.max(0, Math.min(1, t));

  const proyX = lineaInicio.longitud + tClamped * dx;
  const proyY = lineaInicio.latitud + tClamped * dy;

  return Math.sqrt(
    Math.pow(punto.longitud - proyX, 2) + Math.pow(punto.latitud - proyY, 2)
  );
}

// ======================== Cálculo de área aproximada ========================

/**
 * Calcula el área aproximada de un polígono en hectáreas
 * usando la fórmula de Gauss (Shoelace) con conversión de grados a metros.
 *
 * Nota: Esta es una aproximación local. El área exacta se calcula en PostGIS.
 */
export function calcularAreaAproximadaHectareas(coordenadas: Coordenada[]): number {
  if (coordenadas.length < 3) return 0;

  // Factor de conversión de grados a metros en latitud promedio
  const latMedia = coordenadas.reduce((sum, c) => sum + c.latitud, 0) / coordenadas.length;
  const metrosPorGradoLat = 111320;
  const metrosPorGradoLon = 111320 * Math.cos(toRadians(latMedia));

  let area = 0;
  const n = coordenadas.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = coordenadas[i].longitud * metrosPorGradoLon;
    const yi = coordenadas[i].latitud * metrosPorGradoLat;
    const xj = coordenadas[j].longitud * metrosPorGradoLon;
    const yj = coordenadas[j].latitud * metrosPorGradoLat;

    area += xi * yj - xj * yi;
  }

  const areaM2 = Math.abs(area) / 2;
  return areaM2 / 10000; // Convertir m² a hectáreas
}

// ======================== Distancia total de un recorrido ========================

/**
 * Calcula la distancia total en metros de un recorrido (polyline).
 */
export function calcularDistanciaTotal(coordenadas: Coordenada[]): number {
  let total = 0;
  for (let i = 1; i < coordenadas.length; i++) {
    total += calcularDistancia(coordenadas[i - 1], coordenadas[i]);
  }
  return total;
}

// ======================== Centroide ========================

/**
 * Calcula el centroide (punto central) de un conjunto de coordenadas.
 * Utilizado para centrar el mapa sobre un lote seleccionado.
 */
export function calcularCentroide(coordenadas: Coordenada[]): Coordenada {
  if (coordenadas.length === 0) {
    return { latitud: 0, longitud: 0 };
  }

  const sumLat = coordenadas.reduce((sum, c) => sum + c.latitud, 0);
  const sumLon = coordenadas.reduce((sum, c) => sum + c.longitud, 0);

  return {
    latitud: sumLat / coordenadas.length,
    longitud: sumLon / coordenadas.length,
  };
}

// ======================== Bounding Box ========================

export interface BoundingBox {
  latitudMin: number;
  latitudMax: number;
  longitudMin: number;
  longitudMax: number;
}

/**
 * Calcula el bounding box de un conjunto de coordenadas.
 * Utilizado para el zoom automático al seleccionar un lote.
 */
export function calcularBoundingBox(coordenadas: Coordenada[]): BoundingBox {
  if (coordenadas.length === 0) {
    return { latitudMin: 0, latitudMax: 0, longitudMin: 0, longitudMax: 0 };
  }

  let latMin = Infinity, latMax = -Infinity;
  let lonMin = Infinity, lonMax = -Infinity;

  for (const c of coordenadas) {
    latMin = Math.min(latMin, c.latitud);
    latMax = Math.max(latMax, c.latitud);
    lonMin = Math.min(lonMin, c.longitud);
    lonMax = Math.max(lonMax, c.longitud);
  }

  return {
    latitudMin: latMin,
    latitudMax: latMax,
    longitudMin: lonMin,
    longitudMax: lonMax,
  };
}

/**
 * Formatea una duración en segundos a formato "Xh Xm Xs".
 */
export function formatearDuracion(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Formatea el área en hectáreas de forma legible.
 */
export function formatearArea(hectareas: number | undefined | null): string {
  if (hectareas === undefined || hectareas === null) return '—';
  if (hectareas < 0.01) return `${(hectareas * 10000).toFixed(0)} m²`;
  return `${hectareas.toFixed(2)} ha`;
}
