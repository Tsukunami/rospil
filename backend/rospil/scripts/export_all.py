# scripts/export_all.py
import os
import sys
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path

# Настройка путей для Django
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rospil.settings')
import django
django.setup()
from django.conf import settings

# Список таблиц для экспорта (из вашего дампа)
TABLES = [
    'act', 'delivery', 'employees', 'expenditure', 'product',
    'roles', 'storage', 'supplier_wood', 'suppliers_contract',
    'suppliers_info', 'user_roles', 'users'
]

def export_table(table_name, output_dir):
    db = settings.DATABASES['default']
    conn = psycopg2.connect(
        host=db['HOST'], port=db['PORT'], database=db['NAME'],
        user=db['USER'], password=db['PASSWORD']
    )
    conn.autocommit = True
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(f'SELECT * FROM "{table_name}"')
            rows = cursor.fetchall()
            data = []
            for row in rows:
                row_dict = {}
                for key, value in row.items():
                    if hasattr(value, 'isoformat'):
                        row_dict[key] = value.isoformat()
                    elif isinstance(value, bytes):
                        row_dict[key] = value.decode('utf-8', errors='ignore')
                    elif hasattr(value, 'to_eng_string'):
                        row_dict[key] = float(value)
                    else:
                        row_dict[key] = value
                data.append(row_dict)
            output_path = output_dir / f"{table_name}.json"
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            print(f"✅ {table_name}: {len(data)} записей -> {output_path}")
    finally:
        conn.close()

if __name__ == "__main__":
    export_dir = BASE_DIR / 'exports'
    export_dir.mkdir(exist_ok=True)
    print(f"Экспорт таблиц в {export_dir}")
    for table in TABLES:
        try:
            export_table(table, export_dir)
        except Exception as e:
            print(f"❌ Ошибка при экспорте {table}: {e}")
    print("Готово!")