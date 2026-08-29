import json
import urllib.request
import csv
import io

def fix_mojibake(s: str) -> str:
    if not isinstance(s, str):
        return s
    # La hoja de Google Sheets tiene texto UTF-8 que fue guardado/exportado como Windows-1252 (doble encoding)
    # Al decodificar el string latin-1 a utf-8 se restaura el caracter original exacto
    try:
        return s.encode('latin-1').decode('utf-8')
    except Exception:
        # Fallback de reemplazos por si hay secuencias mixtas
        replaces = {
            'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
            'Ã±': 'ñ', 'Ã‘': 'Ñ', 'Ã\x81': 'Á', 'Ã‰': 'É', 'Ã\x8d': 'Í', 'Ã“': 'Ó', 'Ãš': 'Ú',
            'Â¿': '¿', 'Â¡': '¡', 'Â': '', 'â€œ': '"', 'â€\x9d': '"', 'â€™': "'",
            'Â°': '°', 'NÂ°': 'N°', 'NÃºmero': 'Número', 'CÃ©dula': 'Cédula',
            'GÃ©nero': 'Género', 'Ã‰tnico': 'Étnico', 'FÃ­sica': 'Física', 'FÃsica': 'Física',
            'CondiciÃ³n': 'Condición', 'condiciÃ³n': 'condición', 'DirecciÃ³n': 'Dirección',
            'TelÃ©fono': 'Teléfono', 'electrÃ³nico': 'electrónico', 'Â¿CuÃ¡ntas': '¿Cuántas',
            'CuÃ¡ntas': 'Cuántas', 'situaciÃ³n': 'situación', 'SituaciÃ³n': 'Situación',
            'VÃ­ctima': 'Víctima', 'vÃ­ctima': 'víctima', 'VÃctima': 'Víctima', 'vÃctima': 'víctima',
            'Victimizante': 'Victimizante', 'Ãšltimo': 'Último', 'AfectaciÃ³n': 'Afectación',
            'afectaciÃ³n': 'afectación', 'Ocurrencia': 'Ocurrencia', 'OcurriÃ³': 'Ocurrió',
            'EducaciÃ³n': 'Educación', 'OcupaciÃ³n': 'Ocupación', 'AtenciÃ³n': 'Atención',
            'ReparaciÃ³n': 'Reparación', 'InformaciÃ³n': 'Información', 'OrganizaciÃ³n': 'Organización',
            'PoblaciÃ³n': 'Población', 'ProtecciÃ³n': 'Protección', 'EconÃ³mica': 'Económica',
            'econÃ³mica': 'económica', 'IndÃ­gena': 'Indígena', 'indÃ­gena': 'indígena',
            'Afrodescendiente': 'Afrodescendiente', 'Ã‰xito': 'Éxito', 'SÃ­': 'Sí', 'SÃ': 'Sí'
        }
        res = s
        for k, v in replaces.items():
            res = res.replace(k, v)
        return res

def clean_data():
    csv_url = 'https://docs.google.com/spreadsheets/d/18hVTcC1_ylED47qIfeuHm1rP7cyNW-9wJykhQoNoIrY/export?format=csv&gid=1325247630'
    req = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
    raw_bytes = urllib.request.urlopen(req).read()

    text_utf8 = raw_bytes.decode('utf-8', errors='replace')
    reader = csv.reader(io.StringIO(text_utf8))
    rows_list = list(reader)

    if not rows_list:
        print("No rows found")
        return

    clean_headers = [fix_mojibake(h.strip()) for h in rows_list[0]]
    clean_rows = []

    for idx, r in enumerate(rows_list[1:], start=2):
        has_data = any(val.strip() != '' for val in r)
        if has_data:
            row_dict = {'__row_index': idx}
            for i, h in enumerate(clean_headers):
                val = r[i].strip() if i < len(r) else ''
                row_dict[h] = fix_mojibake(val)
            clean_rows.append(row_dict)

    dataset = {'headers': clean_headers, 'rows': clean_rows}
    with open('app/data/respuestas.json', 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"Limpieza exitosa: {len(clean_rows)} registros procesados.")

if __name__ == '__main__':
    clean_data()
