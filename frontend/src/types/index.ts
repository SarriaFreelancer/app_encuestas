export interface User {
  usuario: string;
  nombre: string;
  correo: string;
  rol: 'ADMIN' | 'USUARIO';
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface ColumnConfig {
  campo: string;
  tipo: 'texto' | 'numero' | 'opcion' | 'fecha';
  es_pregunta: boolean;
  es_identificador: boolean;
  autocompletar: boolean;
  editable: boolean;
  obligatorio: boolean;
  opciones?: string[];
}

export interface SurveyMetadata {
  columnas: string[];
  configuraciones: ColumnConfig[];
  siguiente_pregunta: string;
  preguntas_existentes: string[];
  identificador_campo: string;
}

export interface DashboardStats {
  total_registros: number;
  total_personas: number;
  total_encuestas: number;
  registros_recientes: Record<string, any>[];
  por_ciudad: { ciudad: string; cantidad: number }[];
  por_estado: { estado: string; cantidad: number }[];
  por_categoria: { categoria: string; cantidad: number }[];
  estadisticas_preguntas: Record<string, { opcion: string; cantidad: number }[]>;
}

export interface AIQueryResponse {
  pregunta: string;
  respuesta: string;
  datos_resultado?: Record<string, any>[];
  resumen_estadistico?: Record<string, any>;
}
