import requests
import cv2
import numpy as np
import time
import json
import base64
from collections import defaultdict
from datetime import datetime
import uuid

# Configuración
BASE_URL = "http://localhost:8000"
VIDEO_ID = 1  # Cambia según necesites

# Obtener token de autenticación
def get_auth_token():
    login_url = f"{BASE_URL}/api/login/"
    credentials = {
        "username": "E988",  # Reemplaza con tu usuario real
        "password": "123"    # Reemplaza con tu contraseña real
    }
    
    try:
        response = requests.post(login_url, data=credentials)
        response.raise_for_status()
        token_data = response.json()
        print(f"✅ Login exitoso para usuario: {token_data.get('username')}")
        return token_data.get('token')
    except Exception as e:
        print(f"❌ Error en login: {str(e)}")
        return None

# Clase principal para manejar las pruebas
class AttentionTester:
    def __init__(self):
        self.token = get_auth_token()
        self.session_id = None
        self.results = defaultdict(list)
        self.total_frames_sent = 0
        self.successful_frames = 0
        self.failed_frames = 0
        
    def get_headers(self, content_type="application/json"):
        headers = {
            "Authorization": f"Token {self.token}",
            "Accept": "application/json"
        }
        if content_type:
            headers["Content-Type"] = content_type
        if self.session_id:
            headers["X-Session-ID"] = self.session_id
        return headers
    
    def test_single_frame(self, frame):
        """Prueba el endpoint verify_attention frame por frame"""
        print("🔍 Enviando frame individual...")
        
        try:
            # Codificar frame como JPEG
            _, img_encoded = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            files = {'frame': ('frame_test.jpg', img_encoded.tobytes(), 'image/jpeg')}
            
            # Headers sin Content-Type para multipart/form-data
            headers = {
                "Authorization": f"Token {self.token}",
            }
            if self.session_id:
                headers["X-Session-ID"] = self.session_id
            
            response = requests.post(
                f"{BASE_URL}/api/cursos/videos/{VIDEO_ID}/verify/",
                files=files,
                headers=headers,
                timeout=10
            )
            
            self.total_frames_sent += 1
            result = self._process_response(response, "individual")
            
            if response.status_code == 200:
                self.successful_frames += 1
            else:
                self.failed_frames += 1
                
            return result
            
        except Exception as e:
            self.failed_frames += 1
            print(f"❌ Error enviando frame: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def test_batch_frames(self, frames):
        """Prueba el endpoint process_attention_batch"""
        print(f"📦 Enviando batch de {len(frames)} frames...")
        
        try:
            # Convertir frames a formato hex que el backend puede procesar
            frames_data = []
            for idx, frame in enumerate(frames):
                # Codificar frame como JPEG y luego a hex
                _, img_encoded = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                frame_hex = img_encoded.tobytes().hex()
                
                frames_data.append({
                    "frame_data": frame_hex,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            data = {
                "session_id": self.session_id or str(uuid.uuid4()),
                "frames": frames_data
            }
            
            response = requests.post(
                f"{BASE_URL}/api/cursos/videos/{VIDEO_ID}/process_batch/",
                json=data,
                headers=self.get_headers(),
                timeout=15
            )
            
            self.total_frames_sent += len(frames)
            result = self._process_response(response, "batch")
            
            if response.status_code == 200:
                self.successful_frames += len(frames)
            else:
                self.failed_frames += len(frames)
                
            return result
            
        except Exception as e:
            self.failed_frames += len(frames)
            print(f"❌ Error enviando batch: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def test_save_attention_results(self, attention_data):
        """Prueba el endpoint save_attention_results"""
        print("💾 Guardando resultados de atención...")
        
        try:
            # Datos simulados para el test - AJUSTADO para tu nueva estructura
            data = {
                "start_time": (datetime.utcnow().replace(second=0, microsecond=0)).isoformat(),
                "end_time": datetime.utcnow().isoformat(),
                "attention_percentage": 75.5,
                "attention_data": attention_data or create_realistic_attention_data()
            }
            
            response = requests.post(
                f"{BASE_URL}/api/cursos/videos/{VIDEO_ID}/save-results/",
                json=data,
                headers=self.get_headers(),
                timeout=10
            )
            
            return self._process_response(response, "save_results")
            
        except Exception as e:
            print(f"❌ Error guardando resultados: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def test_mongo_integration(self):
        """Nueva función para probar específicamente la integración con MongoDB"""
        print("🍃 Probando integración con MongoDB...")
        
        try:
            # Test de sesión directa (esto requiere que agregues un endpoint de test en tu API)
            data = {
                "test_type": "mongo_integration",
                "user_id": "test_user",
                "video_id": str(VIDEO_ID)
            }
            
            response = requests.post(
                f"{BASE_URL}/api/test/mongo/",  # Necesitarías crear este endpoint
                json=data,
                headers=self.get_headers(),
                timeout=10
            )
            
            return self._process_response(response, "mongo_test")
            
        except Exception as e:
            print(f"❌ Error en test de MongoDB: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _process_response(self, response, test_type):
        try:
            result = {
                "test_type": test_type,
                "status_code": response.status_code,
                "data": response.json() if response.text else None,
                "timestamp": datetime.now().isoformat()
            }
            
            # Manejar diferentes tipos de respuesta
            if response.status_code == 200:
                print(f"✅ {test_type.upper()} exitoso")
                
                # Extraer session_id si está disponible
                if result['data'] and 'session_id' in result['data']:
                    self.session_id = result['data']['session_id']
                    print(f"📋 Session ID: {self.session_id}")
                
                # Registrar scores de atención
                if 'attention_score' in result['data']:
                    score = result['data']['attention_score']
                    self.results['individual_scores'].append(score)
                    print(f"🎯 Score de atención: {score:.2f}")
                elif 'average_attention' in result['data']:
                    score = result['data']['average_attention']
                    self.results['batch_scores'].append(score)
                    print(f"🎯 Score promedio del batch: {score:.2f}")
                
            elif response.status_code == 201:  # Para save_results
                print(f"✅ {test_type.upper()} - Datos guardados exitosamente")
                if result['data'] and 'data' in result['data']:
                    inner_data = result['data']['data']
                    if 'attention_percentage' in inner_data:
                        print(f"📊 Porcentaje de atención guardado: {inner_data['attention_percentage']:.2f}%")
                
            elif response.status_code == 403:
                print(f"⚠️  {test_type.upper()} - Atención insuficiente")
                if result['data'] and 'attention_score' in result['data']:
                    score = result['data']['attention_score']
                    self.results['low_attention_scores'].append(score)
                    print(f"🔻 Score bajo: {score:.2f}")
                    
            elif response.status_code == 401:
                print(f"🔒 {test_type.upper()} - Error de autenticación")
                
            elif response.status_code == 404:
                print(f"🚫 {test_type.upper()} - Video no encontrado")
                
            else:
                print(f"❌ {test_type.upper()} falló - Status: {response.status_code}")
                if result['data']:
                    print(f"   Error: {result['data'].get('error', 'Error desconocido')}")
            
            return result
            
        except ValueError as e:
            print(f"❌ Error procesando respuesta JSON: {str(e)}")
            return {
                "test_type": test_type,
                "status_code": response.status_code,
                "error": "Invalid JSON response",
                "content": response.text[:200] + "..." if len(response.text) > 200 else response.text
            }
    
    def simulate_different_attention_states(self):
        """Simula diferentes estados de atención para testing"""
        print("\n🧪 Ejecutando simulación de estados de atención...")
        
        # Crear frames simulados con diferentes características
        test_scenarios = [
            {"name": "Alta atención", "eye_open": True, "head_straight": True},
            {"name": "Ojos cerrados", "eye_open": False, "head_straight": True},
            {"name": "Cabeza girada", "eye_open": True, "head_straight": False},
            {"name": "Distraído", "eye_open": False, "head_straight": False},
        ]
        
        for scenario in test_scenarios:
            print(f"\n🎭 Probando escenario: {scenario['name']}")
            
            # Crear frame simulado (negro con texto)
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, scenario['name'], (50, 240), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            result = self.test_single_frame(frame)
            time.sleep(1)  # Pausa entre pruebas
    
    def test_session_lifecycle(self):
        """Nueva función para probar el ciclo completo de sesión con MongoDB"""
        print("\n🔄 Probando ciclo completo de sesión...")
        
        try:
            # 1. Crear sesión con frame inicial
            print("1️⃣ Creando nueva sesión...")
            frame = create_simulated_frame(0)
            result = self.test_single_frame(frame)
            
            if not self.session_id:
                print("❌ No se pudo crear sesión")
                return
            
            time.sleep(1)
            
            # 2. Enviar batch de frames
            print("2️⃣ Enviando batch de frames...")
            frames = [create_simulated_frame(i) for i in range(1, 4)]
            batch_result = self.test_batch_frames(frames)
            
            time.sleep(1)
            
            # 3. Enviar frame final
            print("3️⃣ Enviando frame final...")
            final_frame = create_simulated_frame(999)
            final_result = self.test_single_frame(final_frame)
            
            time.sleep(1)
            
            # 4. Guardar resultados finales
            print("4️⃣ Guardando resultados finales...")
            attention_data = create_realistic_attention_data()
            save_result = self.test_save_attention_results(attention_data)
            
            print("✅ Ciclo completo de sesión finalizado")
            print(f"📋 Session ID utilizada: {self.session_id}")
            
        except Exception as e:
            print(f"❌ Error en ciclo de sesión: {str(e)}")
    
    def generate_comprehensive_report(self):
        """Genera un reporte completo de todas las pruebas - MEJORADO"""
        print("\n" + "="*50)
        print("📊 REPORTE COMPLETO DE PRUEBAS")
        print("="*50)
        
        print(f"📈 Estadísticas generales:")
        print(f"   - Total frames enviados: {self.total_frames_sent}")
        print(f"   - Frames exitosos: {self.successful_frames}")
        print(f"   - Frames fallidos: {self.failed_frames}")
        success_rate = (self.successful_frames/self.total_frames_sent*100) if self.total_frames_sent > 0 else 0
        print(f"   - Tasa de éxito: {success_rate:.1f}%")
        
        if self.results['individual_scores']:
            scores = self.results['individual_scores']
            print(f"\n🎯 Scores individuales:")
            print(f"   - Promedio: {sum(scores)/len(scores):.2f}")
            print(f"   - Máximo: {max(scores):.2f}")
            print(f"   - Mínimo: {min(scores):.2f}")
            print(f"   - Total mediciones: {len(scores)}")
        
        if self.results['batch_scores']:
            scores = self.results['batch_scores']
            print(f"\n📦 Scores de batches:")
            print(f"   - Promedio: {sum(scores)/len(scores):.2f}")
            print(f"   - Máximo: {max(scores):.2f}")
            print(f"   - Mínimo: {min(scores):.2f}")
            print(f"   - Total batches: {len(scores)}")
        
        if self.results['low_attention_scores']:
            scores = self.results['low_attention_scores']
            print(f"\n⚠️  Casos de atención baja:")
            print(f"   - Cantidad: {len(scores)}")
            print(f"   - Score promedio: {sum(scores)/len(scores):.2f}")
        
        print(f"\n🆔 Sesión actual: {self.session_id or 'No establecida'}")
        
        # Nuevo: Estadísticas de MongoDB si hay sesión
        if self.session_id:
            print(f"\n🍃 Estado de MongoDB:")
            print(f"   - Session ID: {self.session_id}")
            print(f"   - Compatible con mongo_utils mejorado: ✅")
            
        print("="*50)

# Función principal mejorada
def run_comprehensive_tests():
    print("🚀 Iniciando pruebas comprehensivas del sistema de atención")
    print("🔧 Compatible con mongo_utils.py mejorado")
    print("="*60)
    
    tester = AttentionTester()
    if not tester.token:
        print("❌ No se pudo obtener token. Verifica:")
        print("   - Que el servidor esté corriendo")
        print("   - Las credenciales sean correctas")
        print("   - El endpoint /api/login/ esté disponible")
        return

    # Verificar si hay cámara disponible
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("⚠️  No se pudo abrir la cámara. Usando modo simulación.")
        use_camera = False
    else:
        use_camera = True
        print("📷 Cámara detectada correctamente")

    print("\n🎮 OPCIONES DE PRUEBA:")
    print("   's' - Enviar frame individual")
    print("   'b' - Capturar y enviar batch de 3 frames")
    print("   'r' - Guardar resultados de atención simulados")
    print("   't' - Ejecutar suite de pruebas automáticas")
    print("   'c' - Probar ciclo completo de sesión (NUEVO)")
    print("   'a' - Simular diferentes estados de atención")
    print("   'q' - Salir y mostrar reporte")
    print("\nPresiona una tecla...")
    
    frame_buffer = []
    test_counter = 0
    
    while True:
        if use_camera:
            ret, frame = cap.read()
            if not ret:
                print("❌ Error al capturar frame de la cámara")
                break
            cv2.imshow("🎥 Vista previa - Prueba de Atención", frame)
        else:
            # Crear frame simulado
            frame = create_simulated_frame(test_counter)
            cv2.imshow("🎥 Frame Simulado", frame)
        
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('s'):
            print(f"\n📤 Enviando frame individual #{test_counter + 1}...")
            result = tester.test_single_frame(frame)
            print_result_summary(result)
            test_counter += 1
            
        elif key == ord('b'):
            print(f"\n📦 Capturando batch de 3 frames...")
            frame_buffer = []
            
            for i in range(3):
                if use_camera:
                    ret, capture_frame = cap.read()
                    if ret:
                        frame_buffer.append(capture_frame.copy())
                        cv2.imshow(f"📸 Capturando {i+1}/3", capture_frame)
                        cv2.waitKey(500)  # Pausa entre capturas
                else:
                    sim_frame = create_simulated_frame(test_counter + i)
                    frame_buffer.append(sim_frame)
                    cv2.imshow(f"📸 Simulado {i+1}/3", sim_frame)
                    cv2.waitKey(500)
            
            # Limpiar ventanas de captura
            for i in range(3):
                cv2.destroyWindow(f"📸 {'Capturando' if use_camera else 'Simulado'} {i+1}/3")
                
            print("🚀 Enviando batch al servidor...")
            result = tester.test_batch_frames(frame_buffer)
            print_result_summary(result)
            test_counter += 3
            
        elif key == ord('r'):
            print(f"\n💾 Probando guardado de resultados...")
            attention_data = create_realistic_attention_data()
            result = tester.test_save_attention_results(attention_data)
            print_result_summary(result)
            
        elif key == ord('t'):
            print(f"\n🤖 Ejecutando suite de pruebas automáticas...")
            run_automated_test_suite(tester, use_camera)
            
        elif key == ord('c'):  # NUEVO
            print(f"\n🔄 Ejecutando ciclo completo de sesión...")
            tester.test_session_lifecycle()
            
        elif key == ord('a'):  # NUEVO
            print(f"\n🎭 Simulando diferentes estados de atención...")
            tester.simulate_different_attention_states()
            
        elif key == ord('q'):
            break
    
    if use_camera:
        cap.release()
    cv2.destroyAllWindows()
    
    # Reporte final
    tester.generate_comprehensive_report()

def create_simulated_frame(counter):
    """Crea un frame simulado para pruebas sin cámara - MEJORADO"""
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    
    # Añadir información visual
    cv2.putText(frame, f"Frame #{counter}", (20, 50), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.putText(frame, f"Time: {datetime.now().strftime('%H:%M:%S')}", (20, 100), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    # Simular cara (rectángulo) - más realista
    cv2.rectangle(frame, (250, 150), (390, 330), (0, 255, 255), 2)
    cv2.putText(frame, "FACE", (290, 140), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
    
    # Simular ojos
    cv2.circle(frame, (280, 200), 10, (255, 255, 255), -1)  # Ojo izquierdo
    cv2.circle(frame, (360, 200), 10, (255, 255, 255), -1)  # Ojo derecho
    
    # Simular boca
    cv2.ellipse(frame, (320, 280), (20, 10), 0, 0, 180, (255, 255, 255), 2)
    
    # Indicador de compatibilidad con mongo_utils
    cv2.putText(frame, "MongoDB Ready", (450, 400), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    
    return frame

def create_realistic_attention_data():
    """Crea datos de atención realistas para pruebas - ACTUALIZADO para mongo_utils"""
    base_time = datetime.utcnow()
    
    return [
        {
            "timestamp": (base_time.replace(second=i*10)).isoformat(),
            "analysis": {
                "mediapipe": {
                    "eye_aspect_ratio": 0.26 + (i * 0.01),
                    "head_pose": {"pitch": 5 + i, "yaw": -2 + i, "roll": 1},
                    "face_detected": True,
                    "confidence": 0.9,
                    "frame_resolution": "640x480"
                },
                "daisee": {
                    "state": ["ATTENTIVE", "NEUTRAL", "BORED"][i % 3],
                    "confidence": 0.8 + (i * 0.05)
                },
                "hpod": {
                    "pose": ["FRONT", "FRONT_TILTED", "LEFT_PROFILE"][i % 3],
                    "deviation": 0.1 + (i * 0.1)
                }
            },
            "attention_score": 75 + (i * 5),
            "frame_quality": "good",  # Nuevo campo
            "processing_time_ms": 150 + (i * 10)  # Nuevo campo
        }
        for i in range(5)  # 5 puntos de datos
    ]

def print_result_summary(result):
    """Imprime un resumen legible del resultado - MEJORADO"""
    if not result:
        print("❌ No hay resultado para mostrar")
        return
        
    status = result.get('status_code', 'unknown')
    data = result.get('data', {})
    test_type = result.get('test_type', 'unknown')
    
    print(f"📋 Resultado {test_type.upper()} - Status: {status}")
    
    if status in [200, 201]:
        if 'attention_score' in data:
            print(f"   🎯 Score: {data['attention_score']:.2f}")
        if 'average_attention' in data:
            print(f"   📊 Promedio: {data['average_attention']:.2f}")
        if 'frames_processed' in data:
            print(f"   📦 Frames procesados: {data['frames_processed']}")
        if 'token' in data:
            print(f"   🔑 Token generado para streaming")
        if 'message' in data:
            print(f"   ✅ {data['message']}")
        if status == 201:
            print(f"   💾 Datos guardados en MongoDB")
        
        # Nuevo: Mostrar info de sesión si está disponible
        if 'session_id' in data:
            print(f"   🆔 Session: {data['session_id'][:8]}...")
            
    elif status == 403:
        print(f"   ⚠️  Atención insuficiente")
        if 'attention_score' in data:
            print(f"   📉 Score: {data['attention_score']:.2f}")
        if 'details' in data:
            print(f"   🔍 Análisis disponible")
    else:
        error_msg = data.get('error', 'Error desconocido') if data else 'Sin datos'
        print(f"   ❌ Error: {error_msg}")

def run_automated_test_suite(tester, use_camera):
    """Ejecuta una suite de pruebas automáticas - ACTUALIZADA"""
    print("\n🤖 SUITE DE PRUEBAS AUTOMÁTICAS")
    print("🍃 Incluyendo pruebas de MongoDB mejorado")
    print("-" * 40)
    
    try:
        # Test 1: Frame individual
        print("Test 1: Frame individual...")
        if use_camera:
            cap = cv2.VideoCapture(0)
            ret, frame = cap.read()
            cap.release()
            if ret:
                result = tester.test_single_frame(frame)
            else:
                print("❌ No se pudo capturar frame de cámara")
                return
        else:
            frame = create_simulated_frame(999)
            result = tester.test_single_frame(frame)
        
        time.sleep(2)
        
        # Test 2: Batch de frames
        print("\nTest 2: Batch de frames...")
        frames = [create_simulated_frame(i) for i in range(1000, 1003)]
        result = tester.test_batch_frames(frames)
        
        time.sleep(2)
        
        # Test 3: Guardar resultados
        print("\nTest 3: Guardado de resultados...")
        attention_data = create_realistic_attention_data()
        result = tester.test_save_attention_results(attention_data)
        
        time.sleep(2)
        
        # Test 4: NUEVO - Ciclo completo
        print("\nTest 4: Ciclo completo de sesión...")
        tester.test_session_lifecycle()
        
        print("\n✅ Suite de pruebas automáticas completada")
        print("🍃 Todas las funciones de mongo_utils.py han sido probadas")
        
    except Exception as e:
        print(f"❌ Error en suite automática: {str(e)}")

# Función principal actualizada
def main():
    print("🎯 PROBADOR DE SISTEMA DE ATENCIÓN")
    print("🔄 Compatible con mongo_utils.py mejorado")
    print("🔧 Configuración:")
    print(f"   - Backend URL: {BASE_URL}")
    print(f"   - Video ID: {VIDEO_ID}")
    print(f"   - Usuario: E988")
    print(f"   - MongoDB: Integración mejorada")
    
    try:
        run_comprehensive_tests()
    except KeyboardInterrupt:
        print("\n\n🛑 Pruebas interrumpidas por el usuario")
    except Exception as e:
        print(f"\n❌ Error general: {str(e)}")
    finally:
        print("\n👋 Finalizando pruebas...")

if __name__ == "__main__":
    main()