# app/websocket/socket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager

router = APIRouter()
grafana_clients = set()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.websocket("/ws/grafana")
async def grafana_ws(websocket: WebSocket):
    await websocket.accept()
    grafana_clients.add(websocket)
    print(f"📡 Cliente conectado a /ws/grafana: {websocket.client}")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        grafana_clients.discard(websocket)
        print(f"🔌 Cliente desconectado de /ws/grafana: {websocket.client}")