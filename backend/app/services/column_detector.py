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
                opts = sorted(list(unique_vals))
                if "autoriza" in h_lower:
                    for def_opt in ["Sí, autorizo el tratamiento de mis datos personales.", "No autorizo el tratamiento de mis datos personales."]:
                        if def_opt not in opts:
                            opts.append(def_opt)
                column_options[h] = opts

        # 3. Configuraciones exactas personalizadas
        EXACT_CONFIGS = [
            {
                "match": lambda h: "tipo de documento" in h.lower() and "2." in h.lower(),
                "opciones": [
                    "Cedula de Ciudadania",
                    "Tarjeta de Identidad",
                    "Cedula de Extranjeria",
                    "Permiso de protección temporal",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: "municipio de nacimiento" in h.lower() or h.strip().startswith("5."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: h.strip().lower().startswith("6. sexo") or h.strip().lower() == "sexo",
                "opciones": [
                    "Femenino",
                    "Masculino",
                    "Intersexual",
                    "Prefiere no decir"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: "orientaci" in h.lower() and "sexual" in h.lower() and "7." in h.lower(),
                "opciones": [
                    "Heterosexual",
                    "Homosexual",
                    "Bisexual",
                    "No sabe / No responde",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: "identidad" in h.lower() and ("género" in h.lower() or "genero" in h.lower()) and "8." in h.lower(),
                "opciones": [
                    "Mujer",
                    "Hombre",
                    "Mujer trans",
                    "Hombre trans",
                    "NO BINARIO",
                    "No sabe / No responde",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: "libreta militar" in h.lower() and "9." in h.lower(),
                "opciones": [
                    "Si",
                    "No",
                    "Está en tramite",
                    "Prefiere no responder",
                    "No sabe"
                ],
                "obligatorio": False,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: ("étnico" in h.lower() or "etnico" in h.lower()) and "10." in h.lower(),
                "opciones": [
                    "Afrocolombiano",
                    "Negro",
                    "Raizal",
                    "Palenquero",
                    "INDIGENA",
                    "Rom o gitano",
                    "No",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: "consejo comunitario" in h.lower(),
                "opciones": None,
                "obligatorio": False,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: "pueblo ind" in h.lower() and "12." in h.lower(),
                "opciones": None,
                "obligatorio": False,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: "condici" in h.lower() and "discapacidad" in h.lower() and "13." in h.lower(),
                "opciones": [
                    "SI",
                    "NO"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: "tipo de discapacidad" in h.lower() and "14." in h.lower(),
                "opciones": [
                    "Física",
                    "Visual",
                    "Múltiple",
                    "Psicosocial",
                    "Intelectual",
                    "Ninguna",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: "direcci" in h.lower() and "15." in h.lower(),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: "zona" in h.lower() and "16." in h.lower(),
                "opciones": [
                    "Urbana",
                    "RURAL"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: ("barrio" in h.lower() or "vereda" in h.lower()) and "17." in h.lower(),
                "opciones": [
                    "Centro",
                    "Terronal",
                    "El Piñal",
                    "Villa Claudia",
                    "El Jardín",
                    "Valentín Ramos",
                    "Tres de Marzo",
                    "Alameda",
                    "Los Almendros",
                    "Bella Vista",
                    "San Fernando",
                    "Alfonso Caicedo Roa",
                    "Juan Ignacio",
                    "Cantarito",
                    "El Llanito",
                    "Chalo",
                    "Chiribico",
                    "Agua Azul",
                    "Primavera",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: "corregimiento" in h.lower() and "18." in h.lower(),
                "opciones": [
                    "La Arrobleda",
                    "No aplica (Reside en la cabecera municipal)"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: ("tel" in h.lower()) and "19." in h.lower(),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: ("correo" in h.lower() or "email" in h.lower()) and "20." in h.lower(),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: h.strip().startswith("21."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.NUMERO
            },
            {
                "match": lambda h: h.strip().startswith("22."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.NUMERO
            },
            {
                "match": lambda h: h.strip().startswith("23."),
                "opciones": ["0", "1", "2", "3", "4", "5", "Otros:"],
                "obligatorio": False,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("24."),
                "opciones": ["0", "1", "2", "3", "4", "5", "Otros:"],
                "obligatorio": False,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("25."),
                "opciones": ["0", "1", "2", "3", "4", "5", "Otros:"],
                "obligatorio": False,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("26."),
                "opciones": ["0", "1", "2", "3", "4", "5", "Otros:"],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("27."),
                "opciones": ["0", "1", "2", "3", "4", "5", "Otros:"],
                "obligatorio": False,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("28."),
                "opciones": ["0", "1", "2", "3", "4", "5", "Otros:"],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("29."),
                "opciones": ["0", "1", "2", "3", "4", "5", "Otros:"],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("30."),
                "opciones": [
                    "Heterosexual",
                    "Homosexual",
                    "Bisexual",
                    "Otra",
                    "Prefiere no responder"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("31."),
                "opciones": [
                    "Mujer",
                    "Hombre",
                    "Hombre-trans",
                    "Mujer- trans",
                    "No binario",
                    "Prefiere no responder",
                    "Otro"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("32."),
                "opciones": [
                    "Sí",
                    "No",
                    "No sabe",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("33."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.NUMERO
            },
            {
                "match": lambda h: h.strip().startswith("34."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.NUMERO
            },
            {
                "match": lambda h: h.strip().startswith("35."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.NUMERO
            },
            {
                "match": lambda h: h.strip().startswith("36."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.NUMERO
            },
            {
                "match": lambda h: h.strip().startswith("37."),
                "opciones": [
                    "Física",
                    "Visual",
                    "Múltiple",
                    "Intelectual",
                    "Psicosocial",
                    "Ninguna",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("38."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("39."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("40."),
                "opciones": [
                    "Sí",
                    "No",
                    "No sabe"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("41."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.NUMERO
            },
            {
                "match": lambda h: h.strip().startswith("42."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: h.strip().startswith("43."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: h.strip().startswith("44."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: h.strip().startswith("45."),
                "opciones": [
                    "Amenaza",
                    "Secuestro",
                    "Violencia sexual",
                    "Minas antipersonal",
                    "Homicidio familiar",
                    "Desaparición forzada",
                    "Reclutamiento forzado",
                    "Desplazamiento forzado",
                    "Despojo o abandono de tierras",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("46."),
                "opciones": [
                    "Física",
                    "Social",
                    "Familiar",
                    "Económica",
                    "Emocional o psicológica",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("47."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.NUMERO
            },
            {
                "match": lambda h: h.strip().startswith("48."),
                "opciones": [
                    "Casa",
                    "Apartamento",
                    "Habitación",
                    "Vivienda rural",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("49."),
                "opciones": [
                    "Propia",
                    "Arrendada",
                    "Familiar",
                    "Prestada",
                    "Ocupante de hecho"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("50."),
                "opciones": [
                    "Especial",
                    "Subsidiado",
                    "Contributivo",
                    "No afiliado"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("51."),
                "opciones": [
                    "Ninguno",
                    "Primaria incompleta",
                    "Primaria completa",
                    "Secundaria incompleta",
                    "Bachiller",
                    "Técnico",
                    "Tecnólogo",
                    "Profesional",
                    "Posgrado"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("52."),
                "opciones": [
                    "Empleado formal",
                    "Empleado informal",
                    "Independiente",
                    "Desempleado",
                    "Estudiante",
                    "Pensionado",
                    "Oficios del hogar"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("53."),
                "opciones": [
                    "Empleo formal",
                    "Empleo informal u ocasional",
                    "Trabajo independiente",
                    "Emprendimiento o negocio propio",
                    "Actividad agropecuaria, pecuaria o rural",
                    "Pensión",
                    "Subsidios o transferencias monetarias",
                    "Apoyo de familiares o terceros",
                    "No cuenta con ingresos",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("54."),
                "opciones": [
                    "Menos de un salario mínimo mensual legal vigente",
                    "Entre uno y dos salarios mínimos mensuales legales vigentes",
                    "Más de dos y hasta tres salarios mínimos mensuales legales vigentes",
                    "Más de tres salarios mínimos mensuales legales vigentes",
                    "Los ingresos son variables o no sabe",
                    "No cuenta con ingresos",
                    "Prefiere no responder"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("55."),
                "opciones": [
                    "Sí, totalmente",
                    "Sí, parcialmente",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("56."),
                "opciones": [
                    "Sí, se encuentra en funcionamiento",
                    "Sí, pero se encuentra temporalmente inactivo",
                    "No, pero tiene una idea de negocio",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("57."),
                "opciones": None,
                "obligatorio": True,
                "tipo": ColumnType.TEXTO
            },
            {
                "match": lambda h: h.strip().startswith("58."),
                "opciones": [
                    "Menos de seis meses",
                    "Entre seis meses y un año",
                    "Más de un año y hasta tres años",
                    "Más de tres años",
                    "Aún no ha iniciado",
                    "No aplica"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("59."),
                "opciones": [
                    "Una persona",
                    "De dos a tres personas",
                    "De cuatro a cinco personas",
                    "Más de cinco personas",
                    "No aplica"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("60."),
                "opciones": [
                    "Registro Único Tributario (RUT)",
                    "Matrícula o registro mercantil",
                    "Cuenta con ambos",
                    "Se encuentra en proceso de formalización",
                    "No cuenta con formalización",
                    "No aplica"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("61."),
                "opciones": [
                    "En la vivienda",
                    "En un local comercial",
                    "En el espacio público o de forma ambulante",
                    "En una parcela, finca o predio rural",
                    "Por medios digitales",
                    "No aplica",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("62."),
                "opciones": [
                    "Falta de capital o acceso a crédito",
                    "Falta de maquinaria, equipos, insumos o espacio",
                    "Falta de capacitación o asistencia técnica",
                    "Dificultades para comercializar productos o servicios",
                    "Falta de acceso a internet o herramientas digitales",
                    "Trámites, permisos o costos de formalización",
                    "Responsabilidades de cuidado en el hogar",
                    "Dificultades de transporte",
                    "Problemas de seguridad",
                    "Ninguna",
                    "No aplica",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("63."),
                "opciones": [
                    "Crédito de una entidad financiera o cooperativa",
                    "Microcrédito",
                    "Ahorros propios",
                    "Préstamo de familiares, amistades o prestamistas informales",
                    "Capital semilla, subsidio o incentivo institucional",
                    "No ha tenido acceso a financiación",
                    "No lo ha solicitado"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("64."),
                "opciones": [
                    "Formación para el trabajo o capacitación técnica",
                    "Capital semilla o acceso a crédito",
                    "Maquinaria, equipos, herramientas o insumos",
                    "Asistencia técnica y acompañamiento empresarial",
                    "Apoyo para comercialización y acceso a mercados",
                    "Formación y herramientas digitales",
                    "Apoyo para formalización",
                    "Fortalecimiento asociativo",
                    "Acceso a tierras o espacios productivos",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("65."),
                "opciones": [
                    "Realiza trabajos informales u ocasionales",
                    "Solicita préstamos o compra fiado",
                    "Recibe apoyo de familiares, comunidad u organizaciones",
                    "Accede a subsidios, ayudas humanitarias o programas sociales",
                    "Reduce el consumo de alimentos u otros gastos básicos",
                    "Vende bienes o utiliza sus ahorros",
                    "No aplica",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("66."),
                "opciones": [
                    "SALUD",
                    "EMPLEO",
                    "VIVIENDA",
                    "ALIMENTACIÓN",
                    "EMPRENDIMIENTO",
                    "EDUCACIÓN",
                    "GENERACIÓN DE INGRESOS",
                    "ATENCIÓN PSISOCIAL",
                    "MEJORAMIENTO DE VIVIENDA",
                    "ACCESO A PROGRAMAS SOCIALES",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("67."),
                "opciones": [
                    "SALUD",
                    "EMPLEO",
                    "VIVIENDA",
                    "ALIMENTACIÓN",
                    "EMPRENDIMIENTO",
                    "EDUCACIÓN",
                    "GENERACIÓN DE INGRESOS",
                    "ATENCIÓN PSISOCIAL",
                    "MEJORAMIENTO DE VIVIENDA",
                    "ACCESO A PROGRAMAS SOCIALES",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("68."),
                "opciones": [
                    "SALUD",
                    "EMPLEO",
                    "VIVIENDA",
                    "ALIMENTACIÓN",
                    "EMPRENDIMIENTO",
                    "EDUCACIÓN",
                    "GENERACIÓN DE INGRESOS",
                    "ATENCIÓN PSISOCIAL",
                    "MEJORAMIENTO DE VIVIENDA",
                    "ACCESO A PROGRAMAS SOCIALES",
                    "Otros:"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("69."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("70."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("71."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("72."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("73."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("74."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("75."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: h.strip().startswith("76."),
                "opciones": [
                    "Sí",
                    "No"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            },
            {
                "match": lambda h: "califica la atención" in h.lower() or "califica la atencion" in h.lower(),
                "opciones": [
                    "1",
                    "2",
                    "3",
                    "4",
                    "5"
                ],
                "obligatorio": True,
                "tipo": ColumnType.OPCION
            }
        ]

        # 4. Mapear configuraciones por defecto
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
            
            # Verificar si existe configuración exacta
            exact_match = next((cfg for cfg in EXACT_CONFIGS if cfg["match"](h)), None)
            
            if exact_match:
                tipo = exact_match["tipo"]
                opciones = exact_match["opciones"]
                obligatorio = exact_match["obligatorio"]
            else:
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
