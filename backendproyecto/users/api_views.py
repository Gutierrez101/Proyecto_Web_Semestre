from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, LoginSerializer
import random

class RegisterView(APIView):
    def post(self, request):
        email = request.data.get('email', '').lower()
        is_student = email.endswith('@gmail.com')  # Cambia esto según tu dominio
        is_teacher = email.endswith('@espe.edu.ec')     # Cambia esto según tu dominio
        
        if not (is_student or is_teacher):
            return Response(
                {'email': 'El correo debe ser de dominio @estudiante.com o @docente.com'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generar código automático
        prefix = 'E' if is_student else 'P'
        random_number = random.randint(100, 999)
        generated_username = f"{prefix}{random_number}"

        # Crear nuevo data dict con el username generado
        modified_data = request.data.copy()
        modified_data['username'] = generated_username

        ser = RegisterSerializer(data=modified_data)
        if ser.is_valid():
            user = ser.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'message': 'Usuario registrado',
                'token': token.key,
                'username': generated_username,
                'user_type': 'student' if is_student else 'teacher'
            }, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        ser = LoginSerializer(data=request.data)
        if ser.is_valid():
            user = ser.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            
            # Determinar tipo de usuario basado en el username
            username = user.username
            user_type = 'student' if username.startswith('E') else 'teacher'
            
            return Response({
                'message': 'Login exitoso',
                'token': token.key,
                'user_type': user_type,
                'username': username
            }, status=status.HTTP_200_OK)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)