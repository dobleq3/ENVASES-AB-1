# app/websocket/manager.py
from fastapi import WebSocket
from typing import List
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass  # Silencia errores si el cliente ya cerró

    async def broadcast_json(self, data: dict):
        await self.broadcast(json.dumps(data))  # 👈 convierte dict a texto JSON


manager = ConnectionManager()
