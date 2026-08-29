import re
from typing import Dict, Any, List
import pandas as pd
from app.repositories.base import BaseRepository

class AIService:
    """
    Servicio de inteligencia artificial para realizar consultas sobre las encuestas en lenguaje natural.
    IMPORTANTE: La IA procesa y analiza los datos mediante consultas estructuradas en el backend.
    NO se entregan credenciales ni acceso directo a Google Sheets a la IA.
    """

    def __init__(self, repository: BaseRepository):
        self.repository = repository

    def query(self, question: str) -> Dict[str, Any]:
        rows = self.repository.get_all_responses()
        if not rows:
            return {
                "pregunta": question,
                "respuesta": "No hay datos registrados actualmente en las encuestas para realizar el análisis.",
                "datos_resultado": []
            }

        df = pd.DataFrame(rows)
        q_clean = question.strip().lower()

        # Detección de patrones en lenguaje natural
        # Ej. "¿Cuántas personas de Cali respondieron Sí en la pregunta 5?"
        # Ej. "¿Cuántos registros hay?"
        # Ej. "¿Cuál es la ciudad con más registros?"

        if "cuántos registros" in q_clean or "total de registros" in q_clean:
            total = len(df)
            return {
                "pregunta": question,
                "respuesta": f"Actualmente hay un total de **{total}** registros en la base de encuestas.",
                "resumen_estadistico": {"total_registros": total}
            }

        if "ciudad con más" in q_clean or "ciudad principal" in q_clean:
            col_ciudad = next((c for c in df.columns if "CIUDAD" in c.upper()), None)
            if col_ciudad:
                top_ciudad = df[col_ciudad].value_counts().idxmax()
                cant = df[col_ciudad].value_counts().max()
                return {
                    "pregunta": question,
                    "respuesta": f"La ciudad con más registros es **{top_ciudad}** con **{cant}** encuestas.",
                    "resumen_estadistico": {"ciudad": top_ciudad, "cantidad": int(cant)}
                }

        # Búsqueda dinámica con múltiples condiciones (Ciudad + Pregunta + Respuesta)
        # Extraer ciudad mencionada
        ciudades = ["cali", "bogotá", "bogota", "medellín", "medellin", "barranquilla"]
        ciudad_encontrada = next((c for c in ciudades if c in q_clean), None)

        # Extraer número de pregunta
        match_p = re.search(r'pregunta\s*(\d+)', q_clean)
        num_pregunta = match_p.group(1) if match_p else None

        df_filtered = df.copy()

        if ciudad_encontrada:
            col_ciudad = next((c for c in df.columns if "CIUDAD" in c.upper()), None)
            if col_ciudad:
                df_filtered = df_filtered[df_filtered[col_ciudad].str.lower() == ciudad_encontrada.lower()]

        if num_pregunta:
            col_p = next((c for c in df.columns if f"PREGUNTA {num_pregunta}" in c.upper()), None)
            if col_p and "sí" in q_clean or "si" in q_clean:
                df_filtered = df_filtered[df_filtered[col_p].str.lower().isin(["sí", "si"])]

        conteo = len(df_filtered)
        
        # Armar respuesta natural explicativa
        detalles = []
        if ciudad_encontrada:
            detalles.append(f"de la ciudad de {ciudad_encontrada.capitalize()}")
        if num_pregunta:
            detalles.append(f"en la Pregunta {num_pregunta}")

        detalle_txt = " ".join(detalles) if detalles else "según el filtro consultado"
        respuesta_texto = f"Se encontraron **{conteo}** personas {detalle_txt}."

        return {
            "pregunta": question,
            "respuesta": respuesta_texto,
            "datos_resultado": df_filtered.to_dict(orient="records")[:10]
        }
