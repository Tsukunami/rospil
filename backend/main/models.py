# your_app/models.py
from django.db import models

class SuppliersInfo(models.Model):
    supplier_id = models.AutoField(primary_key=True)
    supplier_name = models.CharField(max_length=255)
    supplier_address = models.TextField(blank=True, null=True)
    supplier_phone = models.CharField(max_length=20, blank=True, null=True)
    supplier_inn = models.CharField(unique=True, max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'suppliers_info'
        verbose_name = 'Поставщик'
        verbose_name_plural = 'Поставщики'

    def __str__(self):
        return self.supplier_name


class Product(models.Model):
    wood_id = models.AutoField(primary_key=True)
    wood_type = models.CharField(max_length=100, blank=True, null=True)
    wood_grade = models.CharField(max_length=50, blank=True, null=True)
    wood_length = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    wood_diameter = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    wood_the_upper_end_diameter = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    wood_lower_end_diameter = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    wood_graduation = models.CharField(max_length=50, blank=True, null=True)
    wood_cross_section = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'product'
        verbose_name = 'Материал'
        verbose_name_plural = 'Материалы'

    def __str__(self):
        name = self.wood_type or 'Без типа'
        if self.wood_grade:
            name += f" ({self.wood_grade})"
        if self.wood_length:
            name += f" - {self.wood_length}мм"
        if self.wood_cross_section:
            name += f" - {self.wood_cross_section}"
        return name


class SupplierWood(models.Model):
    id = models.AutoField(primary_key=True)
    supplier = models.ForeignKey(
        SuppliersInfo, 
        models.DO_NOTHING, 
        db_column='supplier_id'
    )
    wood = models.ForeignKey(
        Product, 
        models.DO_NOTHING, 
        db_column='wood_id'
    )
    available_quantity = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = 'supplier_wood'
        constraints = [
            models.UniqueConstraint(
                fields=['supplier', 'wood'], 
                name='unique_supplier_wood_pair'
            )
        ]
        verbose_name = 'Материал поставщика'
        verbose_name_plural = 'Материалы поставщиков'

    def __str__(self):
        return f"{self.supplier.supplier_name} - {self.wood}"


class SuppliersContract(models.Model):
    suppliers_contract_id = models.AutoField(primary_key=True)
    supplier = models.ForeignKey(SuppliersInfo, models.DO_NOTHING, db_column='supplier_id')
    contract_number = models.CharField(max_length=100)
    suppliers_contract_status = models.TextField()
    suppliers_contract_cost = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    suppliers_contract_scope = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    suppliers_contract_date = models.DateField()

    class Meta:
        managed = False
        db_table = 'suppliers_contract'
        verbose_name = 'Контракт поставщика'
        verbose_name_plural = 'Контракты поставщиков'

    def __str__(self):
        return f"Контракт {self.contract_number} - {self.supplier.supplier_name}"


class Employees(models.Model):
    employee_id = models.AutoField(primary_key=True)
    employee_name = models.CharField(max_length=255)
    employee_pasport_number = models.CharField(unique=True, max_length=50)
    employee_phone = models.CharField(max_length=20, blank=True, null=True)
    employee_post = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'employees'
        verbose_name = 'Сотрудник'
        verbose_name_plural = 'Сотрудники'

    def __str__(self):
        return self.employee_name


class Storage(models.Model):
    wood = models.OneToOneField(Product, models.DO_NOTHING, primary_key=True, db_column='wood_id')
    current_scope = models.DecimalField(max_digits=10, decimal_places=2)
    storage_cell = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'storage'
        verbose_name = 'Склад'
        verbose_name_plural = 'Склад'

    def __str__(self):
        return f"{self.wood} - {self.current_scope} м³"


class Act(models.Model):
    act_id = models.AutoField(primary_key=True)
    act_type = models.TextField()
    act_date = models.DateField()
    employee = models.ForeignKey(Employees, models.DO_NOTHING, db_column='employee_id')

    class Meta:
        managed = False
        db_table = 'act'
        verbose_name = 'Акт'
        verbose_name_plural = 'Акты'

    def __str__(self):
        return f"Акт {self.act_id} от {self.act_date}"


class Delivery(models.Model):
    delivery_id = models.AutoField(primary_key=True)
    suppliers_contract = models.ForeignKey(SuppliersContract, models.DO_NOTHING, db_column='suppliers_contract_id')
    delivery_scope = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_date = models.DateField()
    delivery_status = models.TextField()
    act = models.ForeignKey(Act, models.DO_NOTHING, db_column='act_id')

    class Meta:
        managed = False
        db_table = 'delivery'
        verbose_name = 'Поставка'
        verbose_name_plural = 'Поставки'

    def __str__(self):
        return f"Поставка {self.delivery_id} от {self.delivery_date}"


class Expenditure(models.Model):
    expenditure_id = models.AutoField(primary_key=True)
    wood = models.ForeignKey(Product, models.DO_NOTHING, db_column='wood_id')
    expenditure_scope = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    expenditure_data = models.DateField()

    class Meta:
        managed = False
        db_table = 'expenditure'
        verbose_name = 'Расход'
        verbose_name_plural = 'Расходы'

    def __str__(self):
        return f"Расход {self.expenditure_id} от {self.expenditure_data}"


class Roles(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.TextField(unique=True)

    class Meta:
        managed = False
        db_table = 'roles'
        verbose_name = 'Роль'
        verbose_name_plural = 'Роли'

    def __str__(self):
        return self.role_name


class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    user_name = models.CharField(max_length=255)
    user_login = models.CharField(unique=True, max_length=100)
    user_password = models.CharField(max_length=255)
    user_phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.user_name


class UserRoles(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, models.DO_NOTHING, db_column='user_id')
    role = models.ForeignKey(Roles, models.DO_NOTHING, db_column='role_id')

    class Meta:
        managed = False
        db_table = 'user_roles'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'role'], 
                name='unique_user_roles_pair'
            )
        ]
        verbose_name = 'Роль пользователя'
        verbose_name_plural = 'Роли пользователей'

    def __str__(self):
        return f"{self.user.user_name} - {self.role.role_name}"