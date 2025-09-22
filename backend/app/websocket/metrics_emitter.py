from app.services.db import get_collection, get_finalizados_collection
from app.websocket.manager import manager
from app.websocket.socket import grafana_clients
from datetime import datetime, timezone, timedelta
import json
import statistics
from collections import defaultdict
from dateutil import parser
import asyncio

# Diccionarios persistentes para controlar parpadeo por línea
productos_finalizados_previos = {}
estados_previos = {}

async def emitir_metricas():
    collection = get_collection()
    collection_finalizados = get_finalizados_collection()

    # 📥 Estado actual de líneas
    lines = await collection.find().to_list(100)

    # 📥 Productos finalizados (histórico)
    lines_finalizados = await collection_finalizados.find().to_list(2000)

    metricas = {}

    # ============================
    # 📊 MÉTRICAS DE LÍNEAS ACTIVAS
    # ============================
    for l in lines:
        line_id = l.get("line_id", "LX")
        producto = l.get("product", "Sin asignar")
        estado = l.get("status", "Sin estado")
        responsable = l.get("operator", "Sin asignar")

        # --- Calcular duración en segundos ---
        duracion_seg = 0
        fin = None
        start, end = l.get("start_time"), l.get("end_time")
        if start and end:
            try:
                if isinstance(start, dict):
                    start = datetime.fromisoformat(start["$date"].replace("Z", "+00:00"))
                if isinstance(end, dict):
                    end = datetime.fromisoformat(end["$date"].replace("Z", "+00:00"))
                duracion_seg = (end - start).total_seconds()
                fin = end.isoformat()
            except Exception:
                pass

        # --- Guardar métricas por línea ---
        metricas[f"{line_id}_producto"] = producto
        metricas[f"{line_id}_estado"] = estado
        metricas[f"{line_id}_responsable"] = responsable
        metricas[f"{line_id}_duracion_segundos"] = duracion_seg
        metricas[f"{line_id}_fin"] = fin or "Sin fin"

        # --- Emitir parpadeo solo si el producto finaliza y es nuevo ---
        estado_anterior = estados_previos.get(line_id)
        producto_anterior = productos_finalizados_previos.get(line_id)

        if estado == "Finalizado" and estado_anterior != "Finalizado":
            if producto != producto_anterior:
                for i in range(30):
                    payload = {
                        "tipo": "parpadeo_producto",
                        "line_id": line_id if i % 2 == 0 else "",
                        "producto": producto if i % 2 == 0 else "",
                        "timestamp": datetime.utcnow().isoformat()
                    }

                    await manager.broadcast_json(payload)

                    for client in list(grafana_clients):
                        try:
                            await client.send_json(payload)
                        except Exception:
                            grafana_clients.discard(client)

                    await asyncio.sleep(1)

                productos_finalizados_previos[line_id] = producto

        # --- Limpiar registro si la línea cambia de estado ---
        if estado != "Finalizado":
            productos_finalizados_previos.pop(line_id, None)

        estados_previos[line_id] = estado

    # ============================
    # 📊 MÉTRICAS DESDE FINALIZADOS
    # ============================
    duraciones_finalizados = []
    resumen_lineas = defaultdict(list)

    ahora = datetime.utcnow().replace(tzinfo=timezone.utc)
    inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    inicio_dia = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    fin_dia = inicio_dia + timedelta(days=1)

    total_mes = 0
    total_hoy = 0

    def parse_datetime(value):
        if not value:
            return None
        try:
            if isinstance(value, dict) and "$date" in value:
                return parser.isoparse(value["$date"]).astimezone(timezone.utc)
            if isinstance(value, str):
                return parser.isoparse(value).astimezone(timezone.utc)
            return value if isinstance(value, datetime) else None
        except Exception:
            return None

    for l in lines_finalizados:
        raw_finalizado = l.get("finalizado_en")
        if not raw_finalizado or not isinstance(raw_finalizado, str):
            continue

        finalizado_en = parse_datetime(raw_finalizado)
        if not finalizado_en:
            continue

        start = parse_datetime(l.get("start_time"))
        end = parse_datetime(l.get("end_time"))

        if start and end:
            duracion_seg = (end - start).total_seconds()
            duraciones_finalizados.append(duracion_seg)

            if finalizado_en >= inicio_mes:
                total_mes += 1
            if inicio_dia <= finalizado_en < fin_dia:
                total_hoy += 1

            resumen_lineas[l.get("line_id", "LX")].append(duracion_seg)

    metricas["total_productos_finalizados"] = len(lines_finalizados)
    metricas["productos_finalizados_mes"] = total_mes
    metricas["productos_finalizados_hoy"] = total_hoy
    metricas["duracion_promedio_finalizados_segundos"] = (
        statistics.mean(duraciones_finalizados) if duraciones_finalizados else 0
    )

    for line_id, durs in resumen_lineas.items():
        metricas[f"{line_id}_productos_finalizados"] = len(durs)
        metricas[f"{line_id}_duracion_promedio_finalizados_segundos"] = (
            statistics.mean(durs) if durs else 0
        )

    # ============================
    # 📅 TIMESTAMP GLOBAL
    # ============================
    timestamp = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")

    payload = {
        "tipo": "metricas_actuales",
        "timestamp": timestamp,
        **metricas,
    }

    await manager.broadcast(json.dumps(payload, default=str))
    for client in list(grafana_clients):
        try:
            await client.send_json(payload)
        except Exception:
            grafana_clients.discard(client)
