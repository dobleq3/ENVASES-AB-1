import asyncio
from datetime import datetime, timezone
import json

# 🔹 Mock de colecciones para pruebas
class FakeCollection:
    def __init__(self, docs):
        self.docs = docs

    async def find(self):
        return self

    async def to_list(self, length):
        return self.docs[:length]


# 🔹 Fake data de prueba
fake_lines = [
    {
        "line_id": "L1",
        "status": "En Proceso",
        "product": "Botella 500ml",
        "next_product": "Botella 1L",
        "operator": "Gustavo Vasquez",
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None,
        "duracion": "",
        "eficiencia": "90%",
        "alerts": []
    },
    {
        "line_id": "L2",
        "status": "Finalizado",
        "product": "Botella 1L",
        "next_product": "Botella 2L",
        "operator": "Liborio Rojas",
        "start_time": (datetime.now(timezone.utc).replace(hour=8, minute=0)).isoformat(),
        "end_time": (datetime.now(timezone.utc).replace(hour=10, minute=0)).isoformat(),
        "duracion": "2h 0min",
        "eficiencia": "85%",
        "alerts": ["Mantenimiento"]
    },
]

fake_eventos = [{"tipo": "parada", "linea": "L1", "motivo": "Cambio formato"}]


# 🔹 Reemplazo temporal de get_collection
async def emitir_metricas():
    collection = FakeCollection(fake_lines)
    eventos = FakeCollection(fake_eventos)

    lines = await collection.to_list(100)
    eventos_raw = await eventos.to_list(1000)
    print("📦 Líneas:", lines)
    print("⚡ Eventos:", eventos_raw)

    total_en_proceso = sum(1 for l in lines if l.get("status") == "En Proceso")
    total_finalizadas = sum(1 for l in lines if l.get("status") == "Finalizado")
    total_sin_carga = sum(1 for l in lines if l.get("status") == "Sin Carga")
    total_cambio_formato = sum(1 for l in lines if l.get("status") == "Cambio Formato")

    duraciones = []
    for l in lines:
        start = l.get("start_time")
        end = l.get("end_time")
        if isinstance(start, str) and isinstance(end, str):
            try:
                inicio = datetime.fromisoformat(start)
                fin = datetime.fromisoformat(end)
                duraciones.append((fin - inicio).total_seconds())
            except ValueError:
                continue

    promedio_duracion = sum(duraciones) / len(duraciones) if duraciones else 0
    minutos = int(promedio_duracion // 60)
    horas = minutos // 60
    restante = minutos % 60

    por_operador = {}
    for l in lines:
        op = l.get("operator", "Sin asignar")
        if l.get("status") == "Finalizado":
            por_operador[op] = por_operador.get(op, 0) + 1

    por_linea = []
    producto_por_linea = []
    timestamp = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")

    for l in lines:
        por_linea.append({
            "line_id": l["line_id"],
            "estado": l.get("status"),
            "producto": l.get("product"),
            "next_product": l.get("next_product"),
            "responsable": l.get("operator"),
            "duracion": l.get("duracion", ""),
            "eficiencia": l.get("eficiencia", ""),
            "alertas": len(l.get("alerts", []))
        })

        producto_por_linea.append({
            "timestamp": timestamp,
            "line_id": l["line_id"],
            "producto": l.get("product"),
            "estado": l.get("status"),
            "responsable": l.get("operator")
        })

    payload = {
        "tipo": "metricas",
        "timestamp": timestamp,
        "global": {
            "lineas_en_proceso": total_en_proceso,
            "lineas_finalizadas": total_finalizadas,
            "lineas_sin_carga": total_sin_carga,
            "lineas_cambio_formato": total_cambio_formato,
            "duracion_promedio": f"{horas}h {restante}min",
            "produccion_por_operador": por_operador
        },
        "por_linea": por_linea,
        "producto_por_linea": producto_por_linea
    }

    print("\n✅ Payload generado:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))


# 🔹 Ejecutar asíncrono
if __name__ == "__main__":
    asyncio.run(emitir_metricas())
