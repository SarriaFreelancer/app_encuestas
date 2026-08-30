import urllib.request
import csv
import io

export_url = 'https://docs.google.com/spreadsheets/d/18hVTcC1_ylED47qIfeuHm1rP7cyNW-9wJykhQoNoIrY/export?format=csv&gid=1325247630'
req = urllib.request.Request(export_url, headers={'User-Agent': 'Mozilla/5.0'})
content = urllib.request.urlopen(req).read().decode('utf-8', errors='replace')
reader = csv.reader(io.StringIO(content))
rows = list(reader)

headers = rows[0]

for idx in range(240, len(rows)):
    r = rows[idx]
    non_empty = [(headers[i], val) for i, val in enumerate(r) if val.strip() != '']
    print(f"Fila Excel #{idx+1}: {len(non_empty)} celdas con contenido -> {non_empty}")
