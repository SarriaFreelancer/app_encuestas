import urllib.request
import csv
import io

export_url = 'https://docs.google.com/spreadsheets/d/18hVTcC1_ylED47qIfeuHm1rP7cyNW-9wJykhQoNoIrY/export?format=csv&gid=1325247630'
req = urllib.request.Request(export_url, headers={'User-Agent': 'Mozilla/5.0'})
content = urllib.request.urlopen(req).read().decode('utf-8', errors='replace')
reader = csv.reader(io.StringIO(content))
rows = list(reader)

headers = rows[0]

# Consideramos respuestas reales aquellas filas que tengan información en las preguntas (excluyendo la columna 'Visible')
real_survey_rows = []
for idx, r in enumerate(rows[1:], start=2):
    # Validar si tiene contenido en alguna columna que NO sea 'Visible'
    has_survey_data = False
    for i, h in enumerate(headers):
        if h.lower() != 'visible':
            val = r[i].strip() if i < len(r) else ''
            if val != '':
                has_survey_data = True
                break
    if has_survey_data:
        real_survey_rows.append((idx, r))

print(f"Total filas encontradas con datos de encuesta reales: {len(real_survey_rows)}")
print(f"Primera fila: Fila Excel #{real_survey_rows[0][0]}")
print(f"Última fila con datos: Fila Excel #{real_survey_rows[-1][0]}")
