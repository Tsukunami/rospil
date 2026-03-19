from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def statistics(request):
    return HttpResponse("<h4>Статистика</h4>")