from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from .models import Users
import jwt
import datetime
import json
from django.conf import settings

def loginPage(request):
    return render(request, "index.html")

@csrf_exempt
def login(request):
    try:
        user = Users.objects.get(email=request.GET["email"], password=request.GET["password"])
    except Users.DoesNotExist:
        user = None
    if user is None:
        return JsonResponse({"flag": "0", "name": ""})
    payload = {'user_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60)}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return JsonResponse({"flag": "1", "name": user.name, "token":token})

@csrf_exempt
def addUser(request):
    try:
        data = json.loads(request.body)
        email = data["email"]
        name = data["name"]
        password = data["password"]
        if Users.objects.filter(email=email).exists():
            return HttpResponse("Already there")
        user = Users.objects.create(email=email,name=name,password=password)
        user.save()
        return HttpResponse(str(user.id))
    except Exception as e:
        print(str(e))
