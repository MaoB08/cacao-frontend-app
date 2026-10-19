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
  codigoClase: string;           // "healthy", "monilia_m1", "monilia_m2", "monilia_m3"
  probabilidad: number;          // valor numérico [0.0, 1.0]
  confianza: string;
  severidad: string;
  modelVersion: string;          // "monilia-efficientnet_b0-0.1.0"
  concluyente: boolean;          // true si status == "ok", false si "not_conclusive"
  recomendaciones: RecomendacionItem[];
  createdAt?: string;
}
