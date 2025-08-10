
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
from api.views import EvaluarPruebaIA
from datetime import datetime
import cv2
import numpy as np
import mediapipe as mp
import os
import json
import re
import logging
import random


logger=logging.getLogger(__name__)

#importaciones para talleres, videos y pruebas
from .models import Curso, Video, Taller, Prueba, AttentionResult, ResultadoPrueba, VideoAttention, TallerEnviado
from .serializers import VideoSerializer, TallerSerializer, PruebaSerializer
from .mongo_utils import  create_attention_session, add_frames_batch  # Añadir al inicio
import uuid

# ===== NUEVAS FUNCIONES PARA DATASETS =====
# DAiSEE mejorado
def classify_daisee(landmarks):
    eye_ratio = calculate_eye_aspect_ratio_mediapipe(landmarks)
    mouth_open = abs(landmarks[13].y - landmarks[14].y)  # Apertura boca
    brow_height = abs(landmarks[386].y - landmarks[282].y)
    head_pose = estimate_head_pose_mediapipe(landmarks, (640,480))  # Asume resolución
    
    if eye_ratio < 0.18 and mouth_open < 0.02:
        return "BORED"
    elif brow_height > 0.12 and mouth_open > 0.03:
        return "CONFUSED"
    elif eye_ratio > 0.25 and brow_height < 0.08:
        return "ATTENTIVE"
    else:
        return "NEUTRAL"

# HPoD9 mejorado
def classify_hpod(head_pose):
    pitch, yaw, roll = head_pose['pitch'], head_pose['yaw'], head_pose['roll']
    
    if -10 < pitch < 10 and -10 < yaw < 10:
        return "FRONT"
    elif pitch > 45:
        return "UP_EXTREME"
    elif pitch < -45:
        return "DOWN_EXTREME"
    elif yaw < -45:
        return "LEFT_PROFILE"
    elif yaw > 45:
        return "RIGHT_PROFILE"
    elif 30 < pitch <= 45:
        return "UP"
    elif -45 <= pitch < -30:
        return "DOWN"
    elif roll > 15:
        return "TILT_LEFT"
    elif roll < -15:
        return "TILT_RIGHT"
    else:
        return "FRONT_TILTED"



def calculate_deviation(hpod_pose):
    """Calcula desviación basada en la pose"""
    pose_weights = {
        "FRONT": 0.0,
        "UP": 0.3,
        "DOWN": 0.4,
        "LEFT_PROFILE": 0.6,
        "RIGHT_PROFILE": 0.6,
        "UP_EXTREME": 0.8,
        "DOWN_EXTREME": 0.9,
        "TILT_LEFT": 0.5,
        "TILT_RIGHT": 0.5
    }
    return pose_weights.get(hpod_pose, 0.5)

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

from django.views.decorators.csrf import csrf_exempt

@api_view(['POST'])
@csrf_exempt  
def verify_attention(request, video_id):
    try:
        # Validaciones iniciales (se mantienen igual)
        if not request.user.is_authenticated:
            return Response({'error':'No autenticado'}, status=401)

        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist:
            return Response({'error':'Video no encontrado'}, status=404)

        if 'frame' not in request.FILES:
            return Response({'error': 'Se requiere un frame de la cámara'}, status=400)

        # Procesamiento de la imagen
        frame_file = request.FILES['frame']
        frame_data = frame_file.read()
        frame = cv2.imdecode(np.frombuffer(frame_data, np.uint8), cv2.IMREAD_COLOR)
        
        if frame is None:
            return Response({'error':'No se puede decodificar la imagen'}, status=400)

        # Crear nueva sesión si es el primer frame
        session_id = request.headers.get('X-Session-ID')
        if not session_id:
            _, session_id = create_attention_session(str(request.user.id), str(video_id))
        
        # Análisis con pesos (nueva implementación)
        analysis = analyze_frame_with_weights(frame)
        attention_score = calculate_weighted_score(analysis)
        
        # Guardar en MongoDB (nuevo formato)
        add_frames_batch(session_id, [{
            'timestamp': datetime.utcnow(),
            'analysis': analysis,
            'attention_score': attention_score,
            'frame_data': frame_data[:100]  # Opcional: guardar miniaturas
        }])

        # Verificación de atención (usando el nuevo score)
        if attention_score < 50:  # Ajusta este umbral según tus necesidades
            return Response({
                'error': 'Atención insuficiente',
                'details': analysis,
                'session_id': session_id,
                'attention_score': attention_score
            }, status=403)
            
        # Generación de token
        token = generate_video_token(request.user, video)
        return Response({
            'status': 'success',
            'token': token,
            'video_url': f'/api/cursos/videos/{video_id}/stream/',
            'session_id': session_id,
            'attention_score': attention_score
        })

    except Exception as e:
        logger.error(f"Error en verify_attention: {str(e)}", exc_info=True)
        return Response({'error': 'Error interno del servidor'}, status=500)

