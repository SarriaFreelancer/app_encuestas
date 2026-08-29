import json
data = json.load(open('app/data/respuestas.json', encoding='utf-8'))
rows = data['rows']
for col in ['6. Sexo', '16. Zona', '13. ¿presenta condición de discapacidad?']:
    m = {}
    for r in rows:
        v = str(r.get(col, '')).strip() or 'Sin respuesta'
        label = v[:25] + '…' if len(v) > 28 else v
        m[label] = m.get(label, 0) + 1
    items = sorted([{'name': k, 'value': val} for k, val in m.items()], key=lambda x: x['value'], reverse=True)
    print(f'Distribution for "{col}":', items)
