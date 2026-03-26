# urls.py
from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('main.urls')),
    path('selecting_supplier', include('selecting_supplier.urls')), 
    path('conclusion_contracts', include('conclusion_contracts.urls')),
    path('acceptance_and_delivery', include('acceptance_and_delivery.urls')),
    path('settlements', include('settlements.urls')),
    path('statistics', include('statistics_company.urls')),
    
    # API endpoints
    path('api/export/all/', views.export_all_data, name='export_all_data'),
    path('api/table/<str:table_name>/', views.universal_api, name='universal_api'),
    path('api/contract/create/', views.create_contract, name='create_contract'),
    path('api/suppliers/', views.get_suppliers, name='get_suppliers'),
    path('api/supplier_wood/update/', views.update_supplier_wood, name='update_supplier_wood'),
    path('api/supplier_wood/delete/', views.delete_supplier_wood, name='delete_supplier_wood'),
]