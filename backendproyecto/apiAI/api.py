import requests
import re
import json

def evaluar_prueba_openai(banco_preguntas, api_key):
    payload = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": "Eres un evaluador de pruebas. Recibe un array de preguntas con la respuesta del usuario y evalúa cuáles están correctas y cuáles no. Devuelve un JSON con puntaje, total, fecha, y detalle por pregunta (texto, respuesta_usuario, respuesta_correcta, correcta, explicacion)."
            },
            {
                "role": "user",
                "content": json.dumps(banco_preguntas, ensure_ascii=False)
            }
        ]
 }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    r = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
    print("Status code:", r.status_code)
    print("Response:", r.text)
    if r.status_code == 200:
        data = r.json()
        content = data['choices'][0]['message']['content']
        # Extrae el bloque JSON usando regex
        match = re.search(r'```json\s*(\{.*\})\s*```', content, re.DOTALL)
        if match:
            json_str = match.group(1)
            # Limpia el bloque para asegurar comillas dobles
            json_str = json_str.replace('\n', '').replace('\r', '')
            try:
                resultado = json.loads(json_str)
                return resultado
            except Exception as e:
                print("Error al cargar JSON:", e)
                return {"error": "No se pudo extraer el resultado"}
        else:
            # Si no encuentra el bloque, intenta cargar directamente
            try:
                return json.loads(content)
            except Exception as e:
                print("Error al cargar JSON directo:", e)
                return {"error": "No se pudo extraer el resultado"}
    else:
        return None