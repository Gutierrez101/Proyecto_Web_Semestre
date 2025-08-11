import os
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apiAI.api import evaluar_prueba_openai
from users.models import ResultadoPrueba


class ResultadosEstudianteIA(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prueba_id = request.query_params.get('prueba')
        usuario = request.user

        if not prueba_id:
            return Response({"error": "No se especificó la prueba"}, status=400)

        try:
            resultado = ResultadoPrueba.objects.get(estudiante=usuario, prueba_id=prueba_id)
        except ResultadoPrueba.DoesNotExist:
            return Response({"error": "No hay respuestas para esta prueba"}, status=404)

        # Cargar contenido de preguntas
        preguntas = resultado.prueba.json_content
        if isinstance(preguntas, str):
            preguntas = json.loads(preguntas)

        # Si es diccionario con clave "questions", usar esa lista
        if isinstance(preguntas, dict) and 'questions' in preguntas:
            preguntas = preguntas['questions']

        # Validar que ahora sea lista
        if not isinstance(preguntas, list):
            return Response({"error": "Formato de preguntas no válido"}, status=400)

        # Cargar respuestas del usuario
        respuestas_usuario = resultado.respuesta
        if isinstance(respuestas_usuario, str):
            respuestas_usuario = json.loads(respuestas_usuario)

        banco_preguntas = []
        for idx, pregunta in enumerate(preguntas):
            # Obtener respuesta según si es lista o diccionario
            if isinstance(respuestas_usuario, list):
                respuesta_user = respuestas_usuario[idx] if idx < len(respuestas_usuario) else ''
            elif isinstance(respuestas_usuario, dict):
                respuesta_user = respuestas_usuario.get(str(pregunta.get('id')), '')
            else:
                respuesta_user = ''

            banco_preguntas.append({
                'texto': pregunta.get('question_text', ''),
                'tipo': pregunta.get('tipo', 'opcion_multiple'),
                'opciones': pregunta.get('options', []),
                'respuesta_correcta': pregunta.get('correct_answer', ''),
                'respuesta_usuario': respuesta_user,
                'explicacion': pregunta.get('explicacion', '')
            })

        # Clave API de OpenAI
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            return Response({"error": "No se encontró la clave de OpenAI en la variable de entorno"}, status=500)

        resultado_ia = evaluar_prueba_openai(banco_preguntas, api_key)
        if resultado_ia:
            return Response(resultado_ia)
        else:
            return Response({"error": "No se pudo obtener el resultado de la IA"}, status=400)
class EvaluarPruebaIA(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            preguntas = request.data.get('preguntas', [])
            
            if not preguntas:
                return Response({"error": "No se proporcionaron preguntas para evaluar"}, status=400)
            
            banco_preguntas = []
            for pregunta in preguntas:
                banco_preguntas.append({
                    'texto': pregunta.get('texto', ''),
                    'tipo': pregunta.get('tipo', 'opcion_multiple'),
                    'opciones': pregunta.get('opciones', []),
                    'respuesta_correcta': pregunta.get('respuesta_correcta', ''),
                    'respuesta_usuario': pregunta.get('respuesta_usuario', ''),
                    'explicacion': pregunta.get('explicacion', '')
                })
            
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                return Response({"error": "No se encontró la clave de OpenAI en la variable de entorno"}, status=500)
            
            resultado = evaluar_prueba_openai(banco_preguntas, api_key)
            
            if resultado:
                return Response(resultado)
            else:
                return Response({"error": "No se pudo obtener el resultado de la IA"}, status=400)
                
        except Exception as e:
            return Response({"error": str(e)}, status=500)
