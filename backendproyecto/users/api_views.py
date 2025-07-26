from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, LoginSerializer
import re

class RegisterView(APIView):
    def post(self, request):
        # Validación del formato del username
        username = request.data.get('username', '')
        if not re.match(r'^(E|P)\d{2,}$', username):
            return Response(
                {'username': 'El nombre de usuario debe comenzar con E (Estudiante) o P (Profesor) seguido de al menos 2 números (Ej: E01 o P123)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ser = RegisterSerializer(data=request.data)
        if ser.is_valid():
            user = ser.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    'message': 'Usuario registrado',
                    'token': token.key,
                    'user_type': 'student' if username.startswith('E') else 'teacher'
                },
                status=status.HTTP_201_CREATED
            )
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            if not username or not password:
                return Response(
                    {'non_field_errors': ['Usuario y contraseña requeridos']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = authenticate(username=username, password=password)
            
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'message': 'Login exitoso',
                    'token': token.key,
                    'username': user.username
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'non_field_errors': ['Credenciales inválidas']},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except Exception as e:
            return Response(
                {'non_field_errors': [str(e)]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )