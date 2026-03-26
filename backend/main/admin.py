# your_app/admin.py
from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError
from .models import (
    SuppliersInfo, Product, SupplierWood, SuppliersContract,
    Employees, Storage, Act, Delivery, Expenditure, Roles, Users, UserRoles
)


# ==================== SupplierWood ====================
class SupplierWoodForm(forms.ModelForm):
    class Meta:
        model = SupplierWood
        fields = ['supplier', 'wood', 'available_quantity']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['supplier'].queryset = SuppliersInfo.objects.all().order_by('supplier_name')
        self.fields['wood'].queryset = Product.objects.all().order_by('wood_type')
    
    def clean(self):
        cleaned_data = super().clean()
        supplier = cleaned_data.get('supplier')
        wood = cleaned_data.get('wood')
        
        if supplier and wood:
            current_supplier_id = getattr(self.instance, 'supplier_id', None)
            current_wood_id = getattr(self.instance, 'wood_id', None)
            
            exists = SupplierWood.objects.filter(supplier=supplier, wood=wood)
            if current_supplier_id and current_wood_id:
                exists = exists.exclude(supplier_id=current_supplier_id, wood_id=current_wood_id)
            
            if exists.exists():
                raise ValidationError('Такая связь уже существует')
        
        return cleaned_data


@admin.register(SupplierWood)
class SupplierWoodAdmin(admin.ModelAdmin):
    form = SupplierWoodForm
    list_display = ('id', 'supplier', 'wood', 'available_quantity')
    list_display_links = ('id', 'supplier', 'wood')
    search_fields = ('supplier__supplier_name', 'wood__wood_type')
    list_filter = ('supplier__supplier_name', 'wood__wood_type')
    list_editable = ('available_quantity',)
    ordering = ('supplier__supplier_name',)
    list_per_page = 20
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('supplier', 'wood')


# ==================== UserRoles ====================
class UserRolesForm(forms.ModelForm):
    class Meta:
        model = UserRoles
        fields = ['user', 'role']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['user'].queryset = Users.objects.all().order_by('user_name')
        self.fields['role'].queryset = Roles.objects.all().order_by('role_name')
    
    def clean(self):
        cleaned_data = super().clean()
        user = cleaned_data.get('user')
        role = cleaned_data.get('role')
        
        if user and role:
            current_user_id = getattr(self.instance, 'user_id', None)
            current_role_id = getattr(self.instance, 'role_id', None)
            
            exists = UserRoles.objects.filter(user=user, role=role)
            if current_user_id and current_role_id:
                exists = exists.exclude(user_id=current_user_id, role_id=current_role_id)
            
            if exists.exists():
                raise ValidationError(f'Роль "{role}" уже назначена пользователю "{user.user_name}"')
        
        return cleaned_data


@admin.register(UserRoles)
class UserRolesAdmin(admin.ModelAdmin):
    form = UserRolesForm
    list_display = ('id', 'user', 'role')
    list_display_links = ('id', 'user')
    search_fields = ('user__user_name', 'role__role_name')
    list_filter = ('role__role_name', 'user__user_name')
    ordering = ('user__user_name', 'role__role_name')
    list_per_page = 20
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'role')


# ==================== SuppliersInfo ====================
class SupplierWoodInline(admin.TabularInline):
    model = SupplierWood
    extra = 1
    fields = ('wood', 'available_quantity')
    autocomplete_fields = ['wood']
    verbose_name = 'Материал поставщика'
    verbose_name_plural = 'Материалы поставщика'
    can_delete = False
    show_change_link = True
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('wood')
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SuppliersInfo)
class SuppliersInfoAdmin(admin.ModelAdmin):
    list_display = ('supplier_id', 'supplier_name', 'supplier_inn', 'supplier_phone')
    list_display_links = ('supplier_name',)
    search_fields = ('supplier_name', 'supplier_inn', 'supplier_phone')
    list_filter = ('supplier_name',)
    ordering = ('supplier_name',)
    list_per_page = 20
    inlines = [SupplierWoodInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('supplier_name', 'supplier_inn', 'supplier_phone', 'supplier_address')
        }),
    )


# ==================== Product ====================
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('wood_id', 'wood_type', 'wood_grade', 'wood_length', 'wood_cross_section', 'wood_diameter')
    list_display_links = ('wood_type',)
    search_fields = ('wood_type', 'wood_grade')
    list_filter = ('wood_type', 'wood_grade')
    ordering = ('wood_type',)
    list_per_page = 20
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('wood_type', 'wood_grade')
        }),
        ('Размеры', {
            'fields': ('wood_length', 'wood_diameter', 'wood_the_upper_end_diameter', 
                      'wood_lower_end_diameter', 'wood_graduation', 'wood_cross_section')
        }),
    )


