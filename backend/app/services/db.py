from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Conexión a MongoDB Atlas
client = AsyncIOMotorClient(settings.MONGO_URI)

# Selección de base de datos (extraída del URI: "electronica")
db = client.get_database("electronica")

# Colecciones disponibles
def get_collection():
    return db.get_collection("lines")

def get_finalizados_collection():
    return db.get_collection("productos_finalizados")

def get_eventos_collection():
    return db.get_collection("eventos_produccion")