#Fnciones para vision por computadora

@api_view(['POST'])
def process_attention_batch(request, video_id):
    try:
        # Validaciones
        if not request.user.is_authenticated:
            return Response({'error': 'Unauthorized'}, status=401)
        
        if 'session_id' not in request.data or 'frames' not in request.data:
            return Response({'error': 'Missing session_id or frames'}, status=400)
        
        # Verificar que el video existe
        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist:
            return Response({'error':'Video no encontrado'}, status=404)

        # Procesar cada frame recibido
        processed_frames = []
        for frame_item in request.data['frames']:
            try:
                # Decodificar el frame desde hex
                frame_bytes = bytes.fromhex(frame_item['frame_data'])
                frame = cv2.imdecode(np.frombuffer(frame_bytes, np.uint8), cv2.IMREAD_COLOR)
                
                if frame is None:
                    continue  # Saltar frames que no se pueden decodificar
                
                # Analizar el frame
                analysis = analyze_frame_with_weights(frame)
                processed_frames.append({
                    'timestamp': datetime.utcnow(),
                    'analysis': analysis,
                    'attention_score': calculate_weighted_score(analysis)
                })
                
            except Exception as e:
                logger.error(f"Error procesando frame: {str(e)}")
                continue  # Continuar con el siguiente frame
        
        if not processed_frames:
            return Response({'error': 'No se pudieron procesar frames'}, status=400)
        
        # Guardar en MongoDB
        try:
            modified = add_frames_batch(
                request.data['session_id'],
                processed_frames
            )
        except Exception as e:
            logger.error(f"Error guardando en MongoDB: {str(e)}")
            # Continuar aunque MongoDB falle
        
        # Calcular promedio de atención del batch
        avg_score = sum(f['attention_score'] for f in processed_frames) / len(processed_frames)
        
        return Response({
            'status': 'success',
            'frames_processed': len(processed_frames),
            'session_id': request.data['session_id'],
            'average_attention': avg_score
        })
    
    except Exception as e:
        logger.error(f"Batch processing error: {str(e)}")
        return Response({'error': str(e)}, status=500)


def calculate_weighted_score(analysis):
    weights = {
        'mediapipe': 0.5,
        'daisee': 0.3,
        'hpod': 0.2
    }
    
    # Puntaje MediaPipe (ojos + postura)
    mp_score = 100 if (analysis['mediapipe']['eye_aspect_ratio'] > 0.25 and 
                       analysis['mediapipe']['head_pose']['pitch'] < 25) else 40
    
    # Puntaje DAiSEE
    daisee_score = 100 if analysis['daisee']['state'] == "ATTENTIVE" else 30
    
    # Puntaje HPoD9
    hpod_score = 100 - (analysis['hpod']['deviation'] * 100)
    
    return (mp_score * weights['mediapipe'] + 
            daisee_score * weights['daisee'] + 
            hpod_score * weights['hpod'])

