from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    return render(request, 'main/index.html')

import json
from django.http import JsonResponse
from django.db import connection

def export_all_data(request):
    """Возвращает все данные из базы в JSON."""
    tables = []
    with connection.cursor() as cursor:
        # Получаем список всех таблиц (исключаем служебные)
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
              AND table_name NOT LIKE 'django_%'
              AND table_name NOT LIKE 'auth_%'
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cursor.fetchall()]
    
    result = {}
    for table in tables:
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT * FROM "{table}"')
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            data = []
            for row in rows:
                row_dict = {}
                for i, value in enumerate(row):
                    # Конвертируем специальные типы
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    elif isinstance(value, bytes):
                        value = value.decode('utf-8', errors='ignore')
                    row_dict[columns[i]] = value
                data.append(row_dict)
            result[table] = data
    
    return JsonResponse(result, safe=False, json_dumps_params={'ensure_ascii': False, 'indent': 2})