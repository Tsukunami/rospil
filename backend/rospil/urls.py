from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('main.urls')),
    path('selecting_supplier', include('selecting_supplier.urls')), 
    path('conclusion_contracts', include('conclusion_contracts.urls')),
    path('acceptance_and_delivery', include('acceptance_and_delivery.urls')),
    path('settlements', include('settlements.urls')),
    path('statistics', include('statistics_company.urls')),
]