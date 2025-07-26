from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from .serializers import RegisterSerializer, LoginSerializer

class RegisterView(APIView):
    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        if ser.is_valid():
            user = ser.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'message':'Usuario registrado','token':token.key},status=201)
        return Response(ser.errors, status=400)

class LoginView(APIView):
    def post(self, request):
        ser = LoginSerializer(data=request.data)
        if ser.is_valid():
            user = ser.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'message':'Login exitoso','token':token.key},status=200)
        return Response(ser.errors, status=400)
