# your_app/admin.py
from django.contrib import admin
from .models import (
    SuppliersInfo, Product, SupplierWood, SuppliersContract,
    Employees, Storage, Act, Delivery, Expenditure, Roles, Users, UserRoles
)

@admin.register(SuppliersInfo)
class SuppliersInfoAdmin(admin.ModelAdmin):
    list_display = ('supplier_id', 'supplier_name', 'supplier_inn', 'supplier_phone')
    list_display_links = ('supplier_name',)
    search_fields = ('supplier_name', 'supplier_inn', 'supplier_phone')
    list_filter = ('supplier_name',)
    ordering = ('supplier_name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('wood_id', 'wood_type', 'wood_grade', 'wood_length', 'wood_cross_section', 'wood_diameter')
    list_display_links = ('wood_type',)
    search_fields = ('wood_type', 'wood_grade')
    list_filter = ('wood_type', 'wood_grade')
    ordering = ('wood_type',)


class SupplierWoodInline(admin.TabularInline):
    model = SupplierWood
    extra = 1
    fields = ('wood', 'available_quantity')
    autocomplete_fields = ['wood']


@admin.register(SupplierWood)
class SupplierWoodAdmin(admin.ModelAdmin):
    list_display = ('supplier', 'wood', 'available_quantity')
    list_display_links = ('supplier',)
    search_fields = ('supplier__supplier_name', 'wood__wood_type')
    list_filter = ('supplier__supplier_name', 'wood__wood_type')
    list_editable = ('available_quantity',)
    ordering = ('supplier__supplier_name',)


@admin.register(SuppliersContract)
class SuppliersContractAdmin(admin.ModelAdmin):
    list_display = ('suppliers_contract_id', 'contract_number', 'supplier', 'suppliers_contract_date', 
                   'suppliers_contract_status', 'suppliers_contract_cost')
    list_display_links = ('contract_number',)
    search_fields = ('contract_number', 'supplier__supplier_name')
    list_filter = ('suppliers_contract_status', 'suppliers_contract_date')
    ordering = ('-suppliers_contract_date',)
    date_hierarchy = 'suppliers_contract_date'


@admin.register(Employees)
class EmployeesAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'employee_name', 'employee_phone', 'employee_post')
    list_display_links = ('employee_name',)
    search_fields = ('employee_name', 'employee_phone', 'employee_pasport_number')
    ordering = ('employee_name',)


@admin.register(Storage)
class StorageAdmin(admin.ModelAdmin):
    list_display = ('wood', 'current_scope', 'storage_cell')
    search_fields = ('wood__wood_type', 'storage_cell')
    list_filter = ('storage_cell',)
    ordering = ('wood__wood_type',)


@admin.register(Act)
class ActAdmin(admin.ModelAdmin):
    list_display = ('act_id', 'act_type', 'act_date', 'employee')
    list_display_links = ('act_id',)
    search_fields = ('act_type', 'employee__employee_name')
    list_filter = ('act_type', 'act_date')
    date_hierarchy = 'act_date'


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('delivery_id', 'suppliers_contract', 'delivery_scope', 'delivery_date', 'delivery_status')
    list_display_links = ('delivery_id',)
    search_fields = ('suppliers_contract__contract_number', 'delivery_status')
    list_filter = ('delivery_status', 'delivery_date')
    date_hierarchy = 'delivery_date'
    list_editable = ('delivery_status',)


@admin.register(Expenditure)
class ExpenditureAdmin(admin.ModelAdmin):
    list_display = ('expenditure_id', 'wood', 'expenditure_scope_id', 'expenditure_data')
    list_display_links = ('expenditure_id',)
    search_fields = ('wood__wood_type',)
    list_filter = ('expenditure_data',)
    date_hierarchy = 'expenditure_data'


@admin.register(Roles)
class RolesAdmin(admin.ModelAdmin):
    list_display = ('role_id', 'role_name')
    search_fields = ('role_name',)


@admin.register(Users)
class UsersAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'user_name', 'user_login', 'user_phone')
    list_display_links = ('user_name',)
    search_fields = ('user_name', 'user_login', 'user_phone')
    ordering = ('user_name',)


@admin.register(UserRoles)
class UserRolesAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_display_links = ('user',)
    search_fields = ('user__user_name', 'role__role_name')
    list_filter = ('role__role_name',)