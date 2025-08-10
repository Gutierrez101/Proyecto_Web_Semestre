# test_mongo_utils.py
import os
import django
from users.mongo_utils import save_attention_data, get_user_attention_stats

# Configura Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendproyecto.settings')
django.setup()

# Datos de prueba
test_data = {
    "user_id": "test_user_123",
    "video_id": 456,
    "session_id": "session_789",
    "attention_data": [
        {"timestamp": "2024-06-05T12:00:00", "attention_score": 0.8},
        {"timestamp": "2024-06-05T12:00:05", "attention_score": 0.6}
    ]
}

# Ejecutar prueba
if __name__ == "__main__":
    print("=== Iniciando prueba de MongoDB ===")
    
    # 1. Guardar datos
    print("Insertando datos de prueba...")
    result = save_attention_data(
        user_id=test_data["user_id"],
        video_id=test_data["video_id"],
        session_id=test_data["session_id"],
        attention_data=test_data["attention_data"]
    )
    
    # 2. Leer datos
    print("\nLeyendo datos guardados...")
    stats = get_user_attention_stats(user_id=test_data["user_id"])
    print(f"Registros encontrados: {len(stats)}")
    for doc in stats:
        print(f"ID: {doc.get('_id')}, Atención promedio: {doc.get('average_attention')}%")