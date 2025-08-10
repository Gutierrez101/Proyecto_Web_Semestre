import requests
import re
import json
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def evaluar_prueba_openai(banco_preguntas, api_key):
    """
    Evalúa las respuestas de una prueba usando OpenAI.
    Devuelve un dict con los resultados o None en caso de error.
    """
    try:
        # Validación de entrada
        if not isinstance(banco_preguntas, list):
            raise ValueError("banco_preguntas debe ser una lista")
            
        if not api_key:
            logger.error("API key no proporcionada")
            return {"error": "Configuración del servidor incompleta"}

        payload = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Eres un evaluador académico. Analiza las respuestas y devuelve un JSON con: "
                        "{'puntaje': int, 'total': int, 'detalle': [{'pregunta': str, 'respuesta_usuario': str, "
                        "'respuesta_correcta': str, 'correcta': bool, 'explicacion': str}]}"
                    )
                },
                {
                    "role": "user",
                    "content": json.dumps(banco_preguntas, ensure_ascii=False)
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3  # Menor creatividad, más factual
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        # Timeout ajustado para pruebas académicas
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=45  # Aumentado para respuestas largas
        )

        logger.info(f"Status code OpenAI: {response.status_code}")

        if response.status_code == 200:
            content = response.json()['choices'][0]['message']['content']
            
            # Manejo robusto de diferentes formatos de respuesta
            try:
                # Intenta parsear directamente
                resultado = json.loads(content)
                if isinstance(resultado, dict):
                    return resultado
                
                # Si falla, busca JSON dentro del texto
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(0))
                    
            except json.JSONDecodeError as e:
                logger.error(f"Error decodificando JSON: {e}\nContenido: {content}")
                return {"error": "Formato de respuesta inválido"}

        logger.error(f"Error en API OpenAI: {response.text}")
        return {"error": "Error en el servicio de evaluación"}

    except requests.Timeout:
        logger.error("Timeout al conectar con OpenAI")
        return {"error": "El servicio de evaluación está tardando demasiado"}
    except Exception as e:
        logger.error(f"Error inesperado en evaluar_prueba_openai: {str(e)}", exc_info=True)
        return {"error": "Error interno en el evaluador"}