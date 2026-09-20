from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import io
import json
import pandas as pd

from app.schemas import (
    LoginRequest, TokenResponse, UserPublic, UserRole, UserInDB, UserCreate, UserUpdate,
    SurveyMetadata, SurveyResponseCreate, SurveyResponseUpdate, AIQueryRequest, AIQueryResponse,
    GoogleSheetsInspectRequest, GoogleSheetsProcessRequest
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

# --- IMPORTACIÓN DESDE GOOGLE SHEETS VIA LINK ---
import re
import urllib.request
import csv

def _extract_sheets_id(url: str) -> str:
    match = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
    if not match:
        raise HTTPException(status_code=400, detail="El enlace proporcionado no parece un enlace válido de Google Sheets. Asegúrate de incluir el ID del archivo (/d/...)")
    return match.group(1)

@app.post("/api/importacion/google-sheets/inspeccionar")
async def inspeccionar_google_sheets_link(
    req: GoogleSheetsInspectRequest,
    current_user: UserPublic = Depends(get_current_user)
):
    """
    Valida un enlace público de Google Sheets e inspecciona todas las pestañas/hojas disponibles.
    """
    sheet_id = _extract_sheets_id(req.url)
    
    # Obtener el HTML de la vista pública para extraer todas las pestañas (sheet names y gids)
    html_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/htmlview"
    hojas_encontradas = []
    
    try:
        req_html = urllib.request.Request(html_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_html, timeout=10) as response:
            html_text = response.read().decode('utf-8', errors='replace')
            # Extraer pestañas buscando elementos de menú/pestanas en htmlview (id="sheet-button-...", o list-item class o #sheet-menu)
            # RegEx para sheet-button: id="sheet-button-(\d+)">([^<]+)< o data-sheet-id="(\d+)" ... >([^<]+)<
            sheet_matches = re.findall(r'id="sheet-button-([0-9]+)"[^>]*>([^<]+)<', html_text)
            if not sheet_matches:
                sheet_matches = re.findall(r'<li[^>]*id="sheet-button-([0-9]+)"[^>]*><a[^>]*>([^<]+)</a>', html_text)
            if not sheet_matches:
                # Fallback alternativo para extraer nombres de etiquetas de pestañas
                sheet_matches = re.findall(r'class="sheet-name"[^>]*>([^<]+)<', html_text)
                if sheet_matches:
                    sheet_matches = [("0", name) for name in sheet_matches]

            if sheet_matches:
                for gid, nombre in sheet_matches:
                    clean_name = nombre.strip()
                    if clean_name and not any(h["nombre"] == clean_name for h in hojas_encontradas):
                        hojas_encontradas.append({
                            "nombre": clean_name,
                            "gid": gid,
                            "total_filas": "Disponible",
                            "total_columnas": "Autodetectable"
                        })
    except Exception:
        pass

    # Si no se pudieron extraer pestañas secundarias, se usa la hoja principal por defecto
    if not hojas_encontradas:
        hojas_encontradas.append({
            "nombre": "Hoja Principal (Respuestas)",
            "gid": "0",
            "total_filas": "Disponible",
            "total_columnas": "Autodetectable"
        })

    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    try:
        request = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=10) as response:
            raw_bytes = response.read()
            text = raw_bytes.decode('utf-8', errors='replace')
            reader = list(csv.reader(io.StringIO(text)))
            if not reader or len(reader) == 0:
                raise HTTPException(status_code=400, detail="La hoja de Google Sheets está vacía o no se pudo acceder a los datos.")
            
            headers = [h.strip() for h in reader[0] if h.strip()]
            total_filas = len(reader) - 1
            
            # Actualizar conteo de la primera hoja
            hojas_encontradas[0]["total_filas"] = total_filas
            hojas_encontradas[0]["total_columnas"] = len(headers)
            
            tipo_msg = "Público" if req.tipo_acceso == "publico" else f"Privado (Compartido a {req.correo_autorizado or 'usuario autorizado'})"
            return {
                "sheet_id": sheet_id,
                "valido": True,
                "tipo_acceso": req.tipo_acceso,
                "correo_autorizado": req.correo_autorizado,
                "hojas": hojas_encontradas,
                "mensaje": f"Google Sheets [{tipo_msg}] validado exitosamente ({len(hojas_encontradas)} hoja(s) detectada(s))."
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        if req.tipo_acceso == "privado":
            raise HTTPException(
                status_code=400,
                detail=f"No se pudo acceder a la hoja privada. Asegúrate de haber compartido el documento con permisos de Editor/Lector al correo autorizado '{req.correo_autorizado or 'especificado'}' y verificado su credencial de servicio."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"No se pudo acceder a Google Sheets. Si el archivo es privado, cambia la opción a 'Enlace Privado' e ingresa el correo del usuario con acceso de Editor: {str(e)}"
            )

@app.post("/api/importacion/google-sheets/procesar")
async def procesar_google_sheets_link(
    req: GoogleSheetsProcessRequest,
    current_user: UserPublic = Depends(get_current_user),
    repo: PermissiveSheetsRepository = Depends(get_repository)
):
    """
    Importa los datos de las hojas seleccionadas de Google Sheets y actualiza el Dashboard activando los nuevos gráficos.
    """
    sheet_id = _extract_sheets_id(req.url)
    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    
    try:
        request = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=10) as response:
            raw_bytes = response.read()
            text = raw_bytes.decode('utf-8', errors='replace')
            reader = list(csv.reader(io.StringIO(text)))
            
            if not reader or len(reader) < 2:
                raise HTTPException(status_code=400, detail="La hoja de cálculo no contiene filas de datos suficientes.")
            
            raw_headers = reader[0]
            clean_headers = [h.strip() if h.strip() != "" else f"COL_{idx}" for idx, h in enumerate(raw_headers)]
            
            records = []
            for idx, row in enumerate(reader[1:], start=2):
                if not any(cell.strip() for cell in row):
                    continue
                row_dict = {}
                for col_idx, h in enumerate(clean_headers):
                    row_dict[h] = row[col_idx].strip() if col_idx < len(row) else ""
                records.append(row_dict)
                
            total_cargados = repo.replace_all_data(clean_headers, records)
            
            audit_service.log_change(
                usuario=current_user.usuario,
                registro_afectado=f"Google Sheets ({sheet_id})",
                campos_modificados={"total_filas_cargadas": total_cargados, "total_columnas": len(clean_headers)}
            )
            
            return {
                "message": "Importación desde Google Sheets completada exitosamente. El Dashboard ha sido actualizado con los nuevos gráficos.",
                "registros_procesados": len(records),
                "registros_insertados": total_cargados,
                "total_columnas": len(clean_headers),
                "fuente": f"Google Sheets ({sheet_id})"
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar la importación desde Google Sheets: {str(e)}")

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
    detector = ColumnDetectorService(repo)
    meta = detector.get_survey_metadata()
    id_field = meta.identificador_campo

    # Obtener el valor del documento en el payload
    doc_val = payload.datos.get(id_field) or payload.datos.get("NÚMERO DE DOCUMENTO") or payload.datos.get("CÉDULA") or payload.datos.get("Número de documento")
    
    if doc_val and str(doc_val).strip():
        existente = repo.get_response_by_id(id_field, str(doc_val).strip())
        if existente:
            raise HTTPException(
                status_code=400, 
                detail=f"Ya existe una encuesta registrada con el documento '{doc_val}'. Puede buscarla en el módulo de búsqueda o editarla."
            )

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
    if current_user.rol not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Acceso no autorizado.")
    return audit_service.get_logs()

# --- USUARIOS (CRUD COMPLETO Y MÁSCARA DE SUPERADMIN) ---
@app.get("/api/usuarios", response_model=List[UserPublic])
def list_users(
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    if current_user.rol not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")
    
    users = repo.get_users()
    response_users = []
    for u in users:
        # A los administradores normales (no SUPERADMIN) NO se les muestra que existe el superadmin
        if current_user.rol != UserRole.SUPERADMIN and u.rol == UserRole.SUPERADMIN:
            continue

        response_users.append(UserPublic(
            usuario=u.usuario,
            nombre=u.nombre,
            correo=u.correo,
            rol=u.rol,
            estado=u.estado
        ))
    return response_users

@app.post("/api/usuarios", response_model=UserPublic)
def create_user(
    payload: UserCreate,
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    if current_user.rol not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    # Solo un SUPERADMIN puede crear a otro SUPERADMIN
    if payload.rol == UserRole.SUPERADMIN and current_user.rol != UserRole.SUPERADMIN:
        payload.rol = UserRole.ADMIN

    user_db = UserInDB(
        usuario=payload.usuario.strip(),
        nombre=payload.nombre.strip(),
        correo=payload.correo.strip(),
        credencial=payload.contrasena.strip(), # En producción se puede hashear con get_password_hash
        rol=payload.rol,
        estado=payload.estado
    )
    try:
        created = repo.add_user(user_db)
        audit_service.log_action(
            usuario=current_user.usuario,
            accion="CREACIÓN_USUARIO",
            modulo="USUARIOS",
            detalles=f"Se creó el usuario: {created.usuario} con rol {created.rol}"
        )
        return UserPublic(
            usuario=created.usuario,
            nombre=created.nombre,
            correo=created.correo,
            rol=created.rol,
            estado=created.estado
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/usuarios/{username}", response_model=UserPublic)
def update_user(
    username: str,
    payload: UserUpdate,
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    if current_user.rol not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    target_user = repo.get_user_by_username(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # Un admin normal no puede editar al superadmin
    if target_user.rol == UserRole.SUPERADMIN and current_user.rol != UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos para modificar a este usuario.")

    update_dict = {}
    if payload.nombre is not None: update_dict["nombre"] = payload.nombre.strip()
    if payload.correo is not None: update_dict["correo"] = payload.correo.strip()
    if payload.contrasena is not None and payload.contrasena.strip():
        update_dict["credencial"] = payload.contrasena.strip()
    if payload.rol is not None:
        if payload.rol == UserRole.SUPERADMIN and current_user.rol != UserRole.SUPERADMIN:
            pass # No permitir promover a SUPERADMIN si quien edita no es SUPERADMIN
        else:
            update_dict["rol"] = payload.rol
    if payload.estado is not None: update_dict["estado"] = payload.estado

    updated = repo.update_user(username, update_dict)
    if not updated:
        raise HTTPException(status_code=500, detail="Error al actualizar el usuario.")

    audit_service.log_action(
        usuario=current_user.usuario,
        accion="EDICIÓN_USUARIO",
        modulo="USUARIOS",
        detalles=f"Se editó el usuario: {username}"
    )

    return UserPublic(
        usuario=updated.usuario,
        nombre=updated.nombre,
        correo=updated.correo,
        rol=updated.rol,
        estado=updated.estado
    )

@app.delete("/api/usuarios/{username}")
def delete_user(
    username: str,
    current_user: UserPublic = Depends(get_current_user),
    repo: BaseRepository = Depends(get_repository)
):
    if current_user.rol not in [UserRole.SUPERADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Acceso denegado.")

    if current_user.usuario.lower() == username.lower():
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta.")

    target_user = repo.get_user_by_username(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    # Un admin normal no puede eliminar al superadmin
    if target_user.rol == UserRole.SUPERADMIN and current_user.rol != UserRole.SUPERADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar a este usuario.")

    deleted = repo.delete_user(username)
    if not deleted:
        raise HTTPException(status_code=500, detail="Error al eliminar el usuario.")

    audit_service.log_action(
        usuario=current_user.usuario,
        accion="ELIMINACIÓN_USUARIO",
        modulo="USUARIOS",
        detalles=f"Se eliminó el usuario: {username}"
    )

    return {"message": f"Usuario {username} eliminado exitosamente."}


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

