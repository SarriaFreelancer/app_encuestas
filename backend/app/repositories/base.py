from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas import UserInDB, ColumnConfig

class BaseRepository(ABC):
    
    @abstractmethod
    def get_users(self) -> List[UserInDB]:
        """Obtiene la lista de todos los usuarios registrados."""
        pass

    @abstractmethod
    def get_user_by_username(self, username: str) -> Optional[UserInDB]:
        """Busca un usuario por su nombre de usuario o correo."""
        pass

    @abstractmethod
    def get_headers(self, sheet_name: str = "RESPUESTAS") -> List[str]:
        """Obtiene los encabezados de la hoja especificada."""
        pass

    @abstractmethod
    def get_all_responses(self) -> List[Dict[str, Any]]:
        """Obtiene todas las respuestas con su respectivo índice de fila."""
        pass

    @abstractmethod
    def get_response_by_id(self, identifier_col: str, identifier_val: str) -> Optional[Dict[str, Any]]:
        """Busca un registro por valor identificador (ej. CÉDULA)."""
        pass

    @abstractmethod
    def add_response(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Agrega un nuevo registro al final de las respuestas."""
        pass

    @abstractmethod
    def update_response(self, row_index: int, record: Dict[str, Any]) -> Dict[str, Any]:
        """Actualiza un registro en una fila específica."""
        pass

    @abstractmethod
    def add_column_if_not_exists(self, column_name: str) -> bool:
        """Agrega una nueva columna al encabezado si no existe."""
        pass
