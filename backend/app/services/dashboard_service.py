from typing import List, Dict, Any
import pandas as pd
from app.repositories.base import BaseRepository

class DashboardAnalyticsService:
    """
    Calcula dinámicamente indicadores, KPIs y estadísticas sin asumir columnas fijas.
    """

    def __init__(self, repository: BaseRepository):
        self.repository = repository

    def calculate_dashboard_stats(self) -> Dict[str, Any]:
        rows = self.repository.get_all_responses()
        headers = self.repository.get_headers("RESPUESTAS")

        if not rows:
            return {
                "total_registros": 0,
                "total_personas": 0,
                "total_encuestas": len([h for h in headers if "PREGUNTA" in h.upper()]),
                "registros_recientes": [],
                "por_ciudad": [],
                "por_estado": [],
                "por_categoria": [],
                "estadisticas_preguntas": {}
            }

        df = pd.DataFrame(rows)
        # Quitar columna interna si existe
        if "__row_index" in df.columns:
            df_data = df.drop(columns=["__row_index"])
        else:
            df_data = df.copy()

        total_registros = len(df_data)

        # 1. Total de personas (basado en CÉDULA o identificador único)
        col_cedula = next((c for c in df_data.columns if "CÉDULA" in c.upper() or "CEDULA" in c.upper()), None)
        if col_cedula:
            total_personas = int(df_data[col_cedula].nunique())
        else:
            total_personas = total_registros

        # 2. Total de encuestas (preguntas disponibles)
        cols_preguntas = [c for c in df_data.columns if "PREGUNTA" in c.upper()]
        total_encuestas = len(cols_preguntas)

        # 3. Registros por ciudad
        col_ciudad = next((c for c in df_data.columns if "CIUDAD" in c.upper()), None)
        por_ciudad = []
        if col_ciudad and col_ciudad in df_data.columns:
            ciudad_counts = df_data[col_ciudad].value_counts().to_dict()
            por_ciudad = [{"ciudad": k if k else "Sin especificar", "cantidad": v} for k, v in ciudad_counts.items()]

        # 4. Registros por estado
        col_estado = next((c for c in df_data.columns if "ESTADO" in c.upper()), None)
        por_estado = []
        if col_estado and col_estado in df_data.columns:
            estado_counts = df_data[col_estado].value_counts().to_dict()
            por_estado = [{"estado": k if k else "Sin especificar", "cantidad": v} for k, v in estado_counts.items()]

        # 5. Registros por categorías
        col_categoria = next((c for c in df_data.columns if "CATEGORÍA" in c.upper() or "CATEGORIA" in c.upper()), None)
        por_categoria = []
        if col_categoria and col_categoria in df_data.columns:
            cat_counts = df_data[col_categoria].value_counts().to_dict()
            por_categoria = [{"categoria": k if k else "General", "cantidad": v} for k, v in cat_counts.items()]

        # 6. Estadísticas de preguntas
        estadisticas_preguntas = {}
        for col_p in cols_preguntas:
            val_counts = df_data[col_p].value_counts().to_dict()
            estadisticas_preguntas[col_p] = [
                {"opcion": str(k) if k else "Sin respuesta", "cantidad": int(v)} 
                for k, v in val_counts.items()
            ]

        # 7. Registros recientes (últimos 5)
        registros_recientes = rows[-5:][::-1]

        return {
            "total_registros": total_registros,
            "total_personas": total_personas,
            "total_encuestas": total_encuestas,
            "registros_recientes": registros_recientes,
            "por_ciudad": por_ciudad,
            "por_estado": por_estado,
            "por_categoria": por_categoria,
            "estadisticas_preguntas": estadisticas_preguntas
        }
