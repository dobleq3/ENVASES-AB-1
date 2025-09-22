from datetime import datetime

async def registrar_evento(collection, line_id: str, status: str, product: str, operator: str):
    evento = {
            "line_id": line_id,
            "estado": status,
            "product": product,
            "operator": operator,
            "tipo": "transicion_estado",
            "timestamp": datetime.utcnow().isoformat()
    }
    await collection.insert_one(evento)
