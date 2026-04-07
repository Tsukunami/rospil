# views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connection
from django.db.utils import IntegrityError
import uuid
from decimal import Decimal

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


def update_storage_quantity(wood_id, scope, is_add):
    """
    Вспомогательная функция для обновления количества на складе
    wood_id: ID материала
    scope: количество для добавления/удаления
    is_add: True - добавить, False - удалить
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT current_scope FROM storage WHERE wood_id = %s
            """, [wood_id])
            
            result = cursor.fetchone()
            
            if result:
                current_scope = float(result[0])
                
                if is_add:
                    new_scope = current_scope + scope
                else:
                    new_scope = current_scope - scope
                
                if new_scope < 0:
                    new_scope = 0
                
                cursor.execute("""
                    UPDATE storage 
                    SET current_scope = %s 
                    WHERE wood_id = %s
                """, [new_scope, wood_id])
                
                return True
            else:
                if is_add and scope > 0:
                    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                    row = letters[(wood_id - 1) // 10 % len(letters)]
                    col = ((wood_id - 1) % 10) + 1
                    cell_name = f"Блок-{row}{col}"
                    
                    cursor.execute("""
                        INSERT INTO storage (wood_id, current_scope, storage_cell)
                        VALUES (%s, %s, %s)
                    """, [wood_id, scope, cell_name])
                    
                    return True
                return False
                
    except Exception as e:
        print(f"Error updating storage: {e}")
        return False


def get_storage_quantity(wood_id):
    """Получает текущее количество материала на складе"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT current_scope FROM storage WHERE wood_id = %s
        """, [wood_id])
        result = cursor.fetchone()
        return float(result[0]) if result else 0


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
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            if table_name == 'expenditure':
                return handle_expenditure_create(data)
            if table_name == 'delivery':
                return handle_delivery_create(data)
            return handle_general_create(table_name, data)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Error creating record: {str(e)}'}, status=500)
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            if table_name == 'delivery':
                return handle_delivery_update(data)
            return handle_general_update(table_name, data)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Error updating record: {str(e)}'}, status=500)
    
    elif request.method == 'DELETE':
        try:
            primary_key = get_primary_key(table_name)
            record_id = request.GET.get('id')
            if not record_id:
                return JsonResponse({'error': f'Parameter id is required'}, status=400)
            if table_name == 'delivery':
                return handle_delivery_delete(record_id)
            if table_name == 'expenditure':
                return handle_expenditure_delete(record_id)
            with connection.cursor() as cursor:
                cursor.execute(f'DELETE FROM "{table_name}" WHERE {primary_key} = %s', [record_id])
                if cursor.rowcount == 0:
                    return JsonResponse({'error': 'Record not found'}, status=404)
            return JsonResponse({'success': True, 'message': 'Record deleted successfully'})
        except Exception as e:
            return JsonResponse({'error': f'Error deleting record: {str(e)}'}, status=500)


