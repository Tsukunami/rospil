from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def acceptance_and_delivery(request):
    return HttpResponse("<h4>Поставка и приемка</h4>")