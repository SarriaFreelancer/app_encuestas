import pandas as pd
import numpy as np
from typing import Dict, Any, List

class DynamicCrosstabEngine:
    """
    Motor vectorial para cruce dinámico de variables (Variable A vs Variable B),
    frecuencias y porcentajes para cualquier par de preguntas/columnas.
    """

    @staticmethod
    def compute_crosstab(df: pd.DataFrame, col_a: str, col_b: str, normalize: bool = False) -> Dict[str, Any]:
        if col_a not in df.columns or col_b not in df.columns:
            raise ValueError(f"Las columnas {col_a} o {col_b} no existen en el dataset")

        # Rellenar vacíos para análisis
        s_a = df[col_a].fillna("Sin respuesta").astype(str)
        s_b = df[col_b].fillna("Sin respuesta").astype(str)

        # Matriz de frecuencias absolutas
        ct_counts = pd.crosstab(s_a, s_b, margins=True, margins_name="Total")
        
        # Matriz de porcentajes por fila
        ct_percent = pd.crosstab(s_a, s_b, normalize='index', margins=True, margins_name="Total") * 100
        ct_percent = ct_percent.round(2)

        categories_b = [c for c in ct_counts.columns if c != "Total"]
        categories_a = [r for r in ct_counts.index if r != "Total"]

        matrix_rows = []
        for idx in ct_counts.index:
            row_data = {
                "variable_a": str(idx),
                "total": int(ct_counts.loc[idx, "Total"])
            }
            for cat_b in categories_b:
                val_cnt = int(ct_counts.loc[idx, cat_b])
                val_pct = float(ct_percent.loc[idx, cat_b])
                row_data[str(cat_b)] = {
                    "cantidad": val_cnt,
                    "porcentaje": val_pct
                }
            matrix_rows.append(row_data)

        return {
            "columna_a": col_a,
            "columna_b": col_b,
            "categorias_b": categories_b,
            "categorias_a": categories_a,
            "matriz": matrix_rows,
            "total_analizado": len(df)
        }
