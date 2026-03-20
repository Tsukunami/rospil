from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='home'),
    path('api/export/all/', views.export_all_data, name='export_all_data'),
]