# ==================== SuppliersContract ====================
class ContractStatusFilter(admin.SimpleListFilter):
    title = 'Статус контракта'
    parameter_name = 'contract_status'
    
    def lookups(self, request, model_admin):
        return (
            ('срок оплаты не наступил', 'Срок оплаты не наступил'),
            ('оплачено', 'Оплачено'),
            ('просрочено', 'Просрочено'),
        )
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(suppliers_contract_status=self.value())
        return queryset


class DeliveryInline(admin.TabularInline):
    model = Delivery
    extra = 0
    fields = ('delivery_id', 'delivery_scope', 'delivery_date', 'delivery_status', 'act')
    readonly_fields = ('delivery_id',)
    can_delete = True
    verbose_name = 'Поставка'
    verbose_name_plural = 'Поставки по контракту'
    autocomplete_fields = ['act']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('act')


@admin.register(SuppliersContract)
class SuppliersContractAdmin(admin.ModelAdmin):
    list_display = ('contract_number', 'supplier', 'suppliers_contract_date', 
                   'suppliers_contract_status', 'suppliers_contract_cost', 'suppliers_contract_scope')
    list_display_links = ('contract_number',)
    search_fields = ('contract_number', 'supplier__supplier_name')
    list_filter = (ContractStatusFilter, 'suppliers_contract_date')
    ordering = ('-suppliers_contract_date',)
    date_hierarchy = 'suppliers_contract_date'
    list_per_page = 20
    list_editable = ('suppliers_contract_status',)
    inlines = [DeliveryInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('contract_number', 'supplier', 'suppliers_contract_date')
        }),
        ('Финансовая информация', {
            'fields': ('suppliers_contract_cost', 'suppliers_contract_scope', 'suppliers_contract_status')
        }),
    )


# ==================== Employees ====================
@admin.register(Employees)
class EmployeesAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'employee_name', 'employee_phone', 'employee_post')
    list_display_links = ('employee_name',)
    search_fields = ('employee_name', 'employee_phone', 'employee_pasport_number')
    ordering = ('employee_name',)
    list_per_page = 20


# ==================== Storage ====================
@admin.register(Storage)
class StorageAdmin(admin.ModelAdmin):
    list_display = ('wood', 'current_scope', 'storage_cell')
    list_display_links = ('wood',)
    search_fields = ('wood__wood_type', 'storage_cell')
    list_filter = ('storage_cell',)
    ordering = ('wood__wood_type',)
    list_per_page = 20
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('wood')


# ==================== Act ====================
@admin.register(Act)
class ActAdmin(admin.ModelAdmin):
    list_display = ('act_id', 'act_type', 'act_date', 'employee')
    list_display_links = ('act_id',)
    search_fields = ('act_type', 'employee__employee_name')
    list_filter = ('act_type', 'act_date')
    date_hierarchy = 'act_date'
    list_per_page = 20
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('employee')


# ==================== Delivery ====================
class DeliveryStatusFilter(admin.SimpleListFilter):
    title = 'Статус поставки'
    parameter_name = 'delivery_status'
    
    def lookups(self, request, model_admin):
        return (
            ('ожидается', 'Ожидается'),
            ('доставлено', 'Доставлено'),
            ('нарушение', 'Нарушение'),
        )
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(delivery_status=self.value())
        return queryset


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('delivery_id', 'suppliers_contract', 'delivery_scope', 'delivery_date', 'delivery_status')
    list_display_links = ('delivery_id',)
    search_fields = ('suppliers_contract__contract_number', 'delivery_status')
    list_filter = (DeliveryStatusFilter, 'delivery_date')
    date_hierarchy = 'delivery_date'
    list_editable = ('delivery_status',)
    list_per_page = 20
    autocomplete_fields = ['suppliers_contract', 'act']
    raw_id_fields = ('suppliers_contract',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('suppliers_contract', 'act')


# ==================== Expenditure ====================
@admin.register(Expenditure)
class ExpenditureAdmin(admin.ModelAdmin):
    list_display = ('expenditure_id', 'wood', 'expenditure_scope', 'expenditure_data')
    list_display_links = ('expenditure_id',)
    search_fields = ('wood__wood_type',)
    list_filter = ('expenditure_data',)
    date_hierarchy = 'expenditure_data'
    list_per_page = 20
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('wood')


# ==================== Roles ====================
@admin.register(Roles)
class RolesAdmin(admin.ModelAdmin):
    list_display = ('role_id', 'role_name')
    search_fields = ('role_name',)
    list_per_page = 20


# ==================== Users ====================
@admin.register(Users)
class UsersAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'user_name', 'user_login', 'user_phone')
    list_display_links = ('user_name',)
    search_fields = ('user_name', 'user_login', 'user_phone')
    ordering = ('user_name',)
    list_per_page = 20
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user_name', 'user_login', 'user_password', 'user_phone')
        }),
    )