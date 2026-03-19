from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def conclusion_contracts(request):
    return HttpResponse("<h4>Заключение договоров</h4>")