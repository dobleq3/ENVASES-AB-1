const API_URL = import.meta.env.VITE_API_URL;

async function parseJsonSafe(res) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  } else {
    const text = await res.text();
    throw new Error(`Respuesta no es JSON: ${text.slice(0, 100)}...`);
  }
}

export async function fetchLines() {
  const res = await fetch(`${API_URL}/lines`);
  if (!res.ok) throw new Error("Error al obtener líneas");
  const data = await parseJsonSafe(res);
  return Array.isArray(data) ? data : [];
}

export async function updateLine(lineId, data) {
  const res = await fetch(`${API_URL}/lines/${lineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await parseJsonSafe(res);
    throw new Error(error.detail || "Error al actualizar línea");
  }
}

export async function createLine(data) {
  const res = await fetch(`${API_URL}/lines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await parseJsonSafe(res);
    if (error.detail === "Línea ya existe") {
      throw new Error("EXISTS");
    }
    throw new Error(error.detail || "Error desconocido");
  }
}