def handle_expenditure_create(data):
    """Создание расхода с автоматическим списанием со склада"""
    wood_id = data.get('wood_id')
    expenditure_scope = data.get('expenditure_scope')
    expenditure_data = data.get('expenditure_data')
    
    if not wood_id:
        return JsonResponse({'error': 'Missing required field: wood_id'}, status=400)
    if not expenditure_scope:
        return JsonResponse({'error': 'Missing required field: expenditure_scope'}, status=400)
    
    current_storage = get_storage_quantity(wood_id)
    scope = float(expenditure_scope)
    
    if current_storage < scope:
        return JsonResponse({
            'error': f'Недостаточно материала на складе. Доступно: {current_storage:.2f} м³, запрошено: {scope:.2f} м³'
        }, status=400)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO expenditure (wood_id, expenditure_scope, expenditure_data)
            VALUES (%s, %s, %s)
            RETURNING expenditure_id
        """, [wood_id, scope, expenditure_data])
        expenditure_id = cursor.fetchone()[0]
        update_storage_quantity(wood_id, scope, is_add=False)
        
    return JsonResponse({
        'success': True,
        'message': 'Expenditure created successfully',
        'id': expenditure_id
    }, status=201)


def handle_expenditure_delete(expenditure_id):
    """Удаление расхода с возвратом материала на склад"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT wood_id, expenditure_scope FROM expenditure 
            WHERE expenditure_id = %s
        """, [expenditure_id])
        record = cursor.fetchone()
        if not record:
            return JsonResponse({'error': 'Record not found'}, status=404)
        wood_id = record[0]
        scope = float(record[1]) if record[1] else 0
        if scope > 0:
            update_storage_quantity(wood_id, scope, is_add=True)
        cursor.execute("DELETE FROM expenditure WHERE expenditure_id = %s", [expenditure_id])
        
    return JsonResponse({'success': True, 'message': 'Expenditure deleted successfully'})


def handle_delivery_create(data):
    """Создание поставки с возможным автоматическим добавлением на склад"""
    suppliers_contract_id = data.get('suppliers_contract_id')
    delivery_scope = data.get('delivery_scope')
    delivery_date = data.get('delivery_date')
    delivery_status = data.get('delivery_status')
    act_id = data.get('act_id')
    wood_id = data.get('wood_id')
    
    if not suppliers_contract_id:
        return JsonResponse({'error': 'Missing required field: suppliers_contract_id'}, status=400)
    if not delivery_scope:
        return JsonResponse({'error': 'Missing required field: delivery_scope'}, status=400)
    if not delivery_date:
        return JsonResponse({'error': 'Missing required field: delivery_date'}, status=400)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO delivery (
                suppliers_contract_id, delivery_scope, delivery_date, 
                delivery_status, act_id, wood_id
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING delivery_id
        """, [suppliers_contract_id, delivery_scope, delivery_date, delivery_status, act_id, wood_id])
        delivery_id = cursor.fetchone()[0]
        if delivery_status == 'доставлено' and wood_id:
            update_storage_quantity(wood_id, float(delivery_scope), is_add=True)
        
    return JsonResponse({
        'success': True,
        'message': 'Delivery created successfully',
        'id': delivery_id
    }, status=201)


