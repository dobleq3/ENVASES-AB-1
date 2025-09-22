from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends

client = AsyncIOMotorClient("mongodb://localhost:27019")
db = client["lab_tracking"]

def get_collection():
    return db["lines"]

def get_finalizados_collection():
    return db["productos_finalizados"]

def get_eventos_collection():
    return db["eventos_produccion"]

