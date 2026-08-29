import re
from typing import List, Dict, Any
from app.repositories.base import BaseRepository
from app.schemas import ColumnConfig, ColumnType, SurveyMetadata

class ColumnDetectorService:
    """
    Servicio Inteligente de Detección de Columnas y Numeración Automática.
    Analiza la primera fila (encabezados) de la hoja para determinar:
    - Identificador principal (ej. CÉDULA)
    - Preguntas existentes y numeración consecutiva automática (ej. PREGUNTA 4 -> PREGUNTA 5)
    - Configuración por defecto de cada columna.
    """

    def __init__(self, repository: BaseRepository):
        self.repository = repository

    def get_survey_metadata(self) -> SurveyMetadata:
        headers = self.repository.get_headers("RESPUESTAS")
        
        # 1. Detectar preguntas y su numeración más alta
        preguntas = []
        max_num = 0

        # Patrón para encontrar 'PREGUNTA X' o 'Pregunta X' o 'P X'
        pattern = re.compile(r'PREGUNTA\s*(\d+)', re.IGNORECASE)

        for h in headers:
            match = pattern.search(h)
            if match:
                preguntas.append(h)
                num = int(match.group(1))
                if num > max_num:
                    max_num = num

        # Si no había preguntas numeradas pero hay preguntas en texto
        siguiente_num = max_num + 1 if max_num > 0 else 2
        siguiente_pregunta = f"PREGUNTA {siguiente_num}"

        # 2. Mapear configuraciones por defecto
        configs = []
        identificador = "CÉDULA" # Valor por defecto preferido

        for h in headers:
            h_upper = h.upper()
            es_id = "CÉDULA" in h_upper or "CEDULA" in h_upper or "DOCUMENTO" in h_upper or "ID" == h_upper
            if es_id:
                identificador = h

            es_preg = bool(pattern.search(h)) or "PREGUNTA" in h_upper
            autocompletar = h_upper in ["NOMBRE", "APELLIDO", "TELÉFONO", "TELEFONO", "CORREO", "CIUDAD"]
            
            tipo = ColumnType.TEXTO
            if "FECHA" in h_upper:
                tipo = ColumnType.FECHA
            elif "CÉDULA" in h_upper or "TELÉFONO" in h_upper:
                tipo = ColumnType.NUMERO

            configs.append(
                ColumnConfig(
                    campo=h,
                    tipo=tipo,
                    es_pregunta=es_preg,
                    es_identificador=es_id,
                    autocompletar=autocompletar,
                    editable=not es_id,
                    obligatorio=es_id or autocompletar
                )
            )

        return SurveyMetadata(
            columnas=headers,
            configuraciones=configs,
            siguiente_pregunta=siguiente_pregunta,
            preguntas_existentes=preguntas,
            identificador_campo=identificador
        )

    def auto_add_next_question(self) -> str:
        metadata = self.get_survey_metadata()
        nueva_columna = metadata.siguiente_pregunta
        self.repository.add_column_if_not_exists(nueva_columna)
        return nueva_columna
