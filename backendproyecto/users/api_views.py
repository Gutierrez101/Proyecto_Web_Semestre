
#Librerias e importaciones
from django.db.models import Q
from django.http import Http404, FileResponse, HttpResponse
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from datetime import timedelta
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from rest_framework.authentication import TokenAuthentication
from .serializers import RegisterSerializer, CursoSerializer
from .models import Curso, VideoAccessToken
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.files.storage import default_storage
from datetime import datetime
import cv2
import numpy as np
import mediapipe as mp
import os
import json
import re
import logging
import random
import xml.etree.ElementTree as ET


logger=logging.getLogger(__name__)

#importaciones para talleres, videos y pruebas
from .models import Curso, Video, Taller, Prueba, AttentionResult, ResultadoPrueba, VideoAttention, TallerEnviado
from .serializers import VideoSerializer, TallerSerializer, PruebaSerializer




@api_view(['POST'])
# api_views.py - Actualización en verify_attention
@api_view(['POST'])
def save_attention_results(request, video_id):
    """
    Guarda los resultados del monitoreo de atención para un video
    """
    try:
        # Verificar autenticación
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Usuario no autenticado'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Obtener el video
        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist:
            return Response(
                {'error': 'Video no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar que el usuario es estudiante del curso
        if request.user not in video.curso.estudiantes.all():
            return Response(
                {'error': 'No estás inscrito en este curso'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validar datos de entrada
        required_fields = ['start_time', 'end_time', 'attention_percentage', 'attention_data']
        if not all(field in request.data for field in required_fields):
            return Response(
                {'error': 'Faltan campos requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Procesar datos de atención
        try:
            attention_data = request.data['attention_data']
            if isinstance(attention_data, str):
                attention_data = json.loads(attention_data)
        except json.JSONDecodeError:
            return Response(
                {'error': 'Formato inválido para attention_data'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear el registro
        result = AttentionResult.objects.create(
            video=video,
            student=request.user,
            start_time=datetime.fromisoformat(request.data['start_time']),
            end_time=datetime.fromisoformat(request.data['end_time']),
            attention_percentage=float(request.data['attention_percentage']),
            attention_data=attention_data
        )

        return Response({
            'status': 'success',
            'message': 'Resultados guardados correctamente',
            'data': {
                'result_id': result.id,
                'video_id': video.id,
                'student_id': request.user.id,
                'attention_percentage': result.attention_percentage,
                'duration_seconds': (result.end_time - result.start_time).total_seconds()
            }
        }, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response(
            {'error': f'Error en el formato de datos: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error inesperado al guardar resultados: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Error interno del servidor'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )





def verify_attention(request, video_id):
    try:
        if not request.user.is_authenticated:
            return Response({'error':'No autenticado'}, status=401)

        video = Video.objects.get(id=video_id)
        
        # Verificar que el frame venga en la solicitud
        if 'frame' not in request.FILES:
            return Response({'error': 'Se requiere un frame de la cámara'}, status=400)
        
        # Obtener los bytes de la imagen
        frame_file = request.FILES['frame']
        
        # Leer la imagen directamente sin guardarla
        frame_data = frame_file.read()
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return Response({'error':'No se puede decodificar la imagen'}, status=400)

        # Procesamiento en memoria
        attention_result = analyze_attention_with_mediapipe(frame)
        
        if not attention_result['is_paying_attention']:
            return Response({
                'error': 'Atención insuficiente',
                'details': attention_result
            }, status=403)
            
        token = generate_video_token(request.user, video)
        return Response({
            'token': token,
            'video_url': f'/api/cursos/videos/{video_id}/stream/'
        })
    
    except Video.DoesNotExist:
        return Response({'error':'Video no encontrado'},status=404)
    except Exception as e:
        logger.error(f"Error en verify_attention: {str(e)}")
        return Response({'error': str(e)}, status=500)

def analyze_attention_with_mediapipe(frame):
    # Inicializar modelos de MediaPipe
    mp_face_mesh = mp.solutions.face_mesh
    mp_face_detection = mp.solutions.face_detection
    
    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5) as face_mesh:
        
        # Convertir a RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return {
                'is_paying_attention': False,
                'reason': 'No se detectó rostro'
            }
        
        # Obtener landmarks faciales
        landmarks = results.multi_face_landmarks[0].landmark
        
        # Calcular métricas de atención
        eye_ratio = calculate_eye_aspect_ratio_mediapipe(landmarks)
        head_pose = estimate_head_pose_mediapipe(landmarks, frame.shape)
        
        # Umbrales para determinar atención (ajustar según necesidad)
        is_paying_attention = (
            eye_ratio > 0.25 and  # Ojos abiertos
            abs(head_pose['pitch']) < 25 and  # Inclinación cabeza
            abs(head_pose['yaw']) < 30 and    # Rotación cabeza
            abs(head_pose['roll']) < 20       # Inclinación lateral
        )
        
        return {
            'is_paying_attention': is_paying_attention,
            'eye_aspect_ratio': eye_ratio,
            'head_pose': head_pose,
            'face_detected': True
        }

def calculate_eye_aspect_ratio_mediapipe(landmarks):
    # Índices de puntos para ojos según MediaPipe Face Mesh
    left_eye_indices = [33, 160, 158, 133, 153, 144]
    right_eye_indices = [362, 385, 387, 263, 373, 380]
    
    # Calcular EAR para ambos ojos
    left_ear = get_ear_mediapipe([landmarks[i] for i in left_eye_indices])
    right_ear = get_ear_mediapipe([landmarks[i] for i in right_eye_indices])
    
    return (left_ear + right_ear) / 2

def get_ear_mediapipe(eye_points):
    # Calcular distancias para EAR (Eye Aspect Ratio)
    # Usando las coordenadas normalizadas de MediaPipe
    A = distance_3d(eye_points[1], eye_points[5])
    B = distance_3d(eye_points[2], eye_points[4])
    C = distance_3d(eye_points[0], eye_points[3])
    return (A + B) / (2.0 * C)

def distance_3d(point1, point2):
    # Calcular distancia euclidiana entre puntos 3D
    return ((point1.x - point2.x)**2 + 
            (point1.y - point2.y)**2 + 
            (point1.z - point2.z)**2)**0.5

def estimate_head_pose_mediapipe(landmarks, frame_shape):
    # Puntos clave para estimar pose
    image_points = np.array([
        [landmarks[1].x * frame_shape[1], landmarks[1].y * frame_shape[0]],  # Nariz
        [landmarks[152].x * frame_shape[1], landmarks[152].y * frame_shape[0]], # Mentón
        [landmarks[33].x * frame_shape[1], landmarks[33].y * frame_shape[0]],  # Ojo izquierdo
        [landmarks[263].x * frame_shape[1], landmarks[263].y * frame_shape[0]], # Ojo derecho
        [landmarks[61].x * frame_shape[1], landmarks[61].y * frame_shape[0]],  # Boca izquierda
        [landmarks[291].x * frame_shape[1], landmarks[291].y * frame_shape[0]]  # Boca derecha
    ], dtype=np.float64)
    
    # Modelo 3D de referencia
    model_points = np.array([
        (0.0, 0.0, 0.0),             # Nariz
        (0.0, -330.0, -65.0),        # Mentón
        (-225.0, 170.0, -135.0),     # Ojo izquierdo
        (225.0, 170.0, -135.0),      # Ojo derecho
        (-150.0, -150.0, -125.0),    # Boca izquierda
        (150.0, -150.0, -125.0)      # Boca derecha
    ])
    
    # Parámetros de la cámara (aproximados)
    focal_length = frame_shape[1]
    center = (frame_shape[1]/2, frame_shape[0]/2)
    camera_matrix = np.array(
        [[focal_length, 0, center[0]],
         [0, focal_length, center[1]],
         [0, 0, 1]], dtype=np.float64)
    
    dist_coeffs = np.zeros((4,1))  # Sin distorsión
    
    # Calcular pose
    success, rotation_vec, translation_vec = cv2.solvePnP(
        model_points, image_points, camera_matrix, dist_coeffs)
    
    if not success:
        return {'pitch': 0, 'yaw': 0, 'roll': 0}
    
    # Convertir a ángulos de Euler
    rmat, _ = cv2.Rodrigues(rotation_vec)
    angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)
    
    return {
        'pitch': angles[0],  # Inclinación (arriba/abajo)
        'yaw': angles[1],    # Rotación (izquierda/derecha)
        'roll': angles[2]    # Inclinación lateral
    }

def generate_video_token(user, video):
    """Genera un token temporal para acceso al video"""
    # Eliminar tokens antiguos del mismo tipo
    Token.objects.filter(
        user=user,
        key__startswith=f'VIDEO_{video.id}_'
    ).delete()
    
    # Crear nuevo token con prefijo especial
    token_key = f'VIDEO_{video.id}_{timezone.now().timestamp()}'
    token = Token.objects.create(
        user=user,
        key=token_key[:40]  # La clave tiene max 40 caracteres
    )
    
    # Crear registro de acceso
    VideoAccessToken.objects.create(
        token=token,
        video=video,
        expires_at=timezone.now() + timedelta(minutes=30)  # Aumentado a 30 minutos
    )
    
    return token.key


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
        try:
            # Usa filter().first() en lugar de get() para evitar el error
            curso = Curso.objects.filter(
                Q(pk=pk) & 
                (Q(profesor=request.user) | Q(estudiantes=request.user))
            ).first()  # <- Cambio clave aquí

            if not curso:
                return Response(
                    {'error': 'Curso no encontrado o no tienes acceso'},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = CursoSerializer(curso)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': 'Error en el servidor', 'detalle': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, pk):
        # Solo el profesor puede modificar
        curso = get_object_or_404(Curso, pk=pk, profesor=request.user)
        serializer = CursoSerializer(curso, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        # Solo el profesor puede eliminar
        curso = get_object_or_404(Curso, pk=pk, profesor=request.user)
        curso.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



# Modulo para talleres, videos y pruebas
class ActividadesCursoView(APIView):
    permission_classes = [IsAuthenticated]

    def get_curso(self, pk):
        try:
            # Usa filter().first() en lugar de get_object_or_404
            curso = Curso.objects.filter(
                Q(profesor=self.request.user) | Q(estudiantes=self.request.user),
                pk=pk
            ).first()
            
            if not curso:
                raise Http404("Curso no encontrado o no tienes acceso")
            return curso
        except Exception as e:
            raise Http404(str(e))
    
class VideoView(ActividadesCursoView):
    def get(self, request, curso_id):
        try:
            curso = self.get_curso(curso_id)
            videos = Video.objects.filter(curso=curso).order_by('-fecha_creacion')
            serializer = VideoSerializer(videos, many=True)
            return Response(serializer.data)
        except Http404 as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error al obtener videos: {str(e)}")
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def post(self, request, curso_id):
        try:
            # Verificar que el curso existe y el usuario tiene permisos
            curso = self.get_curso(curso_id)
            
            # Validar que el usuario es el profesor del curso
            if curso.profesor != request.user:
                return Response(
                    {'error': 'No tienes permisos para agregar videos a este curso'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Validar archivo
            if 'archivo' not in request.FILES:
                return Response(
                    {'error': 'Se requiere un archivo de video'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Preparar datos para el serializador
            data = {
                'titulo': request.data.get('titulo'),
                'descripcion': request.data.get('descripcion', ''),
                'archivo': request.FILES['archivo'],
                'curso': curso.id  # Asegurar que el curso se incluye
            }

            serializer = VideoSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            video = serializer.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Http404:
            return Response(
                {'error': 'Curso no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return Response(
                {'error': 'Error de validación', 'detalles': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error al subir video: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TallerView(ActividadesCursoView):
    def get(self, request, curso_id=None):
        if curso_id:
            curso = self.get_curso(curso_id)
            talleres = Taller.objects.filter(curso=curso)
        else:
            talleres = Taller.objects.filter(curso__estudiantes=request.user)
        serializer = TallerSerializer(talleres, many=True)
        return Response(serializer.data)

    def post(self, request, curso_id):
        try:
            curso = self.get_curso(curso_id)
            if curso.profesor != request.user:
                return Response(
                    {'error': 'Solo el profesor puede crear talleres'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            data = request.data.copy()
            data['curso'] = curso.id
            
            serializer = TallerSerializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

#Clases para evaluaciones
class PruebaDetailView(APIView):
    def get(self, request, prueba_id):
        try:
            prueba = Prueba.objects.get(pk=prueba_id)
            serializer = PruebaSerializer(prueba)
            return Response(serializer.data)
        except Prueba.DoesNotExist:
            return Response(
                {"error": "Prueba no encontrada"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PruebaListView(APIView):
    def get(self, request, curso_id=None):
        if curso_id:
            pruebas = Prueba.objects.filter(curso_id=curso_id)
        else:
            pruebas = Prueba.objects.all()
        serializer = PruebaSerializer(pruebas, many=True)
        return Response(serializer.data)

# api_views.py
class SubmitPruebaView(APIView):
    def post(self, request, prueba_id):
        try:
            prueba = get_object_or_404(Prueba, pk=prueba_id)
            estudiante = request.user
            
            # Crear o actualizar la respuesta
            respuesta, created = ResultadoPrueba.objects.update_or_create(
                prueba=prueba,
                estudiante=estudiante,
                defaults={
                    'respuestas': request.data.get('respuestas', {}),
                    'fecha_envio': request.data.get('fecha_envio')
                }
            )
            
            return Response({
                'success': True,
                'message': 'Prueba enviada correctamente'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class PruebaView(ActividadesCursoView):
    def get(self, request, curso_id):
        """Obtener todas las pruebas de un curso"""
        try:
            curso = self.get_curso(curso_id)
            pruebas = Prueba.objects.filter(curso=curso)
            serializer = PruebaSerializer(pruebas, many=True)
            return Response(serializer.data)
        except Http404:
            return Response(
                {'error': 'Curso no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error al obtener pruebas: {str(e)}")
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, curso_id):
        try:
            serializer = PruebaSerializer(data=request.data, context={
                'request': request,
                'curso_id': curso_id
            })
            serializer.is_valid(raise_exception=True)
            
            # Procesamiento adicional si es necesario
            prueba = serializer.save()
            
            return Response({
                'status': 'success',
                'data': PruebaSerializer(prueba).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e),
                'hint': "El archivo debe tener el formato especificado en la documentación"
            }, status=status.HTTP_400_BAD_REQUEST)



class TallerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, taller_id):
        try:
            taller = Taller.objects.get(id=taller_id)
            serializer = TallerSerializer(taller)
            data = serializer.data
            # Añadir URL completa del archivo
            data['archivo'] = request.build_absolute_uri(taller.archivo.url)
            return Response(data)
        except Taller.DoesNotExist:
            return Response(
                {'error': 'Taller no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

class SubmitTallerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, taller_id):
        try:
            taller = Taller.objects.get(
                id=taller_id,
                curso__estudiantes=request.user
            )

            # Validación de datos
            required_fields = ['respuesta', 'start_time', 'end_time', 'attention_percentage', 'attention_data']
            if not all(field in request.data for field in required_fields):
                return Response(
                    {'error': 'Faltan campos requeridos'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear el registro de atención sin video_id
            result = AttentionResult.objects.create(
                taller=taller,
                student=request.user,
                start_time=datetime.fromisoformat(request.data['start_time']),
                end_time=datetime.fromisoformat(request.data['end_time']),
                attention_percentage=float(request.data['attention_percentage']),
                attention_data=request.data['attention_data'],
                video=None,  # Explícitamente establecer como nulo
                taller_id=taller_id
            )

            # Opcional: Guardar la respuesta del estudiante en otro modelo si es necesario
            # TallerRespuesta.objects.create(...)

            return Response({
                'status': 'success',
                'message': 'Taller enviado correctamente',
                'data': {
                    'taller_id': taller.id,
                    'attention_percentage': result.attention_percentage
                }
            }, status=status.HTTP_201_CREATED)

        except Taller.DoesNotExist:
            return Response(
                {'error': 'Taller no encontrado o no tienes acceso'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error al enviar taller: {str(e)}")
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



#Modulo para streaming de videos
class VideoStreamView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        try:
            # Verificar token de acceso
            token = request.auth
            if not token or not token.key.startswith(f'VIDEO_{video_id}_'):
                return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_403_FORBIDDEN)
            
            video = Video.objects.get(id=video_id)
            
            # Implementación mejorada para streaming
            file_path = video.archivo.path
            file_size = os.path.getsize(file_path)
            
            # Manejo de rangos para streaming (para permitir pausar/reanudar)
            range_header = request.META.get('HTTP_RANGE', '').strip()
            range_match = re.match(r'bytes=(\d+)-(\d+)?', range_header)
            
            if range_match:
                start = int(range_match.group(1))
                end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
                length = end - start + 1
                
                with open(file_path, 'rb') as f:
                    f.seek(start)
                    data = f.read(length)
                
                response = Response(data, status=status.HTTP_206_PARTIAL_CONTENT)
                response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
                response['Content-Length'] = length
            else:
                response = FileResponse(open(file_path, 'rb'), content_type='video/mp4')
            
            response['Accept-Ranges'] = 'bytes'
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            return response
            
        except Video.DoesNotExist:
            return Response({'error': 'Video no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error en VideoStreamView: {str(e)}")
            return Response({'error': 'Error interno'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SaveAttentionResults(APIView):
    """
    Vista basada en clase para manejar el guardado de resultados
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, video_id):
        try:
            # Obtener el video
            try:
                video = Video.objects.get(id=video_id)
            except Video.DoesNotExist:
                return Response(
                    {'error': 'Video no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Verificar que el usuario es estudiante del curso
            if request.user not in video.curso.estudiantes.all():
                return Response(
                    {'error': 'No estás inscrito en este curso'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Validar datos de entrada
            required_fields = ['start_time', 'end_time', 'attention_percentage', 'attention_data']
            if not all(field in request.data for field in required_fields):
                return Response(
                    {'error': 'Faltan campos requeridos'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Procesar datos de atención
            try:
                attention_data = request.data['attention_data']
                if isinstance(attention_data, str):
                    attention_data = json.loads(attention_data)
                
                # Validar estructura básica
                if not isinstance(attention_data, list):
                    raise ValueError("attention_data debe ser una lista")
            except (json.JSONDecodeError, ValueError) as e:
                return Response(
                    {'error': f'Formato inválido para attention_data: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear el registro
            result = AttentionResult.objects.create(
                video=video,
                student=request.user,
                start_time=datetime.fromisoformat(request.data['start_time']),
                end_time=datetime.fromisoformat(request.data['end_time']),
                attention_percentage=float(request.data['attention_percentage']),
                attention_data=attention_data
            )

            return Response({
                'status': 'success',
                'data': {
                    'result_id': result.id,
                    'video_id': video.id,
                    'attention_percentage': result.attention_percentage,
                    'duration_seconds': (result.end_time - result.start_time).total_seconds()
                }
            }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response(
                {'error': f'Error en el formato de datos: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error inesperado al guardar resultados: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Modulo para inscripciones a cursos
class UnirseCursoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        codigo = request.data.get('codigo')
        if not codigo:
            return Response(
                {'error': 'Se requiere el código del curso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            curso = Curso.objects.get(codigo=codigo)
            if request.user in curso.estudiantes.all():
                return Response(
                    {'error': 'Ya estás inscrito en este curso'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
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
        except Exception as e:
            print(f"Error al unirse al curso: {str(e)}")  # Log para depuración
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class CursosInscritosView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        cursos = request.user.cursos_inscritos.all()
        serializer = CursoSerializer(cursos, many=True)
        return Response(serializer.data)
    


#Clases de porcentaje de completacion del curso
class CursoCompletionView(APIView):
    def get(self, request, curso_id):
        user = request.user
        curso = get_object_or_404(Curso, id=curso_id)
        
        # Obtener conteo de videos completados (usando 'user' en lugar de 'estudiante')
        videos_completados = VideoAttention.objects.filter(
            video__curso_id=curso_id,
            user=user  # Cambiado de 'estudiante' a 'user'
        ).values('video').distinct().count()
        
        total_videos = Video.objects.filter(curso_id=curso_id).count()
        
        # Obtener conteo de talleres completados
        talleres_completados = TallerEnviado.objects.filter(
            taller__curso_id=curso_id,
            estudiante=user  # Asegúrate que el campo sea 'user' o 'estudiante' según tu modelo
        ).count()
        
        total_talleres = Taller.objects.filter(curso_id=curso_id).count()
        
        # Obtener conteo de pruebas completadas
        pruebas_completadas = ResultadoPrueba.objects.filter(
            prueba__curso_id=curso_id,
            estudiante=user  # Asegúrate que el campo sea 'user' o 'estudiante' según tu modelo
        ).count()
        
        total_pruebas = Prueba.objects.filter(curso_id=curso_id).count()
        
        # Calcular porcentaje total de completado
        total_actividades = total_videos + total_talleres + total_pruebas
        actividades_completadas = videos_completados + talleres_completados + pruebas_completadas
        
        percentage = 0
        if total_actividades > 0:
            percentage = (actividades_completadas / total_actividades) * 100
        
        return Response({
            'percentage': percentage,
            'details': {
                'videos': {
                    'completed': list(VideoAttention.objects.filter(
                        video__curso_id=curso_id,
                        user=user
                    ).values_list('video_id', flat=True).distinct()),
                    'total': total_videos
                },
                'talleres': {
                    'completed': list(TallerEnviado.objects.filter(
                        taller__curso_id=curso_id,
                        estudiante=user
                    ).values_list('taller_id', flat=True).distinct()),
                    'total': total_talleres
                },
                'pruebas': {
                    'completed': list(ResultadoPrueba.objects.filter(
                        prueba__curso_id=curso_id,
                        estudiante=user
                    ).values_list('prueba_id', flat=True).distinct()),
                    'total': total_pruebas
                }
            }
        })

    