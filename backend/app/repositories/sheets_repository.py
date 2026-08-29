import os
import json
from typing import List, Dict, Any, Optional
import pandas as pd
from app.repositories.base import BaseRepository
from app.schemas import UserInDB, UserRole, UserStatus

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
USERS_FILE = os.path.join(DATA_DIR, "usuarios.json")
RESPONSES_FILE = os.path.join(DATA_DIR, "respuestas.json")

class PermissiveSheetsRepository(BaseRepository):
    """
    Repositorio 100% permisivo que almacena y carga absolutamente todas las filas y columnas del Excel
    sin desduplicación destructiva ni validación estricta de tipos.
    """

    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self._init_mock_data()

    def _init_mock_data(self):
        if not os.path.exists(USERS_FILE):
            initial_users = [
                {
                    "usuario": "admin",
                    "nombre": "Administrador Principal",
                    "correo": "admin@encuestas.com",
                    "credencial": "admin123",
                    "rol": "ADMIN",
                    "estado": "ACTIVO"
                },
                {
                    "usuario": "usuario1",
                    "nombre": "David Sarria",
                    "correo": "david@encuestas.com",
                    "credencial": "admin123",
                    "rol": "USUARIO",
                    "estado": "ACTIVO"
                }
            ]
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(initial_users, f, ensure_ascii=False, indent=2)

        if not os.path.exists(RESPONSES_FILE):
            initial_responses = {
                "headers": [
                    "CÉDULA", "NOMBRE", "APELLIDO", "TELÉFONO", "CORREO", "CIUDAD", "ESTADO", "CATEGORÍA", 
                    "PREGUNTA 2", "PREGUNTA 3", "PREGUNTA 4", "FECHA"
                ],
                "rows": [
                    {
                        "__row_index": 2,
                        "CÉDULA": "123456789",
                        "NOMBRE": "David",
                        "APELLIDO": "Sarria",
                        "TELÉFONO": "3000000000",
                        "CORREO": "david@correo.com",
                        "CIUDAD": "Cali",
                        "ESTADO": "Activo",
                        "CATEGORÍA": "Tecnología",
                        "PREGUNTA 2": "Excelente",
                        "PREGUNTA 3": "Sí",
                        "PREGUNTA 4": "Diariamente",
                        "FECHA": "2026-08-28 10:30:00"
                    }
                ]
            }
            with open(RESPONSES_FILE, "w", encoding="utf-8") as f:
                json.dump(initial_responses, f, ensure_ascii=False, indent=2)

    def get_users(self) -> List[UserInDB]:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return [UserInDB(**u) for u in data]

    def get_user_by_username(self, username: str) -> Optional[UserInDB]:
        users = self.get_users()
        clean_user = username.strip().lower()
        for u in users:
            if u.usuario.lower() == clean_user or u.correo.lower() == clean_user:
                return u
        return None

    def get_headers(self, sheet_name: str = "RESPUESTAS") -> List[str]:
        with open(RESPONSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("headers", [])

    def get_all_responses(self) -> List[Dict[str, Any]]:
        with open(RESPONSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("rows", [])

    def get_response_by_id(self, identifier_col: str, identifier_val: str) -> Optional[Dict[str, Any]]:
        rows = self.get_all_responses()
        clean_val = str(identifier_val).strip()
        for r in rows:
            if str(r.get(identifier_col, "")).strip() == clean_val:
                return r
        return None

    def add_response(self, record: Dict[str, Any]) -> Dict[str, Any]:
        with open(RESPONSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        headers = data["headers"]
        rows = data["rows"]

        new_row_index = len(rows) + 2
        formatted_record = {"__row_index": new_row_index}

        for h in headers:
            formatted_record[h] = str(record.get(h, ""))

        rows.append(formatted_record)
        data["rows"] = rows

        with open(RESPONSES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return formatted_record

    def replace_all_data(self, headers: List[str], records: List[Dict[str, Any]]) -> int:
        """
        Guarda el 100% de las filas y columnas del Excel sin omitir ningún campo ni dato.
        """
        rows = []
        for idx, r in enumerate(records, start=2):
            formatted = {"__row_index": idx}
            for h in headers:
                formatted[h] = str(r.get(h, ""))
            rows.append(formatted)

        new_dataset = {
            "headers": headers,
            "rows": rows
        }

        with open(RESPONSES_FILE, "w", encoding="utf-8") as f:
            json.dump(new_dataset, f, ensure_ascii=False, indent=2)

        return len(rows)

    def update_response(self, row_index: int, record: Dict[str, Any]) -> Dict[str, Any]:
        with open(RESPONSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        rows = data["rows"]
        target_row = None

        for idx, r in enumerate(rows):
            if r.get("__row_index") == row_index:
                for k, v in record.items():
                    if k != "__row_index":
                        r[k] = str(v)
                target_row = r
                rows[idx] = r
                break

        if not target_row:
            raise ValueError(f"No se encontró la fila {row_index}")

        data["rows"] = rows
        with open(RESPONSES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return target_row

    def add_column_if_not_exists(self, column_name: str) -> bool:
        with open(RESPONSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        headers = data["headers"]
        if column_name not in headers:
            headers.append(column_name)
            data["headers"] = headers
            for r in data["rows"]:
                if column_name not in r:
                    r[column_name] = ""

            with open(RESPONSES_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        return False
