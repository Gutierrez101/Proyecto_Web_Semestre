# users/mongo_connection.py
from pymongo import MongoClient
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MongoDBConnection:
    _instance = None

    def __init__(self):
        if not settings.MONGO_DB.get('enabled', False):
            raise Exception("MongoDB no está habilitado en settings")
        
        try:
            self.client = MongoClient(
                host=settings.MONGO_DB['host'],
                port=settings.MONGO_DB['port'],
                serverSelectionTimeoutMS=3000  # 3 segundos de timeout
            )
            self.client.admin.command('ping')  # Test de conexión
            self.db = self.client[settings.MONGO_DB['db_name']]
            logger.info("✅ MongoDB conectado correctamente")
        except Exception as e:
            logger.error(f"❌ Error conectando a MongoDB: {str(e)}")
            settings.MONGO_DB['enabled'] = False  # Desactiva MongoDB
            raise

def get_mongo_collection():
    """Obtiene la colección de MongoDB configurada en settings"""
    if not settings.MONGO_DB.get('enabled', False):
        raise Exception("MongoDB no está habilitado en settings")
    
    try:
        connection = MongoDBConnection()
        return connection.db[settings.MONGO_DB['collection']]
    except Exception as e:
        logger.error(f"Error al obtener colección: {str(e)}")
        raise