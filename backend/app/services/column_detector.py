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
        all_responses = self.repository.get_all_responses()
        
        # 1. Detectar preguntas y su numeración más alta
        preguntas = []
        max_num = 0

        pattern = re.compile(r'PREGUNTA\s*(\d+)', re.IGNORECASE)

        for h in headers:
            match = pattern.search(h)
            if match:
                preguntas.append(h)
                num = int(match.group(1))
                if num > max_num:
                    max_num = num

        siguiente_num = max_num + 1 if max_num > 0 else 2
        siguiente_pregunta = f"PREGUNTA {siguiente_num}"

        # 2. Mapear opciones únicas para cada columna a partir de los datos registrados
        column_options: Dict[str, List[str]] = {}
        for h in headers:
            h_lower = h.lower()
            unique_vals = set()
            is_multi = "puede marcar" in h_lower or "varias opciones" in h_lower

            for r in all_responses:
                val = str(r.get(h, "")).strip()
                if val and val.lower() not in ["", "none", "nan", "null"]:
                    if is_multi:
                        parts = [p.strip() for p in val.split(",") if p.strip()]
                        for p in parts:
                            unique_vals.add(p)
                    else:
                        unique_vals.add(val)

            # Si es un campo categórico con opciones finitas (entre 2 y 35 opciones distintas)
            is_id_or_free = any(k in h_lower for k in [
                "nombre", "cédula", "cedula", "documento", "número de documento", "numero de documento",
                "teléfono", "telefono", "correo", "dirección", "direccion", "marca temporal"
            ])

            if (1 < len(unique_vals) <= 35 and not is_id_or_free) or is_multi or "autoriza" in h_lower or "sexo" in h_lower or "zona" in h_lower or "régimen" in h_lower or "regimen" in h_lower:
                column_options[h] = sorted(list(unique_vals))

        # 3. Mapear configuraciones por defecto
        configs = []
        identificador = "NÚMERO DE DOCUMENTO"

        for h in headers:
            h_upper = h.upper()
            h_lower = h.lower()
            
            es_id = ("DOCUMENTO" in h_upper or "CÉDULA" in h_upper or "CEDULA" in h_upper) and "TIPO" not in h_upper
            if es_id:
                identificador = h

            es_preg = bool(pattern.search(h)) or bool(re.match(r'^\d+\.', h.strip())) or "PREGUNTA" in h_upper
            es_multi = "puede marcar" in h_lower or "varias opciones" in h_lower
            
            # Detectar tipo de control
            opciones = column_options.get(h)
            if opciones and len(opciones) > 0:
                tipo = ColumnType.OPCION
            elif "FECHA" in h_upper or "NACIMIENTO" in h_upper:
                tipo = ColumnType.FECHA
            elif "EDAD" in h_upper or "NÚMERO" in h_upper or "TELEFONO" in h_upper or "TELÉFONO" in h_upper:
                tipo = ColumnType.NUMERO
            else:
                tipo = ColumnType.TEXTO

            # Campos obligatorios clave
            obligatorio = es_id or any(k in h_lower for k in [
                "nombre completo", "tipo de documento", "fecha de nacimiento", "edad",
                "sexo", "zona", "autoriza el tratamiento", "hecho victimizante"
            ])

            configs.append(
                ColumnConfig(
                    campo=h,
                    tipo=tipo,
                    es_pregunta=es_preg,
                    es_identificador=es_id,
                    autocompletar=es_id or ("nombre" in h_lower),
                    editable=True,
                    obligatorio=obligatorio,
                    opciones=opciones
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
