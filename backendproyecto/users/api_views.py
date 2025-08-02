
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
#from django.contrib.auth.models import User
#from django.db import IntegrityError
from .serializers import RegisterSerializer, CursoSerializer
from .models import Curso
from django.shortcuts import get_object_or_404
import random



#importaciones para talleres, videos y pruebas
from .models import Curso, Video, Taller, Prueba
from .serializers import VideoSerializer, TallerSerializer, PruebaSerializer




class CustomLoginView(ObtainAuthToken):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                         context={'request': request})
        if not serializer.is_valid():
            return Response(
                {'error': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'user_type': 'student' if user.username.startswith('E') else 'teacher'
        })


class RegisterView(APIView):
    permission_classes=[AllowAny]
    
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



class CursoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtener todos los cursos del profesor"""
        cursos = Curso.objects.filter(profesor=request.user)
        serializer = CursoSerializer(cursos, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Crear nuevo curso"""
        try:
            data = request.data.copy()
            data['profesor'] = request.user.id
            
            serializer = CursoSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(
                {'error': 'Error de validación', 'detalles': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Error en el servidor', 'detalle': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Elimina la clase CursoCreateView ya que ahora está integrada en CursoListView


class CursoDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        curso = get_object_or_404(Curso, pk=pk, profesor=request.user)
        serializer = CursoSerializer(curso)
        return Response(serializer.data)

    def put(self, request, pk):
        curso = get_object_or_404(Curso, pk=pk, profesor=request.user)
        serializer = CursoSerializer(curso, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        curso = get_object_or_404(Curso, pk=pk, profesor=request.user)
        curso.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)




# Modulo para talleres, videos y pruebas
class ActividadesCursoView(APIView):
    permission_classes = [IsAuthenticated]

    def get_curso(self, pk):
        return get_object_or_404(Curso, pk=pk, profesor=self.request.user)

class VideoView(ActividadesCursoView):
    def post(self, request, curso_id):
        curso = self.get_curso(curso_id)
        data = request.data.copy()
        data['curso'] = curso.id
        
        serializer = VideoSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, curso_id):
        curso = self.get_curso(curso_id)
        videos = Video.objects.filter(curso=curso)
        serializer = VideoSerializer(videos, many=True)
        return Response(serializer.data)

class TallerView(ActividadesCursoView):
    def post(self, request, curso_id):
        curso = self.get_curso(curso_id)
        data = request.data.copy()
        data['curso'] = curso.id
        
        serializer = TallerSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, curso_id):
        curso = self.get_curso(curso_id)
        talleres = Taller.objects.filter(curso=curso)
        serializer = TallerSerializer(talleres, many=True)
        return Response(serializer.data)

class PruebaView(ActividadesCursoView):
    def post(self, request, curso_id):
        curso = self.get_curso(curso_id)
        data = request.data.copy()
        data['curso'] = curso.id
        
        serializer = PruebaSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, curso_id):
        curso = self.get_curso(curso_id)
        pruebas = Prueba.objects.filter(curso=curso)
        serializer = PruebaSerializer(pruebas, many=True)
        return Response(serializer.data)




# Modulo para inscripciones a cursos
class UnirseCursoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        codigo = request.data.get('codigo')
        try:
            curso = Curso.objects.get(codigo=codigo)
            curso.estudiantes.add(request.user)
            return Response(
                {'mensaje': 'Te has unido al curso exitosamente'},
                status=status.HTTP_200_OK
            )
        except Curso.DoesNotExist:
            return Response(
                {'error': 'Código de curso inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )