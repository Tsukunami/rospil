import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connection
from django.db.utils import IntegrityError
import uuid

def dictfetchall(cursor):
    """Возвращает все строки из курсора в виде словарей"""
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

def export_all_data(request):
    """Возвращает все данные из базы в JSON."""
    tables = []
    with connection.cursor() as cursor:
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
            cursor.execute(f'SELECT * FROM "{table}" ORDER BY 1')
            result[table] = dictfetchall(cursor)
    
    return JsonResponse(result, safe=False, json_dumps_params={'ensure_ascii': False, 'indent': 2})

@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def universal_api(request, table_name):
    """
    Универсальный API для работы с любой таблицей
    GET: получение всех записей или одной по ID
    POST: создание новой записи
    PUT: обновление записи
    DELETE: удаление записи
    """
    # Проверяем существование таблицы
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """, [table_name])
        if not cursor.fetchone()[0]:
            return JsonResponse({'error': f'Table {table_name} not found'}, status=404)
    
    # GET - получение данных
    if request.method == 'GET':
        primary_key = get_primary_key(table_name)
        id_param = request.GET.get('id')
        
        with connection.cursor() as cursor:
            if id_param:
                cursor.execute(f'SELECT * FROM "{table_name}" WHERE {primary_key} = %s', [id_param])
                rows = dictfetchall(cursor)
                if not rows:
                    return JsonResponse({'error': 'Record not found'}, status=404)
                return JsonResponse(rows[0], safe=False)
            else:
                cursor.execute(f'SELECT * FROM "{table_name}" ORDER BY {primary_key}')
                return JsonResponse(dictfetchall(cursor), safe=False)
    
    # POST - создание записи
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Получаем структуру таблицы
            columns, required_fields = get_table_schema(table_name)
            primary_key = get_primary_key(table_name)
            
            # Проверяем обязательные поля
            for field in required_fields:
                if field not in data and field != primary_key:
                    return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
            
            # Формируем SQL запрос
            insert_columns = [col for col in columns if col in data or (col == primary_key and col not in data)]
            values = []
            placeholders = []
            
            for col in insert_columns:
                if col in data:
                    values.append(data[col])
                elif col == primary_key:
                    # Если первичный ключ не указан, генерируем для некоторых типов
                    values.append('DEFAULT')
                    placeholders.append('DEFAULT')
                    continue
                else:
                    values.append(None)
                placeholders.append('%s')
            
            # Удаляем DEFAULT из placeholders и values
            actual_values = []
            actual_placeholders = []
            for i, (col, val) in enumerate(zip(insert_columns, values)):
                if val != 'DEFAULT':
                    actual_values.append(val)
                    actual_placeholders.append('%s')
            
            columns_str = ', '.join([f'"{col}"' for col in insert_columns if values[insert_columns.index(col)] != 'DEFAULT'])
            placeholders_str = ', '.join(actual_placeholders)
            
            if not columns_str:
                return JsonResponse({'error': 'No valid fields to insert'}, status=400)
            
            with connection.cursor() as cursor:
                cursor.execute(
                    f'INSERT INTO "{table_name}" ({columns_str}) VALUES ({placeholders_str}) RETURNING {primary_key}',
                    actual_values
                )
                new_id = cursor.fetchone()[0]
                
            return JsonResponse({
                'success': True,
                'message': 'Record created successfully',
                'id': new_id
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except IntegrityError as e:
            return JsonResponse({'error': f'Database integrity error: {str(e)}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Error creating record: {str(e)}'}, status=500)
    
    # PUT - обновление записи
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            primary_key = get_primary_key(table_name)
            
            if primary_key not in data:
                return JsonResponse({'error': f'Primary key {primary_key} is required for update'}, status=400)
            
            record_id = data[primary_key]
            
            # Формируем SET часть запроса
            set_clauses = []
            values = []
            for key, value in data.items():
                if key != primary_key:
                    set_clauses.append(f'"{key}" = %s')
                    values.append(value)
            
            if not set_clauses:
                return JsonResponse({'error': 'No fields to update'}, status=400)
            
            values.append(record_id)
            
            with connection.cursor() as cursor:
                cursor.execute(
                    f'UPDATE "{table_name}" SET {", ".join(set_clauses)} WHERE {primary_key} = %s',
                    values
                )
                
                if cursor.rowcount == 0:
                    return JsonResponse({'error': 'Record not found'}, status=404)
                
            return JsonResponse({
                'success': True,
                'message': 'Record updated successfully'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Error updating record: {str(e)}'}, status=500)
    
    # DELETE - удаление записи
    elif request.method == 'DELETE':
        try:
            primary_key = get_primary_key(table_name)
            record_id = request.GET.get('id')
            
            if not record_id:
                return JsonResponse({'error': f'Parameter id is required'}, status=400)
            
            with connection.cursor() as cursor:
                cursor.execute(f'DELETE FROM "{table_name}" WHERE {primary_key} = %s', [record_id])
                
                if cursor.rowcount == 0:
                    return JsonResponse({'error': 'Record not found'}, status=404)
                
            return JsonResponse({
                'success': True,
                'message': 'Record deleted successfully'
            })
            
        except Exception as e:
            return JsonResponse({'error': f'Error deleting record: {str(e)}'}, status=500)

def get_table_schema(table_name):
    """Получает структуру таблицы"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                column_name,
                is_nullable,
                data_type
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = %s
            ORDER BY ordinal_position;
        """, [table_name])
        
        columns = []
        required_fields = []
        for row in cursor.fetchall():
            columns.append(row[0])
            if row[1] == 'NO':
                required_fields.append(row[0])
        
        return columns, required_fields

def get_primary_key(table_name):
    """Получает имя первичного ключа таблицы"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
                AND tc.table_name = %s
            LIMIT 1;
        """, [table_name])
        
        result = cursor.fetchone()
        if result:
            return result[0]
        # Если не нашли, пробуем стандартные имена
        return f"{table_name}_id"

@csrf_exempt
@require_http_methods(["POST"])
def create_contract(request):
    """
    Специализированный API для создания контракта с данными о поставщике
    """
    try:
        data = json.loads(request.body)
        
        # Проверяем обязательные поля
        required = ['contract_number', 'supplier_name', 'contract_date']
        for field in required:
            if field not in data:
                return JsonResponse({'error': f'Missing field: {field}'}, status=400)
        
        with connection.cursor() as cursor:
            # Проверяем или создаем поставщика
            cursor.execute("""
                SELECT supplier_id FROM suppliers_info 
                WHERE supplier_name = %s
            """, [data['supplier_name']])
            
            supplier = cursor.fetchone()
            
            if supplier:
                supplier_id = supplier[0]
            else:
                # Создаем нового поставщика
                cursor.execute("""
                    INSERT INTO suppliers_info (supplier_name, supplier_address, supplier_phone, supplier_inn)
                    VALUES (%s, %s, %s, %s)
                    RETURNING supplier_id
                """, [
                    data['supplier_name'],
                    data.get('supplier_address', ''),
                    data.get('supplier_phone', ''),
                    data.get('supplier_inn', str(uuid.uuid4().int)[:12])
                ])
                supplier_id = cursor.fetchone()[0]
            
            # Создаем контракт
            cursor.execute("""
                INSERT INTO suppliers_contract (
                    supplier_id, 
                    contract_number, 
                    suppliers_contract_status,
                    suppliers_contract_cost,
                    suppliers_contract_scope,
                    suppliers_contract_date
                ) VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING suppliers_contract_id
            """, [
                supplier_id,
                data['contract_number'],
                data.get('status', 'срок оплаты не наступил'),
                data.get('cost'),
                data.get('scope'),
                data['contract_date']
            ])
            
            contract_id = cursor.fetchone()[0]
            
            return JsonResponse({
                'success': True,
                'message': 'Contract created successfully',
                'contract_id': contract_id,
                'supplier_id': supplier_id
            }, status=201)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Error creating contract: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_suppliers(request):
    """Получает список поставщиков для выбора"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT supplier_id, supplier_name 
            FROM suppliers_info 
            ORDER BY supplier_name
        """)
        suppliers = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    
    return JsonResponse(suppliers, safe=False)


# В функции universal_api уже есть поддержка PUT, но нужно убедиться, 
# что она правильно работает с составным ключом (supplier_id, wood_id)

# Для supplier_wood нужно специальное обновление, так как у него составной ключ
@csrf_exempt
@require_http_methods(["PUT"])
def update_supplier_wood(request):
    """Специализированное обновление доступного количества материала у поставщика"""
    try:
        data = json.loads(request.body)
        
        supplier_id = data.get('supplier_id')
        wood_id = data.get('wood_id')
        available_quantity = data.get('available_quantity')
        
        if not supplier_id or not wood_id:
            return JsonResponse({'error': 'supplier_id and wood_id are required'}, status=400)
        
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE supplier_wood 
                SET available_quantity = %s 
                WHERE supplier_id = %s AND wood_id = %s
                RETURNING supplier_id
            """, [available_quantity, supplier_id, wood_id])
            
            if cursor.fetchone() is None:
                return JsonResponse({'error': 'Record not found'}, status=404)
            
        return JsonResponse({'success': True, 'message': 'Quantity updated successfully'})
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Error updating quantity: {str(e)}'}, status=500)

