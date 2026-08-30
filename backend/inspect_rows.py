import urllib.request
import csv
import io

export_url = 'https://docs.google.com/spreadsheets/d/18hVTcC1_ylED47qIfeuHm1rP7cyNW-9wJykhQoNoIrY/export?format=csv&gid=1325247630'
req = urllib.request.Request(export_url, headers={'User-Agent': 'Mozilla/5.0'})
content = urllib.request.urlopen(req).read().decode('utf-8', errors='replace')
reader = csv.reader(io.StringIO(content))
rows = list(reader)

headers = rows[0]
print(f"Total líneas devueltas por Google: {len(rows)}")
print(f"Línea 1 (Encabezado): {headers[:3]}")

empty_or_test_rows = []
for idx, r in enumerate(rows[1:], start=2):
    has_any = any(c.strip() != '' for c in r)
    if not has_any:
        empty_or_test_rows.append((idx, "Completamente vacía"))
    else:
        # Inspeccionar si hay filas de prueba o incompletas
        filled_count = sum(1 for c in r if c.strip() != '')
        if filled_count < 5:
            empty_or_test_rows.append((idx, f"Casi vacía ({filled_count} celdas llenas): {r[:3]}"))

print(f"\nFilas sospechosas o vacías ({len(empty_or_test_rows)}):")
for item in empty_or_test_rows:
    print(f"  Fila Excel #{item[0]}: {item[1]}")

print(f"\nÚltimas 10 filas del archivo (número de fila en hoja):")
for idx in range(len(rows)-10, len(rows)):
    r = rows[idx]
    first_col = r[0] if len(r) > 0 else ''
    second_col = r[1] if len(r) > 1 else ''
    third_col = r[2] if len(r) > 2 else ''
    print(f"  Fila #{idx+1}: {first_col[:20]} | {second_col[:25]} | {third_col[:20]}")
