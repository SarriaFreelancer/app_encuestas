import os
import re
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple

def analyze_excel_file(file_path_or_bytes) -> Dict[str, Any]:
    """
    Analizador agnóstico permissivo y ultrarrápido de archivos Excel.
    Carga el 100% de las filas y columnas omitiendo restricciones de tipo estricto,
    pero registrando los tipos y muestras para visualización informativa.
    """
    xls = pd.ExcelFile(file_path_or_bytes)
    sheet_names = xls.sheet_names
    
    # Cargar datos crudos como texto (dtype=str) para no perder ningún valor vacio o nulo
    df = pd.read_excel(xls, sheet_name=sheet_names[0], dtype=str)
    df = df.fillna("")

    total_rows, total_cols = df.shape
    columns_analysis = []
    
    possible_id_cols = []

    for col in df.columns:
        col_str = str(col).strip()
        series = df[col]
        
        null_count = int((series == "").sum())
        non_null_count = total_rows - null_count
        unique_vals = [v for v in series.unique() if v != ""]
        unique_count = len(unique_vals)
        
        col_lower = col_str.lower()
        if any(k in col_lower for k in ["cedula", "cédula", "documento", "id"]):
            possible_id_cols.append(col_str)

        # Muestra informativa de tipos sin bloquear la ingesta
        sample_vals = unique_vals[:5]
        
        columns_analysis.append({
            "columna": col_str,
            "tipo_detectado": "TEXTO / GENÉRICO",
            "total_registros": total_rows,
            "vacios": null_count,
            "porcentaje_vacios": round((null_count / total_rows) * 100, 2) if total_rows > 0 else 0,
            "valores_unicos": unique_count,
            "ejemplos": sample_vals
        })
        
    return {
        "hojas_disponibles": sheet_names,
        "hoja_analizada": sheet_names[0],
        "total_registros": total_rows,
        "total_columnas": total_cols,
        "posibles_identificadores": possible_id_cols,
        "columnas": columns_analysis
    }
