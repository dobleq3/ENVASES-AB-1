# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import lines
from app.websocket import socket
from app.websocket.metrics_emitter import emitir_metricas
from app.config import settings
import uvicorn
import asyncio

app = FastAPI()

# CORS para permitir acceso desde frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puedes restringir esto en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas HTTP
app.include_router(lines.router)
# Rutas WebSocket
app.include_router(socket.router)

@app.on_event("startup")
async def iniciar_emision_metricas():
    asyncio.create_task(loop_metricas())

async def loop_metricas():
    while True:
        await emitir_metricas()
        await asyncio.sleep(10)  # cada 10 segundos

@app.get("/")
def home():
    return {"mensaje": "API funcionando correctamente"}

# --- Mantener el servidor escuchando ---
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