def handle_delivery_update(data):
    """Обновление поставки с автоматической корректировкой склада"""
    delivery_id = data.get('delivery_id')
    new_status = data.get('delivery_status')
    if not delivery_id:
        return JsonResponse({'error': 'Missing required field: delivery_id'}, status=400)
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT delivery_id, delivery_status, delivery_scope, wood_id 
            FROM delivery WHERE delivery_id = %s
        """, [delivery_id])
        old_delivery = cursor.fetchone()
        if not old_delivery:
            return JsonResponse({'error': 'Delivery not found'}, status=404)
        old_status = old_delivery[1]
        scope = float(old_delivery[2])
        wood_id = old_delivery[3]
        
        if old_status != new_status:
            if new_status == 'доставлено' and old_status != 'доставлено':
                if wood_id:
                    update_storage_quantity(wood_id, scope, is_add=True)
            elif old_status == 'доставлено' and new_status != 'доставлено':
                if wood_id:
                    update_storage_quantity(wood_id, scope, is_add=False)
        
        cursor.execute("""
            UPDATE delivery SET delivery_status = %s 
            WHERE delivery_id = %s
        """, [new_status, delivery_id])
        
    return JsonResponse({'success': True, 'message': 'Delivery updated successfully'})


def handle_delivery_delete(delivery_id):
    """Удаление поставки с возможным удалением со склада"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT delivery_status, delivery_scope, wood_id 
            FROM delivery WHERE delivery_id = %s
        """, [delivery_id])
        record = cursor.fetchone()
        if not record:
            return JsonResponse({'error': 'Record not found'}, status=404)
        delivery_status = record[0]
        scope = float(record[1]) if record[1] else 0
        wood_id = record[2]
        if delivery_status == 'доставлено' and wood_id and scope > 0:
            update_storage_quantity(wood_id, scope, is_add=False)
        cursor.execute("DELETE FROM delivery WHERE delivery_id = %s", [delivery_id])
        
    return JsonResponse({'success': True, 'message': 'Delivery deleted successfully'})


def handle_general_create(table_name, data):
    """Общее создание записи для таблиц без специальной логики"""
    columns, required_fields = get_table_schema(table_name)
    primary_key = get_primary_key(table_name)
    
    for field in required_fields:
        if field not in data and field != primary_key:
            return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
    
    insert_columns = []
    values = []
    for col in columns:
        if col in data:
            insert_columns.append(col)
            values.append(data[col])
        elif col == primary_key:
            continue
        elif col in required_fields:
            return JsonResponse({'error': f'Missing required field: {col}'}, status=400)
    
    if not insert_columns:
        return JsonResponse({'error': 'No valid fields to insert'}, status=400)
    
    columns_str = ', '.join([f'"{col}"' for col in insert_columns])
    placeholders_str = ', '.join(['%s'] * len(values))
    
    with connection.cursor() as cursor:
        cursor.execute(
            f'INSERT INTO "{table_name}" ({columns_str}) VALUES ({placeholders_str}) RETURNING {primary_key}',
            values
        )
        new_id = cursor.fetchone()[0]
        
    return JsonResponse({
        'success': True,
        'message': 'Record created successfully',
        'id': new_id
    }, status=201)


def handle_general_update(table_name, data):
    """Общее обновление записи для таблиц без специальной логики"""
    primary_key = get_primary_key(table_name)
    if primary_key not in data:
        return JsonResponse({'error': f'Primary key {primary_key} is required for update'}, status=400)
    
    record_id = data[primary_key]
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
        
    return JsonResponse({'success': True, 'message': 'Record updated successfully'})


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
            # Исключаем автоинкрементные первичные ключи из обязательных полей
            if row[1] == 'NO' and row[0] not in ['expenditure_id', 'delivery_id', 'act_id', 'suppliers_contract_id', 
                                                  'supplier_id', 'wood_id', 'employee_id', 'role_id', 'user_id']:
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
        pk_map = {
            'suppliers_info': 'supplier_id',
            'product': 'wood_id',
            'supplier_wood': 'id',
            'suppliers_contract': 'suppliers_contract_id',
            'employees': 'employee_id',
            'storage': 'wood_id',
            'act': 'act_id',
            'delivery': 'delivery_id',
            'expenditure': 'expenditure_id',
            'roles': 'role_id',
            'users': 'user_id',
            'user_roles': 'id'
        }
        return pk_map.get(table_name, f"{table_name}_id")


@csrf_exempt
@require_http_methods(["POST"])
def create_contract(request):
    """
    Специализированный API для создания контракта с данными о поставщике.
    Поддерживает новые поля: contract_bank, contract_bik, contract_correspondent_account.
    """
    try:
        data = json.loads(request.body)
        
        required = ['contract_number', 'supplier_name', 'contract_date']
        for field in required:
            if field not in data:
                return JsonResponse({'error': f'Missing field: {field}'}, status=400)
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT supplier_id FROM suppliers_info 
                WHERE supplier_name = %s
            """, [data['supplier_name']])
            supplier = cursor.fetchone()
            
            if supplier:
                supplier_id = supplier[0]
            else:
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
            
            # Вставка контракта с поддержкой новых полей
            cursor.execute("""
                INSERT INTO suppliers_contract (
                    supplier_id, 
                    contract_number, 
                    suppliers_contract_status,
                    suppliers_contract_cost,
                    suppliers_contract_scope,
                    suppliers_contract_date,
                    contract_bank,
                    contract_bik,
                    contract_correspondent_account
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING suppliers_contract_id
            """, [
                supplier_id,
                data['contract_number'],
                data.get('status', 'срок оплаты не наступил'),
                data.get('cost'),
                data.get('scope'),
                data['contract_date'],
                data.get('contract_bank'),
                data.get('contract_bik'),
                data.get('contract_correspondent_account')
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


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_supplier_wood(request):
    """Удаление связи поставщик-материал"""
    try:
        supplier_id = request.GET.get('supplier_id')
        wood_id = request.GET.get('wood_id')
        if not supplier_id or not wood_id:
            return JsonResponse({'error': 'supplier_id and wood_id are required'}, status=400)
        
        with connection.cursor() as cursor:
            cursor.execute("""
                DELETE FROM supplier_wood 
                WHERE supplier_id = %s AND wood_id = %s
                RETURNING supplier_id
            """, [supplier_id, wood_id])
            if cursor.rowcount == 0:
                return JsonResponse({'error': 'Record not found'}, status=404)
            
        return JsonResponse({'success': True, 'message': 'Supplier wood relation deleted successfully'})
        
    except Exception as e:
        return JsonResponse({'error': f'Error deleting relation: {str(e)}'}, status=500)