def analyze_frame_with_weights(frame):
    try:
        # Validar que el frame es válido
        if frame is None or frame.size == 0:
            raise ValueError("Frame inválido o vacío")
        
        # 1. Análisis base con MediaPipe
        mediapipe_data = analyze_attention_with_mediapipe(frame)
        
        # Verificar si MediaPipe detectó landmarks
        if 'landmarks' not in mediapipe_data or not mediapipe_data['landmarks']:
            # Retornar datos por defecto si no hay detección
            return {
                'mediapipe': {
                    'eye_aspect_ratio': 0.0,
                    'head_pose': {'pitch': 0, 'yaw': 0, 'roll': 0},
                    'face_detected': False
                },
                'daisee': {
                    'state': "NO_FACE",
                    'confidence': 0.0
                },
                'hpod': {
                    'pose': "NO_DETECTION",
                    'deviation': 1.0
                },
                'timestamp': datetime.utcnow().isoformat()
            }
        
        # 2. Clasificación DAiSEE y HPoD9 solo si hay landmarks
        daisee_state = classify_daisee(mediapipe_data['landmarks'])
        hpod_pose = classify_hpod(mediapipe_data['head_pose'])
        
        return {
            'mediapipe': mediapipe_data,
            'daisee': {
                'state': daisee_state,
                'confidence': 1.0
            },
            'hpod': {
                'pose': hpod_pose,
                'deviation': calculate_deviation(hpod_pose)
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error en analyze_frame_with_weights: {str(e)}")
        # Retornar datos por defecto en caso de error
        return {
            'mediapipe': {
                'eye_aspect_ratio': 0.0,
                'head_pose': {'pitch': 0, 'yaw': 0, 'roll': 0},
                'face_detected': False,
                'error': str(e)
            },
            'daisee': {'state': "ERROR", 'confidence': 0.0},
            'hpod': {'pose': "ERROR", 'deviation': 1.0},
            'timestamp': datetime.utcnow().isoformat()
        }

def calculate_head_pose_deviation(head_pose):
    """Calcula desviación total de la cabeza"""
    # Valores máximos esperados (ajusta según necesidad)
    MAX_PITCH = 25  # Grados arriba/abajo
    MAX_YAW = 30    # Grados izquierda/derecha
    MAX_ROLL = 15   # Grados inclinación lateral
    
    # Asegurarse de que head_pose es un diccionario
    if not isinstance(head_pose, dict):
        return 1.0  # Máxima desviación si no hay datos
    
    # Obtener valores con seguridad
    pitch = abs(head_pose.get('pitch', 0)) / MAX_PITCH
    yaw = abs(head_pose.get('yaw', 0)) / MAX_YAW
    roll = abs(head_pose.get('roll', 0)) / MAX_ROLL
    
    # Promedia las desviaciones (valor entre 0-1) y limita a 1 como máximo
    return min((pitch + yaw + roll) / 3, 1.0)


def analyze_attention_with_mediapipe(frame):
    try:
        # Validar frame
        if frame is None or frame.size == 0:
            return {
                'is_paying_attention': False,
                'reason': 'Frame inválido',
                'landmarks': None
            }
        
        # Inicializar modelos de MediaPipe
        mp_face_mesh = mp.solutions.face_mesh
        
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
                    'reason': 'No se detectó rostro',
                    'landmarks': None,
                    'eye_aspect_ratio': 0.0,
                    'head_pose': {'pitch': 0, 'yaw': 0, 'roll': 0},
                    'face_detected': False
                }
            
            # Obtener landmarks faciales
            landmarks = results.multi_face_landmarks[0].landmark
            
            # Calcular métricas de atención
            eye_ratio = calculate_eye_aspect_ratio_mediapipe(landmarks)
            head_pose = estimate_head_pose_mediapipe(landmarks, frame.shape)
            
            # Umbrales para determinar atención (ajustados)
            is_paying_attention = (
                eye_ratio > 0.20 and  # Reducido de 0.25
                abs(head_pose['pitch']) < 30 and  # Aumentado de 25
                abs(head_pose['yaw']) < 35 and    # Aumentado de 30
                abs(head_pose['roll']) < 25       # Aumentado de 20
            )
            
            return {
                'is_paying_attention': is_paying_attention,
                'eye_aspect_ratio': eye_ratio,
                'head_pose': head_pose,
                'face_detected': True,
                'landmarks': landmarks,  # Añadir landmarks para otras funciones
                'timestamp': datetime.utcnow().isoformat(),
                'frame_resolution': f"{frame.shape[1]}x{frame.shape[0]}",
                'confidence': 0.9
            }
            
    except Exception as e:
        logger.error(f"Error en analyze_attention_with_mediapipe: {str(e)}")
        return {
            'is_paying_attention': False,
            'reason': f'Error de procesamiento: {str(e)}',
            'landmarks': None,
            'eye_aspect_ratio': 0.0,
            'head_pose': {'pitch': 0, 'yaw': 0, 'roll': 0},
            'face_detected': False
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
    
    def post(self, request, prueba_id):
        try:
            prueba = get_object_or_404(Prueba, pk=prueba_id)
            estudiante = request.user

            # Validar que el estudiante está en el curso
            if not prueba.curso.estudiantes.filter(id=estudiante.id).exists():
                return Response(
                    {"error": "No estás inscrito en este curso"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Validar datos mínimos
            if 'respuestas' not in request.data:
                return Response(
                    {"error": "El campo 'respuestas' es requerido"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Guardar resultados
            resultado, created = ResultadoPrueba.objects.update_or_create(
                prueba=prueba,
                estudiante=estudiante,
                defaults={
                    'respuestas': request.data['respuestas'],
                    'fecha_fin': timezone.now(),
                }
            )

            return Response(
                {"success": "Prueba enviada correctamente"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class PruebaListView(APIView):
    def get(self, request, curso_id=None):
        if curso_id:
            pruebas = Prueba.objects.filter(curso_id=curso_id)
        else:
            pruebas = Prueba.objects.all()
        serializer = PruebaSerializer(pruebas, many=True)
        return Response(serializer.data)

class SubmitPruebaView(APIView):
    def post(self, request, prueba_id):
        try:
            prueba = get_object_or_404(Prueba, pk=prueba_id)
            estudiante = request.user
            
            if not prueba.curso.estudiantes.filter(id=estudiante.id).exists():
                return Response(
                    {"error": "No estás inscrito en este curso"},
                    status=status.HTTP_403_FORBIDDEN
                )

            if 'respuesta' not in request.data:
                return Response(
                    {"error": "El campo 'respuesta' es requerido"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            
            # Crear o actualizar la respuesta
            respuesta, created = ResultadoPrueba.objects.update_or_create(
                prueba=prueba,
                estudiante=estudiante,
                defaults={
                    'respuesta': request.data['respuesta'],
                    'fecha_fin': timezone.now()
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

class ResultadoPruebaView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, prueba_id):
        try:
            # 1. Validar que la prueba existe y el usuario tiene acceso
            prueba = get_object_or_404(Prueba, pk=prueba_id)
            
            if not prueba.curso.estudiantes.filter(id=request.user.id).exists():
                return Response(
                    {"error": "No tienes acceso a este curso"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # 2. Obtener resultado del estudiante
            resultado = get_object_or_404(
                ResultadoPrueba,
                prueba=prueba,
                estudiante=request.user
            )

            # 3. Verificar y normalizar respuestas
            respuesta = resultado.respuesta
            if isinstance(respuesta, str):
                try:
                    respuesta = json.loads(respuesta)
                except json.JSONDecodeError:
                    return Response(
                        {"error": "Formato de respuestas inválido"},
                        status=status.HTTP_424_FAILED_DEPENDENCY
                    )

            # 4. Si no hay preguntas en la prueba, devolver error específico
            if not prueba.json_content or not prueba.json_content.get('questions'):
                return Response(
                    {"error": "La prueba no tiene preguntas definidas"},
                    status=status.HTTP_424_FAILED_DEPENDENCY
                )

            # 5. Preparar respuesta
            return Response({
                "prueba_id": prueba.id,
                "respuesta": respuesta,
                "evaluacion_ia": resultado.evaluacion_ia or {},
                "preguntas": prueba.json_content['questions']
            })

        except Exception as e:
            logger.error(f"Error en ResultadoPruebaView: {str(e)}")
            return Response(
                {"error": "Error interno del servidor"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _handle_pending_evaluation(self, resultado, prueba_id):
        """Maneja lógica para evaluaciones pendientes o fallidas"""
        # Tiempo máximo de espera (15 minutos)
        timeout = timedelta(minutes=15)
        
        if resultado.fecha_fin and (timezone.now() - resultado.fecha_fin) > timeout:
            # Intentar regenerar evaluación automáticamente
            if EvaluarPruebaIA().regenerar_evaluacion(resultado):
                return Response(
                    self._prepare_response_data(resultado, resultado.prueba),
                    status=status.HTTP_200_OK
                )
            
            return Response(
                {
                    "status": "error",
                    "code": "evaluation_failed",
                    "message": "La evaluación no pudo completarse",
                    "solution": "Por favor contacta al instructor"
                },
                status=status.HTTP_424_FAILED_DEPENDENCY
            )

        # Respuesta para evaluación en proceso
        return Response(
            {
                "status": "processing",
                "message": "La evaluación está en proceso",
                "retry_after": 30,  # Segundos para reintentar
                "progress": "75%"
            },
            status=status.HTTP_202_ACCEPTED
        )

    def _prepare_response_data(self, resultado, prueba):
        """Prepara la estructura de datos de respuesta"""
        # Parsear respuesta si está en formato string
        respuesta_data = resultado.respuesta
        if isinstance(respuesta_data, str):
            try:
                respuesta_data = json.loads(respuesta_data)
            except json.JSONDecodeError:
                respuesta_data = {"error": "Formato de respuesta inválido"}

        return {
            "meta": {
                "timestamp": timezone.now().isoformat(),
                "version": "1.0"
            },
            "data": {
                "prueba": {
                    "id": prueba.id,
                    "titulo": prueba.titulo,
                    "descripcion": prueba.descripcion
                },
                "respuesta": respuesta_data,
                "evaluacion": self._format_evaluation(resultado.evaluacion_ia),
                "atencion": self._get_attention_data(resultado)
            }
        }

    def _format_evaluation(self, evaluacion):
        """Formatea los datos de evaluación de IA"""
        if not evaluacion:
            return None

        puntaje = evaluacion.get('puntaje', 0)
        total = max(evaluacion.get('total', 1), 1)  # Evitar división por cero
        
        return {
            "puntaje": puntaje,
            "total": total,
            "porcentaje": round((puntaje / total) * 100, 2),
            "fecha": evaluacion.get('fecha'),
            "estado": evaluacion.get('estado', 'desconocido'),
            "detalle": evaluacion.get('detalle', [])
        }

    def _get_attention_data(self, resultado):
        """Obtiene y formatea datos de atención"""
        if not hasattr(resultado, 'attention_results'):
            return []

        return [
            {
                "id": item.id,
                "inicio": item.start_time.isoformat(),
                "fin": item.end_time.isoformat(),
                "porcentaje_atencion": item.attention_percentage,
                "duracion_minutos": round(
                    (item.end_time - item.start_time).total_seconds() / 60, 
                    1
                )
            }
            for item in resultado.attention_results.all()
        ]

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

