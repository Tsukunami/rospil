# contracts_to_json.py
import os
import sys
import json
import psycopg2
from pathlib import Path

# Добавляем путь к корню проекта в PYTHONPATH
# Текущий файл: backend/rospil/scripts/contracts_to_json.py
# Нам нужно добавить backend в путь
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # поднимаемся на 2 уровня: scripts -> rospil -> backend
sys.path.insert(0, str(BASE_DIR))

# Устанавливаем настройки Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rospil.settings')

import django
django.setup()

from django.conf import settings

def export_contracts_to_json(output_file='contracts_export.json'):
    """
    Экспорт данных о контрактах в JSON файл
    """
    print(f"BASE_DIR: {BASE_DIR}")
    print(f"Settings module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
    
    # Используем настройки базы данных из Django settings
    db_settings = settings.DATABASES['default']
    
    print(f"Подключение к базе данных: {db_settings['NAME']}")
    print(f"Хост: {db_settings['HOST']}:{db_settings['PORT']}")
    
    try:
        # Подключение к базе данных
        conn = psycopg2.connect(
            host=db_settings['HOST'],
            port=db_settings['PORT'],
            database=db_settings['NAME'],
            user=db_settings['USER'],
            password=db_settings['PASSWORD']
        )
        
        cursor = conn.cursor()
        
        # Получаем список всех таблиц, связанных с контрактами
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND (table_name LIKE '%contract%' 
            OR table_name LIKE '%contractor%'
            OR table_name LIKE '%supplier%')
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        export_data = {
            'export_date': django.utils.timezone.now().isoformat(),
            'database': db_settings['NAME'],
            'tables': {}
        }
        
        for table in tables:
            suppliers_contract = table[0]
            print(f"Экспорт таблицы: {suppliers_contract}")
            
            try:
                cursor.execute(f'SELECT * FROM "{suppliers_contract}"')
                rows = cursor.fetchall()
                col_names = [desc[0] for desc in cursor.description]
                
                table_data = []
                for row in rows:
                    row_dict = dict(zip(col_names, row))
                    for key, value in row_dict.items():
                        if hasattr(value, 'isoformat'):
                            row_dict[key] = value.isoformat()
                        elif isinstance(value, bytes):
                            row_dict[key] = value.decode('utf-8', errors='ignore')
                    table_data.append(row_dict)
                
                export_data['tables'][suppliers_contract] = {
                    'count': len(table_data),
                    'data': table_data
                }
                
            except Exception as e:
                print(f"  Ошибка при экспорте таблицы {suppliers_contract}: {e}")
                export_data['tables'][suppliers_contract] = {
                    'error': str(e),
                    'count': 0,
                    'data': []
                }
        
        # Сохраняем в JSON файл
        output_path = BASE_DIR / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2, default=str)
        
        cursor.close()
        conn.close()
        
        print(f"\n✅ Экспорт завершен успешно!")
        print(f"📁 Файл сохранен: {output_path}")
        print(f"📊 Экспортировано таблиц: {len(export_data['tables'])}")
        
        return output_path
        
    except Exception as e:
        print(f"❌ Ошибка подключения к базе данных: {e}")
        print(f"Параметры подключения:")
        print(f"  HOST: {db_settings['HOST']}")
        print(f"  PORT: {db_settings['PORT']}")
        print(f"  NAME: {db_settings['NAME']}")
        print(f"  USER: {db_settings['USER']}")
        return None

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Экспорт контрактов в JSON')
    parser.add_argument('--output', '-o', default='contracts_export.json',
                       help='Имя выходного файла (по умолчанию: contracts_export.json)')
    
    args = parser.parse_args()
    export_contracts_to_json(args.output)