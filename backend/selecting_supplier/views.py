from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def selecting_supplier(request):
    return HttpResponse("<h4>выбор поставщика</h4>")