from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import io
import json
import pandas as pd

from app.schemas import (
    LoginRequest, TokenResponse, UserPublic, SurveyMetadata, 
    SurveyResponseCreate, SurveyResponseUpdate, AIQueryRequest, AIQueryResponse
)
from app.repositories.base import BaseRepository
from app.repositories.sheets_repository import PermissiveSheetsRepository
from app.services.auth_service import (
    get_repository, authenticate_user, create_access_token, get_current_user
)
from app.services.column_detector import ColumnDetectorService
from app.services.dashboard_service import DashboardAnalyticsService
from app.services.ai_service import AIService
from app.services.audit_service import AuditService
from app.services.excel_inspector import analyze_excel_file
from app.services.crosstab_engine import DynamicCrosstabEngine

app = FastAPI(
    title="Plataforma de Encuestas API - Permisiva 100%",
    description="Carga y procesamiento permisivo total de Excel conservando celdas vacías y todos los tipos de datos",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

audit_service = AuditService()

# --- AUTENTICACIÓN ---
@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, repo: BaseRepository = Depends(get_repository)):
    user_db = authenticate_user(repo, req.usuario, req.contrasena)
    token = create_access_token(data={"sub": user_db.usuario, "rol": user_db.rol.value})
    user_pub = UserPublic(
        usuario=user_db.usuario,
        nombre=user_db.nombre,
        correo=user_db.correo,
        rol=user_db.rol,
        estado=user_db.estado
    )
    return TokenResponse(access_token=token, user=user_pub)

@app.get("/api/auth/me", response_model=UserPublic)
def get_me(current_user: UserPublic = Depends(get_current_user)):
    return current_user

# --- ASISTENTE DE IMPORTACIÓN EXCEL 100% PERMISIVO ---
@app.post("/api/importacion/inspeccionar")
async def inspeccionar_excel(
    file: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Inspecciona 100% de las filas y columnas del Excel sin omitir ningún dato.
    """
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Formato no soportado. Suba un archivo .xlsx o .xls")

    contents = await file.read()
    buffer = io.BytesIO(contents)

    analysis = analyze_excel_file(buffer)
    
    numbered_cols = []
    for idx, col_info in enumerate(analysis["columnas"], start=1):
        col_info["numero_columna"] = idx
        col_info["nombre_numerado"] = f"[{idx}] {col_info['columna']}"
        numbered_cols.append(col_info)

    analysis["columnas"] = numbered_cols
    return analysis

@app.post("/api/importacion/procesar")
async def procesar_importacion(
    file: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_user),
    repo: PermissiveSheetsRepository = Depends(get_repository)
):
    """
    Carga Permisiva 100%: Lee todas las celdas como texto crudo, preservando vacíos y duplicados.
    """
    contents = await file.read()
    # Leer como cadena cruda para conservar todo
    df = pd.read_excel(io.BytesIO(contents), dtype=str)
    df = df.fillna("")

    headers_exactos = [str(c).strip() for c in df.columns]
    records = df.to_dict(orient="records")

    total_cargados = repo.replace_all_data(headers_exactos, records)

    audit_service.log_change(
        usuario=current_user.usuario,
        registro_afectado=file.filename,
        campos_modificados={"total_filas_cargadas": total_cargados, "total_columnas": len(headers_exactos)}
    )

    return {
        "message": "Importación completada exitosamente. Se cargó el 100% de la información del Excel.",
        "registros_procesados": len(records),
        "registros_insertados": total_cargados,
        "total_columnas": len(headers_exactos)
    }

# --- METADATOS Y COLUMNAS ---
@app.get("/api/encuestas/metadatos")
def get_metadata(repo: BaseRepository = Depends(get_repository)):
    headers = repo.get_headers("RESPUESTAS")
    detector = ColumnDetectorService(repo)
    meta = detector.get_survey_metadata()

    numbered_headers = [f"[{idx}] {h}" for idx, h in enumerate(headers, start=1)]

    return {
        "columnas": headers,
        "columnas_numeradas": numbered_headers,
        "configuraciones": meta.configuraciones,
        "siguiente_pregunta": meta.siguiente_pregunta,
        "identificador_campo": meta.identificador_campo
    }

# --- CRUCE DE VARIABLES ---
@app.get("/api/analisis/crosstab")
def get_crosstab(
    col_a: str = Query(...),
    col_b: str = Query(...),
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    rows = repo.get_all_responses()
    if not rows:
        raise HTTPException(status_code=400, detail="No hay datos para realizar el cruce")

    df = pd.DataFrame(rows)
    return DynamicCrosstabEngine.compute_crosstab(df, col_a, col_b)

# --- BÚSQUEDA Y FORMULARIO ---
@app.get("/api/encuestas/buscar/{cedula}")
def buscar_por_cedula(cedula: str, repo: BaseRepository = Depends(get_repository)):
    detector = ColumnDetectorService(repo)
    meta = detector.get_survey_metadata()
    registro = repo.get_response_by_id(meta.identificador_campo, cedula)
    
    if registro:
        return {"encontrado": True, "datos": registro}
    return {"encontrado": False, "mensaje": "No encontramos información asociada a esta cédula."}

@app.post("/api/encuestas/respuestas")
def crear_respuesta(payload: SurveyResponseCreate, repo: BaseRepository = Depends(get_repository)):
    nuevo = repo.add_response(payload.datos)
    return {"message": "Registro guardado correctamente", "registro": nuevo}

@app.put("/api/encuestas/respuestas/{fila_index}")
def actualizar_respuesta(
    fila_index: int,
    payload: SurveyResponseUpdate,
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    actualizado = repo.update_response(fila_index, payload.datos)
    return {"message": "Registro actualizado correctamente.", "registro": actualizado}

@app.get("/api/encuestas/respuestas")
def obtener_respuestas(
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    return repo.get_all_responses()

# --- DASHBOARD DINÁMICO ---
@app.get("/api/dashboard/stats")
def dashboard_stats(
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    dash_service = DashboardAnalyticsService(repo)
    return dash_service.calculate_dashboard_stats()

# --- CONSULTA INTELIGENTE (IA) ---
@app.post("/api/ai/consulta", response_model=AIQueryResponse)
def ai_query(
    req: AIQueryRequest,
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    ai_service = AIService(repo)
    return ai_service.query(req.pregunta)

# --- AUDITORÍA & HISTORIAL ---
@app.get("/api/auditoria")
def get_audit_logs(current_user: UserPublic = Depends(get_current_user)):
    if current_user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acceso no autorizado.")
    return audit_service.get_logs()

# --- USUARIOS ---
@app.get("/api/usuarios", response_model=List[UserPublic])
def list_users(
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    if current_user.rol != "ADMIN":
        raise HTTPException(status_code=403, detail="Acceso denegado.")
    users = repo.get_users()
    return [
        UserPublic(
            usuario=u.usuario,
            nombre=u.nombre,
            correo=u.correo,
            rol=u.rol,
            estado=u.estado
        ) for u in users
    ]
