export interface RecomendacionItem {
  id: string;
  tipo: 'rojo' | 'naranja' | 'cafe' | 'verde';
  titulo: string;
  descripcion: string;
}

export interface DiagnosticoResult {
  id?: string;
  imagenUrl: string;
  tieneEnfermedad: boolean;
  nombreEnfermedad: string;
  nombreCientifico: string;
  confianza: string;
  severidad: string;
  recomendaciones: RecomendacionItem[];
  createdAt?: string;
}

export interface AnalisisRequestPayload {
  imagenUri: string;
  simulacionTipo?: 'AUTO' | 'ENFERMA' | 'SANA' | 'ESCOBA';
}
