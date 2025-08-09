from rest_framework.views import APIView
from rest_framework.response import Response
from apiAI.api import evaluar_prueba_openai
import os

class EvaluarPruebaIA(APIView):
    def post(self, request):
        banco_preguntas = request.data.get('preguntas', [])
        api_key = os.getenv('OPENAI_API_KEY')
        resultado = evaluar_prueba_openai(banco_preguntas, api_key)
        if resultado:
            return Response(resultado)
        else:
            return Response({"error": "No se pudo obtener el resultado de la IA"}, status=400)