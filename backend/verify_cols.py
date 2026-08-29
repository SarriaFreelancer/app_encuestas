import json

data = json.load(open('app/data/respuestas.json', encoding='utf-8'))
keys = list(data['rows'][0].keys())
print('Total columns:', len(keys))
keywords = ['Sexo', 'Zona', 'Barrio', 'discapacidad', 'Nivel educativo', 'laboral actual', 'fuente de ingresos', 'victimizante principal', 'Municipio donde', '45. Tipo', 'afectaci', 'grupo', 'libreta', 'NECESIDAD PRINCIPAL', 'NECESIDAD SECUNDARIA', 'NECESIDAD TERCIARIA', 'menores de 18']
for kw in keywords:
    match = next((k for k in keys if kw.lower() in k.lower()), None)
    status = 'OK' if match else 'FAIL'
    print(f'  [{status}] "{kw}" -> {repr(match[:60]) if match else "NOT FOUND"}')
