import os
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any, Union
from enum import Enum

class UserRole(str, Enum):
    SUPERADMIN = "SUPERADMIN"
    ADMIN = "ADMIN"
    USUARIO = "USUARIO"

class UserStatus(str, Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"

class UserInDB(BaseModel):
    usuario: str
    nombre: str
    correo: str
    credencial: str # Hash or stored password
    rol: UserRole
    estado: UserStatus

class UserPublic(BaseModel):
    usuario: str
    nombre: str
    correo: str
    rol: UserRole
    estado: UserStatus

class UserCreate(BaseModel):
    usuario: str
    nombre: str
    correo: str
    contrasena: str
    rol: UserRole = UserRole.USUARIO
    estado: UserStatus = UserStatus.ACTIVO

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    contrasena: Optional[str] = None
    rol: Optional[UserRole] = None
    estado: Optional[UserStatus] = None

class LoginRequest(BaseModel):
    usuario: str
    contrasena: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

class ColumnType(str, Enum):
    TEXTO = "texto"
    NUMERO = "numero"
    OPCION = "opcion"
    FECHA = "fecha"

class ColumnConfig(BaseModel):
    campo: str
    tipo: ColumnType = ColumnType.TEXTO
    es_pregunta: bool = False
    es_identificador: bool = False
    autocompletar: bool = False
    editable: bool = True
    obligatorio: bool = False
    opciones: Optional[List[str]] = None

class SurveyMetadata(BaseModel):
    columnas: List[str]
    configuraciones: List[ColumnConfig]
    siguiente_pregunta: str # ej. "PREGUNTA 5"
    preguntas_existentes: List[str]
    identificador_campo: str # ej. "CÉDULA"

class SurveyResponseCreate(BaseModel):
    datos: Dict[str, Any]

class SurveyResponseUpdate(BaseModel):
    fila_index: int
    datos: Dict[str, Any]

class AIQueryRequest(BaseModel):
    pregunta: str

class AIQueryResponse(BaseModel):
    pregunta: str
    respuesta: str
    datos_resultado: Optional[List[Dict[str, Any]]] = None
    resumen_estadistico: Optional[Dict[str, Any]] = None

class GoogleSheetsInspectRequest(BaseModel):
    url: str
    tipo_acceso: Optional[str] = "publico" # "publico" | "privado"
    correo_autorizado: Optional[str] = None
    clave_acceso: Optional[str] = None

class GoogleSheetsProcessRequest(BaseModel):
    url: str
    selected_sheets: List[str]
    tipo_acceso: Optional[str] = "publico"
    correo_autorizado: Optional[str] = None
    clave_acceso: Optional[str] = None

