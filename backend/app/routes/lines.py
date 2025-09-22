from fastapi import APIRouter, Depends, HTTPException
from app.models.line import Line
from app.services.db import get_collection, get_finalizados_collection, get_eventos_collection
from app.websocket.manager import manager
from app.utils.logger import registrar_evento
from typing import List
from datetime import datetime

router = APIRouter()

@router.get("/lines", response_model=List[Line])
async def get_lines(collection=Depends(get_collection)):
    raw_lines = await collection.find().to_list(100)

    clean_lines = []
    for doc in raw_lines:
        doc.pop("_id", None)
        doc.setdefault("start_time", None)
        doc.setdefault("end_time", None)
        doc.setdefault("end_estimate", None)
        doc.setdefault("duration", "")
        doc.setdefault("alerts", [])
        clean_lines.append(Line(**doc))

    return clean_lines


@router.put("/lines/{line_id}")
async def update_line(
    line_id: str,
    line: Line,
    collection=Depends(get_collection),
    finalizados=Depends(get_finalizados_collection),
    eventos=Depends(get_eventos_collection)
):
    result = await collection.update_one({"line_id": line_id}, {"$set": line.dict()})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Línea no encontrada")

    # Registrar evento de transición de estado
    await registrar_evento(
        eventos,
        line_id=line.line_id,
        status=line.status,
        product=line.product,
        operator=line.operator
    )

    # Si se finaliza, guardar en productos_finalizados
    if line.status == "Finalizado":
        doc = line.dict()
        doc.pop("_id", None)
        doc["finalizado_en"] = datetime.utcnow().isoformat()
        await finalizados.insert_one(doc)

    await manager.broadcast(f"updated:{line_id}")
    return {"msg": f"Línea {line_id} actualizada"}

@router.post("/lines")
async def create_line(
    line: Line,
    collection=Depends(get_collection)
):
    existing = await collection.find_one({"line_id": line.line_id})
    if existing:
        raise HTTPException(status_code=400, detail="Línea ya existe")
    await collection.insert_one(line.dict())
    await manager.broadcast(f"created:{line.line_id}")
    return {"msg": f"Línea {line.line_id} creada"}
