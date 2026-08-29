import os
import json
from datetime import datetime
from typing import Dict, Any, List

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
AUDIT_FILE = os.path.join(DATA_DIR, "auditoria.json")

class AuditService:
    """
    Servicio de Auditoría para registrar cambios y modificaciones en las encuestas.
    """

    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(AUDIT_FILE):
            with open(AUDIT_FILE, "w", encoding="utf-8") as f:
                json.dump([], f, ensure_ascii=False, indent=2)

    def log_change(self, usuario: str, registro_afectado: str, campos_modificados: Dict[str, Any]):
        with open(AUDIT_FILE, "r", encoding="utf-8") as f:
            logs = json.load(f)

        log_entry = {
            "id": len(logs) + 1,
            "usuario": usuario,
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "registro_afectado": registro_afectado,
            "campos_modificados": campos_modificados
        }

        logs.append(log_entry)

        with open(AUDIT_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)

        return log_entry

    def get_logs(self) -> List[Dict[str, Any]]:
        with open(AUDIT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
