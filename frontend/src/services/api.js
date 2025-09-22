const API_URL = import.meta.env.VITE_API_URL;

export async function fetchLines() {
  const res = await fetch(`${API_URL}/lines`)
  const data = await res.json()
  return Array.isArray(data) ? data : [] // ✅ protección
}

export async function updateLine(lineId, data) {
  await fetch(`${API_URL}/lines/${lineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

export async function createLine(data) {
  const res = await fetch(`${API_URL}/lines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    if (error.detail === "Línea ya existe") {
      throw new Error("EXISTS")
    }
    throw new Error(error.detail || "Error desconocido")
  }
}
