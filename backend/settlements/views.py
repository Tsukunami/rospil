from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def settlements(request):
    return HttpResponse("<h4>Расчеты с поставщиками</h4>")