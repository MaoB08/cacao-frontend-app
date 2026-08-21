/**
 * Tipos e interfaces para el módulo geográfico de CacaoScan.
 * Modela Fincas, Lotes, Inspecciones, Detecciones y coordenadas GPS.
 */

// ======================== Coordenadas ========================

export interface Coordenada {
  latitud: number;
  longitud: number;
}

export interface CoordenadaGPS extends Coordenada {
  altitud?: number;
  precision?: number; // accuracy en metros
  velocidad?: number; // m/s
  timestamp: number;
}

// ======================== Finca ========================

export interface Finca {
  id: string;
  nombre: string;
  departamento?: string;
  municipio?: string;
  vereda?: string;
  areaTotalHectareas?: number;
  descripcion?: string;
  activa: boolean;
  totalLotes: number;
  createdAt: string;
}

export interface FincaDetalle extends Finca {
  lotes: LoteResumen[];
}

export interface CrearFincaRequest {
  nombre: string;
  departamento?: string;
  municipio?: string;
  vereda?: string;
  descripcion?: string;
}

// ======================== Lote ========================

export type EstadoLote = 'ACTIVO' | 'INACTIVO' | 'EN_RENOVACION' | 'ABANDONADO';

export interface LoteResumen {
  id: string;
  nombre: string;
  variedadCacao?: string;
  areaHectareas?: number;
  colorHex: string;
  estado: EstadoLote;
  totalInspecciones: number;
  totalDetecciones: number;
  createdAt: string;
}

export interface LoteDetalle extends LoteResumen {
  fincaId: string;
  fincaNombre: string;
  anoSiembra?: number;
  numeroPlantas?: number;
  perimetroMetros?: number;
  coordenadas: Coordenada[];
  notas?: string;
  ultimaInspeccion?: string;
  resumenEnfermedades: Record<string, number>;
}

export interface LoteMapa {
  id: string;
  nombre: string;
  areaHectareas?: number;
  colorHex: string;
  estado: EstadoLote;
  coordenadas: Coordenada[];
  detecciones: DeteccionMarker[];
}

export interface CrearLoteRequest {
  fincaId: string;
  nombre: string;
  variedadCacao?: string;
  anoSiembra?: number;
  numeroPlantas?: number;
  coordenadas: Coordenada[];
  colorHex?: string;
  notas?: string;
}

export interface ActualizarLoteRequest {
  nombre?: string;
  variedadCacao?: string;
  anoSiembra?: number;
  numeroPlantas?: number;
  colorHex?: string;
  estado?: EstadoLote;
  notas?: string;
}

// ======================== Inspección ========================

export type EstadoInspeccion = 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';

export interface Inspeccion {
  id: string;
  loteId: string;
  loteNombre: string;
  usuarioNombre: string;
  fechaInspeccion: string;
  plantasInspeccionadas: number;
  plantasEnfermas: number;
  totalEnfermedades: number;
  observaciones?: string;
  estado: EstadoInspeccion;
  duracionMinutos?: number;
  createdAt: string;
}

export interface InspeccionDetalle extends Inspeccion {
  detecciones: Deteccion[];
}

export interface CrearInspeccionRequest {
  loteId: string;
  plantasInspeccionadas: number;
  plantasEnfermas: number;
  observaciones?: string;
  duracionMinutos?: number;
}

// ======================== Detección Georreferenciada ========================

export interface Deteccion {
  id: string;
  loteId?: string;
  loteNombre?: string;
  inspeccionId?: string;
  enfermedad: string;
  porcentajeConfianza: number;
  severidad?: string;
  imagenUrl?: string;
  latitud: number;
  longitud: number;
  observaciones?: string;
  fechaDeteccion: string;
}

/** DTO ligero para renderizar Markers en el mapa */
export interface DeteccionMarker {
  id: string;
  enfermedad: string;
  porcentajeConfianza: number;
  severidad?: string;
  latitud: number;
  longitud: number;
  fechaDeteccion: string;
}

export interface CrearDeteccionRequest {
  inspeccionId?: string;
  enfermedad: string;
  porcentajeConfianza: number;
  severidad?: string;
  imagenUrl?: string;
  latitud: number;
  longitud: number;
  observaciones?: string;
}

// ======================== Colores de enfermedades ========================

/** Mapeo de colores para marcadores de enfermedades en el mapa */
export const COLORES_ENFERMEDAD: Record<string, string> = {
  'Monilia': '#FF9800',
  'Moniliasis': '#FF9800',
  'Escoba de Bruja': '#F44336',
  'Mazorca Negra': '#7B1FA2',
  'Phytophthora': '#7B1FA2',
  'Sana': '#4CAF50',
  'Desconocida': '#9E9E9E',
};

export const getColorEnfermedad = (enfermedad: string): string => {
  const normalizada = enfermedad.trim();
  return COLORES_ENFERMEDAD[normalizada] || '#9E9E9E';
};

// ======================== Estado del GPS Tracker ========================

export type EstadoGPS = 'idle' | 'tracking' | 'paused' | 'finished';

export interface GpsTrackerState {
  estado: EstadoGPS;
  coordenadas: CoordenadaGPS[];
  distanciaTotal: number; // metros
  areaAproximada: number; // hectáreas
  precisionActual: number; // metros
  tiempoInicio?: number;
  duracionSegundos: number;
}
