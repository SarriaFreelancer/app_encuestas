import urllib.request
import re
import csv
import io

sheet_url = 'https://docs.google.com/spreadsheets/d/18hVTcC1_ylED47qIfeuHm1rP7cyNW-9wJykhQoNoIrY/edit'
req = urllib.request.Request(sheet_url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8', errors='replace')

gids = re.findall(r'"sheetId":\s*(\d+)', html)
print('Gids encontrados en el documento:', list(set(gids)))

for g in set(gids):
    try:
        export_url = f'https://docs.google.com/spreadsheets/d/18hVTcC1_ylED47qIfeuHm1rP7cyNW-9wJykhQoNoIrY/export?format=csv&gid={g}'
        r = urllib.request.urlopen(urllib.request.Request(export_url, headers={'User-Agent': 'Mozilla/5.0'}))
        content = r.read().decode('utf-8', errors='replace')
        reader = csv.reader(io.StringIO(content))
        rows = list(reader)
        data_rows = [row for row in rows[1:] if any(c.strip() != '' for c in row)]
        print(f'Gid {g}: {len(rows)} filas totales en CSV, {len(data_rows)} filas con datos reales.')
    except Exception as e:
        print(f'Gid {g}: Error {e}')
