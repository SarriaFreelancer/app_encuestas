import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.schemas import UserInDB, UserPublic, UserStatus
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.repositories.base import BaseRepository
from app.repositories.sheets_repository import PermissiveSheetsRepository

SECRET_KEY = os.getenv("JWT_SECRET", "super_secreto_encuestas_key_2026_antigravity")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

repository_instance = PermissiveSheetsRepository()

def get_repository() -> BaseRepository:
    return repository_instance

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Soporte fallback para texto plano en semillas iniciales
    if not hashed_password.startswith("$2b$") and not hashed_password.startswith("$2a$"):
        return plain_password == hashed_password
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(repo: BaseRepository, username_or_email: str, password: str) -> UserInDB:
    user = repo.get_user_by_username(username_or_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no autorizado."
        )
    if user.estado == UserStatus.INACTIVO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no se encuentra habilitado."
        )
    if not verify_password(password, user.credencial):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas."
        )
    return user

def get_current_user(
    token: str = Depends(oauth2_scheme),
    repo: BaseRepository = Depends(get_repository)
) -> UserPublic:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = repo.get_user_by_username(username)
    if user is None:
        raise credentials_exception
    if user.estado == UserStatus.INACTIVO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no se encuentra habilitado."
        )

    # NUNCA devolver ni exponer credenciales
    return UserPublic(
        usuario=user.usuario,
        nombre=user.nombre,
        correo=user.correo,
        rol=user.rol,
        estado=user.estado
    )
