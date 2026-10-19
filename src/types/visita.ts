export type EstadoVisita = 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | 'REPROGRAMADA';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface VisitaImagen {
  id: string;
  imagenUrl: string;
  url?: string;
  notas?: string;
  loteId?: string;
  loteNombre?: string;
  analisisId?: string;
  diagnosticoId?: string;
  enfermedadDetectada?: string;
  confianza?: string;
  confianzaDiagnostico?: number;
  tieneEnfermedad?: boolean;
  observaciones?: string;
  createdAt: string;
  analisisStatus?: 'pendiente' | 'analizando' | 'no_disponible' | 'completado' | 'error';
}

export interface AnalisisImagenResult {
  status: 'ok' | 'no_disponible' | 'no_concluyente' | 'error';
  mensaje: string;
  imagenId: string;
  analisisId?: string;
  enfermedadDetectada?: string;
  nombreCientifico?: string;
  confianza?: string;
  severidad?: string;
  modelVersion?: string;
  fechaAnalisis?: string;
}

export interface BorradorVisita {
  visitaId: string;
  observaciones?: string;
  recomendaciones?: string;
  plantasRevisadas?: string;
  plantasEnfermas?: string;
  informeFinal?: string;
  guardadoEn: string;
}

export interface VisitaResumen {
  id: string;
  estado: EstadoVisita;
  fechaProgramada: string;
  duracionEstimadaMin?: number;
  motivo?: string;
  fincaId: string;
  fincaNombre: string;
  fincaMunicipio: string;
  agricultorNombre: string;
  loteId?: string;
  loteNombre?: string;
  loteVariedadCacao?: string;
  createdAt: string;
}

export interface VisitaDetalle extends VisitaResumen {
  notasPrevias?: string;
  agricultorId?: string;
  agricultorTelefono?: string;
  fincaDepartamento?: string;
  fincaVereda?: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  duracionRealMin?: number;
  observaciones?: string;
  recomendaciones?: string;
  plantasRevisadas?: number;
  plantasEnfermas?: number;
  informeFinal?: string;
  motivoCancelacion?: string;
  totalImagenes: number;
  imagenes?: VisitaImagen[];
  updatedAt?: string;
}

export interface CrearVisitaRequest {
  fincaId: string;
  loteId?: string;
  fechaProgramada: string; // ISO-8601 string
  duracionEstimadaMin?: number;
  motivo?: string;
  notasPrevias?: string;
}

export interface ReprogramarVisitaRequest {
  fechaProgramada: string;
  duracionEstimadaMin?: number;
  motivo?: string;
  notasPrevias?: string;
}

export interface CancelarVisitaRequest {
  motivoCancelacion: string;
}

export interface FinalizarVisitaRequest {
  observaciones?: string;
  recomendaciones?: string;
  plantasRevisadas?: number;
  plantasEnfermas?: number;
  informeFinal?: string;
}

export interface AgronomoInfo {
  nombre: string;
  fincasAsignadas: number;
}

export interface ContadoresInfo {
  programadas: number;
  enCurso: number;
  completadasMes: number;
}

export interface ProximaVisitaInfo {
  id: string;
  estado: EstadoVisita;
  fechaProgramada: string;
  fincaNombre: string;
  fincaMunicipio: string;
  agricultorNombre: string;
  loteNombre?: string;
  motivo?: string;
}

export interface AgronomoDashboardData {
  agronomo: AgronomoInfo;
  contadores: ContadoresInfo;
  proximasVisitas: ProximaVisitaInfo[];
}

export interface FincaAgronomo {
  id: string;
  nombre: string;
  departamento: string;
  municipio: string;
  vereda?: string;
  areaTotalHectareas?: number;
  descripcion?: string;
  activa: boolean;
  totalLotes: number;
  createdAt: string;
}

export interface LoteResumen {
  id: string;
  nombre: string;
  areaHectareas?: number;
  variedadCacao?: string;
  anoSiembra?: number;
  activo: boolean;
}

export interface FincaDetalleAgronomo extends FincaAgronomo {
  agricultorId: string;
  agricultorNombre: string;
  agricultorTelefono?: string;
  lotes: LoteResumen[];
}

// ======================== Visitas para el agricultor (MA-20) ========================

export interface VisitaAgricultorResumen {
  id: string;
  estado: EstadoVisita;
  fechaProgramada: string;
  duracionEstimadaMin?: number;
  motivo?: string;
  fincaId: string;
  fincaNombre: string;
  fincaMunicipio: string;
  agronomoNombre: string;
  loteId?: string;
  loteNombre?: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  duracionRealMin?: number;
  recomendaciones?: string;
  plantasRevisadas?: number;
  plantasEnfermas?: number;
  createdAt: string;
}

export interface ProximaVisitaAgricultor {
  id: string;
  estado: EstadoVisita;
  fechaProgramada: string;
  fincaNombre: string;
  agronomoNombre: string;
  motivo?: string;
  loteNombre?: string;
}

export interface VisitasAgricultorDashboard {
  proximasVisitas: number;
  completadasTotal: number;
  proximas: ProximaVisitaAgricultor[];
}
