import os
import json
import re
from typing import List, Dict, Any, Optional
import pandas as pd
from app.repositories.base import BaseRepository
from app.schemas import UserInDB, UserRole, UserStatus

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
USERS_FILE = os.path.join(DATA_DIR, "usuarios.json")
RESPONSES_FILE = os.path.join(DATA_DIR, "respuestas.json")
EDITS_FILE = os.path.join(DATA_DIR, "ediciones_manuales.json")

class PermissiveSheetsRepository(BaseRepository):
    """
    Repositorio 100% permisivo que almacena y carga absolutamente todas las filas y columnas del Excel
    sin desduplicación destructiva ni validación estricta de tipos.
    """

    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self._init_mock_data()

    def _init_mock_data(self):
        initial_users = [
            {
                "usuario": "superadmin",
                "nombre": "Super Administrador",
                "correo": "superadmin@encuestas.com",
                "credencial": "superadmin123",
                "rol": "SUPERADMIN",
                "estado": "ACTIVO"
            },
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

        if not os.path.exists(USERS_FILE):
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(initial_users, f, ensure_ascii=False, indent=2)
        else:
            # Asegurar que los usuarios por defecto en código existan
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                try:
                    existing = json.load(f)
                except Exception:
                    existing = []
            
            existing_usernames = {u["usuario"].lower() for u in existing}
            modified = False
            for init_u in initial_users:
                if init_u["usuario"].lower() not in existing_usernames:
                    existing.append(init_u)
                    modified = True
            
            if modified:
                with open(USERS_FILE, "w", encoding="utf-8") as f:
                    json.dump(existing, f, ensure_ascii=False, indent=2)

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

    def add_user(self, user: UserInDB) -> UserInDB:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            users_data = json.load(f)
        
        # Verificar si ya existe
        for u in users_data:
            if u["usuario"].lower() == user.usuario.lower():
                raise ValueError(f"El usuario '{user.usuario}' ya existe.")

        users_data.append(user.model_dump())
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users_data, f, ensure_ascii=False, indent=2)
        return user

    def update_user(self, username: str, user_update: Dict[str, Any]) -> Optional[UserInDB]:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            users_data = json.load(f)
        
        target = None
        for u in users_data:
            if u["usuario"].lower() == username.lower():
                for k, v in user_update.items():
                    if v is not None:
                        u[k] = v
                target = UserInDB(**u)
                break
        
        if target:
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(users_data, f, ensure_ascii=False, indent=2)
        return target

    def delete_user(self, username: str) -> bool:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            users_data = json.load(f)
        
        filtered = [u for u in users_data if u["usuario"].lower() != username.lower()]
        if len(filtered) < len(users_data):
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(filtered, f, ensure_ascii=False, indent=2)
            return True
        return False

    _last_sync_time = 0
    _sync_interval = 15  # Cada 15 segundos revisa si hubo nuevas filas o se eliminaron filas en Google Sheets
    GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/18hVTcC1_ylED47qIfeuHm1rP7cyNW-9wJykhQoNoIrY/export?format=csv&gid=1325247630"
    GOOGLE_APPS_SCRIPT_URL = os.getenv("GOOGLE_APPS_SCRIPT_URL", "")

    def _send_to_google_apps_script(self, action: str, data: Dict[str, Any], doc_number: str = ""):
        """
        Envía la actualización o creación a Google Apps Script para modificar la celda en la hoja en la nube.
        """
        if not self.GOOGLE_APPS_SCRIPT_URL:
            return

        import urllib.request
        import json

        try:
            payload = json.dumps({
                "action": action,
                "documento": doc_number,
                "datos": data
            }).encode('utf-8')

            req = urllib.request.Request(
                self.GOOGLE_APPS_SCRIPT_URL,
                data=payload,
                headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
            )
            urllib.request.urlopen(req, timeout=10)
        except Exception as e:
            print(f"[Google Apps Script Webhook Error]: {e}")

    def _sync_with_google_sheets(self, force: bool = False):
        import time
        import urllib.request
        import csv
        import io

        now = time.time()
        if not force and (now - PermissiveSheetsRepository._last_sync_time < PermissiveSheetsRepository._sync_interval):
            return

        PermissiveSheetsRepository._last_sync_time = now

        try:
            req = urllib.request.Request(self.GOOGLE_SHEETS_CSV_URL, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=8) as response:
                raw_bytes = response.read()

            text_utf8 = raw_bytes.decode('utf-8', errors='replace')
            reader = csv.reader(io.StringIO(text_utf8))
            rows_list = list(reader)

            if not rows_list or len(rows_list) < 1:
                return

            def _fix_encoding(s: str) -> str:
                if not isinstance(s, str):
                    return s
                try:
                    return s.encode('latin-1').decode('utf-8')
                except Exception:
                    replaces = {
                        'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
                        'Ã±': 'ñ', 'Ã‘': 'Ñ', 'Â¿': '¿', 'Â¡': '¡', 'Â': '',
                        'IndÃ­gena': 'Indígena', 'FÃ­sica': 'Física', 'condiciÃ³n': 'condición'
                    }
                    res = s
                    for k, v in replaces.items():
                        res = res.replace(k, v)
                    return res

            # Mantener el índice original de las columnas para evitar desplazamientos por celdas vacías en la cabecera
            raw_headers = rows_list[0]
            clean_headers = [h.strip() if h.strip() != '' else f"COL_{idx}" for idx, h in enumerate(raw_headers)]
            clean_rows = []

            # 1. Cargar ediciones manuales locales guardadas para este documento
            manual_edits = {}
            if os.path.exists(EDITS_FILE):
                try:
                    with open(EDITS_FILE, 'r', encoding='utf-8') as ef:
                        manual_edits = json.load(ef)
                except Exception:
                    manual_edits = {}

            doc_cols = [h for h in clean_headers if ('documento' in h.lower() or 'cédula' in h.lower() or 'cedula' in h.lower()) and 'tipo' not in h.lower()]

            for idx, r in enumerate(rows_list[1:], start=2):
                has_survey_data = False
                for i, h in enumerate(clean_headers):
                    if not h.startswith("COL_") and h.lower() != 'visible':
                        val = r[i].strip() if i < len(r) else ''
                        if val != '' and val != '0':
                            has_survey_data = True
                            break

                if has_survey_data:
                    row_dict = {'__row_index': idx}
                    for i, h in enumerate(clean_headers):
                        if not h.startswith("COL_"):
                            val = r[i].strip() if i < len(r) else ''
                            row_dict[h] = _fix_encoding(val)

                    # Buscar si este documento tiene ediciones manuales guardadas
                    doc_key = ""
                    for dc in doc_cols:
                        raw_doc = str(row_dict.get(dc, "")).strip()
                        clean_d = re.sub(r'\D', '', raw_doc)
                        if clean_d:
                            doc_key = clean_d
                            break

                    if doc_key and doc_key in manual_edits:
                        for k, v in manual_edits[doc_key].items():
                            if k != '__row_index':
                                # Solo sobreescribir si la edición manual trae un valor no vacío o intencional
                                val_str = str(v).strip()
                                if val_str != '':
                                    row_dict[k] = val_str

                    clean_rows.append(row_dict)

            new_dataset = {'headers': clean_headers, 'rows': clean_rows}
            with open(RESPONSES_FILE, 'w', encoding='utf-8') as f:
                json.dump(new_dataset, f, ensure_ascii=False, indent=2)

        except Exception as e:
            # Si no hay internet o falla la petición temporalmente, continúa con la caché local
            pass

    def get_headers(self, sheet_name: str = "RESPUESTAS") -> List[str]:
        self._sync_with_google_sheets()
        with open(RESPONSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("headers", [])

    def get_all_responses(self) -> List[Dict[str, Any]]:
        self._sync_with_google_sheets()
        with open(RESPONSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        raw_rows = data.get("rows", [])
        headers = data.get("headers", [])
        
        valid_rows = []
        for r in raw_rows:
            has_data = any(str(r.get(h, "")).strip() != "" for h in headers if h != "__row_index" and h.lower() != "visible")
            if has_data:
                valid_rows.append(r)
        return valid_rows

    def get_response_by_id(self, identifier_col: str, identifier_val: str) -> Optional[Dict[str, Any]]:
        rows = self.get_all_responses()
        headers = self.get_headers("RESPUESTAS")
        clean_val = re.sub(r'\D', '', str(identifier_val).strip())
        raw_val = str(identifier_val).strip().lower()

        # Identificar columnas candidatas de cédula / documento
        doc_cols = []
        if identifier_col and identifier_col in headers:
            doc_cols.append(identifier_col)
        
        for h in headers:
            h_clean = h.lower()
            if ('documento' in h_clean or 'cédula' in h_clean or 'cedula' in h_clean) and 'tipo' not in h_clean:
                if h not in doc_cols:
                    doc_cols.append(h)

        for r in rows:
            for col in doc_cols:
                val = str(r.get(col, "")).strip()
                val_digits = re.sub(r'\D', '', val)
                
                # Coincidencia por dígitos puros o texto exacto
                if (clean_val and val_digits == clean_val) or (raw_val and val.lower() == raw_val):
                    return r
        return None

    def add_response(self, record: Dict[str, Any]) -> Dict[str, Any]:
        with open(RESPONSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        headers = data["headers"]
        rows = data["rows"]

        # Ignorar si el registro está 100% vacío
        if not any(str(record.get(h, "")).strip() != "" for h in headers):
            raise ValueError("No se puede guardar una fila completamente vacía.")

        new_row_index = len(rows) + 2
        formatted_record = {"__row_index": new_row_index}

        for h in headers:
            formatted_record[h] = str(record.get(h, ""))

        rows.append(formatted_record)
        data["rows"] = rows

        with open(RESPONSES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # Enviar a Google Apps Script para insertar fila en vivo en Google Sheets
        doc_cols = [h for h in headers if ('documento' in h.lower() or 'cédula' in h.lower() or 'cedula' in h.lower()) and 'tipo' not in h.lower()]
        target_doc = ""
        for dc in doc_cols:
            raw_doc = str(formatted_record.get(dc, "")).strip()
            clean_d = re.sub(r'\D', '', raw_doc)
            if clean_d:
                target_doc = clean_d
                break

        self._send_to_google_apps_script("create", formatted_record, target_doc)

        return formatted_record

    def replace_all_data(self, headers: List[str], records: List[Dict[str, Any]]) -> int:
        """
        Guarda el dataset ignorando únicamente filas que estén completamente vacías.
        Conserva todos los campos vacíos en filas que tengan algún dato en otras columnas.
        """
        rows = []
        valid_records = []
        for r in records:
            # Comprobar si la fila tiene al menos un dato
            has_data = any(str(r.get(h, "")).strip() != "" for h in headers if h != "__row_index")
            if has_data:
                valid_records.append(r)

        for idx, r in enumerate(valid_records, start=2):
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
        headers = data.get("headers", [])
        target_row = None

        # 1. Intentar encontrar por row_index
        for idx, r in enumerate(rows):
            if r.get("__row_index") == row_index:
                for k, v in record.items():
                    if k != "__row_index":
                        r[k] = str(v)
                target_row = r
                rows[idx] = r
                break

        # 2. Si no se encontró por índice de fila, buscar por Documento / Cédula
        if not target_row:
            doc_cols = [h for h in headers if ('documento' in h.lower() or 'cédula' in h.lower() or 'cedula' in h.lower()) and 'tipo' not in h.lower()]
            record_doc = ""
            for dc in doc_cols:
                if record.get(dc):
                    record_doc = re.sub(r'\D', '', str(record.get(dc)).strip())
                    break

            if record_doc:
                for idx, r in enumerate(rows):
                    for dc in doc_cols:
                        val_digits = re.sub(r'\D', '', str(r.get(dc, "")).strip())
                        if val_digits and val_digits == record_doc:
                            for k, v in record.items():
                                if k != "__row_index":
                                    r[k] = str(v)
                            target_row = r
                            rows[idx] = r
                            break
                    if target_row:
                        break

        if not target_row:
            raise ValueError(f"No se encontró el registro para actualizar (índice: {row_index})")

        data["rows"] = rows
        with open(RESPONSES_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # 3. Guardar en el archivo persistente de ediciones manuales indexado por número de documento
        doc_cols = [h for h in headers if ('documento' in h.lower() or 'cédula' in h.lower() or 'cedula' in h.lower()) and 'tipo' not in h.lower()]
        target_doc = ""
        for dc in doc_cols:
            raw_doc = str(target_row.get(dc, "")).strip()
            clean_d = re.sub(r'\D', '', raw_doc)
            if clean_d:
                target_doc = clean_d
                break

        if target_doc:
            manual_edits = {}
            if os.path.exists(EDITS_FILE):
                try:
                    with open(EDITS_FILE, 'r', encoding='utf-8') as ef:
                        manual_edits = json.load(ef)
                except Exception:
                    manual_edits = {}

            if target_doc not in manual_edits:
                manual_edits[target_doc] = {}

            for k, v in record.items():
                if k != '__row_index':
                    manual_edits[target_doc][k] = str(v)

            with open(EDITS_FILE, 'w', encoding='utf-8') as ef:
                json.dump(manual_edits, ef, ensure_ascii=False, indent=2)

        # Enviar actualización a Google Apps Script para modificar la celda exacta en Google Sheets
        self._send_to_google_apps_script("update", target_row, target_doc)

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
