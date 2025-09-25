import React, { useEffect, useState } from "react"
import { useLineStore } from "../store/LineStore"
import { fetchLines, createLine, updateLine } from "../services/api"
import toast from "react-hot-toast"

const LINE_IDS = Array.from({ length: 10 }, (_, i) => `L${i + 1}`)

export default function Produccion() {
  const { lines, setLines } = useLineStore()
  const [localForms, setLocalForms] = useState([])
  const [dirtyForms, setDirtyForms] = useState({}) // 👈 guarda qué tarjetas fueron modificadas

  useEffect(() => {
    fetchLines().then((data) => {
      const safeData = Array.isArray(data) ? data : []
      setLines(safeData)

      const forms = LINE_IDS.map((id) => {
        const existing = safeData.find((line) => line.line_id === id)
        return (
          existing || {
            line_id: id,
            product: "",
            next_product: "",
            status: "Sin estado",
            operator: "",
            start_time: null,
            end_time: null,
            end_estimate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            alerts: [],
            updated_at: new Date().toISOString(),
          }
        )
      })

      setLocalForms(forms)
      setDirtyForms({}) // 👈 limpio estado modificado al iniciar
    })
  }, [])

  const handleChange = (index, field, value) => {
    setLocalForms((prev) => {
      const updated = [...prev]
      const current = { ...updated[index] }
      const now = new Date().toISOString()

      if (field === "status") {
        current.estado_anterior = current.status

        if (value === "En Proceso") {
          current.start_time = now
          current.duracion = ""
          current.end_time = null

          // 👇 Si venía de "Cambio Formato", actualiza producto
          if (current.estado_anterior === "Cambio Formato") {
            current.product = current.next_product
            current.next_product = ""
          }
        }


        if (value === "Finalizado") {
          current.end_time = now

          if (current.estado_anterior !== "En Proceso") {
            toast.error(
              `⚠️ Línea ${current.line_id} finalizada sin haber estado en proceso`
            )
          }

          const ms = new Date(current.end_time) - new Date(current.start_time)
          const minutos = Math.floor(ms / 60000)
          const horas = Math.floor(minutos / 60)
          const restante = minutos % 60
          current.duracion = `${horas}h ${restante}min`

        }


        if (value === "Sin Carga") {
          current.product = "Sin asignar"
          current.next_product = "Sin asignar"
        }
      }

      updated[index] = { ...current, [field]: value, updated_at: now }
      return updated
    })

    // 👇 Marca esta tarjeta como modificada
    setDirtyForms((prev) => ({ ...prev, [index]: true }))
  }

const handleSubmit = async (index) => {
  const line = { ...localForms[index] }

  // 👇 Validación para "Cambio Formato"
  if (
    line.status === "Cambio Formato" &&
    (!line.product.trim() || !line.next_product.trim())
  ) {
    toast.error(`Línea ${line.line_id}: Debes completar los campos producto y producto siguiente`)
    return
  }

  if (line.status === "Sin Carga") {
    line.product = "Sin asignar"
    line.next_product = "Sin asignar"
  }

  const duracion = calcularDuracion(line.start_time, line.end_time)

  const payload = {
    ...line,
    duration: duracion || "",
    alerts: Array.isArray(line.alerts) ? line.alerts : [],
    updated_at: new Date().toISOString(),
  }

  try {
    await createLine(payload)
    toast.success(`✅ Línea ${line.line_id} creada`)
  } catch (err) {
    if (err.message === "EXISTS") {
      try {
        await updateLine(line.line_id, payload)
        toast.success(`🔄 Línea ${line.line_id} actualizada`)
      } catch {
        toast.error(`❌ Error al actualizar línea ${line.line_id}`)
      }
    } else {
      toast.error(`❌ Error al guardar línea ${line.line_id}`)
    }
  }

  setLines((prev) => {
    const updated = [...prev]
    const idx = updated.findIndex((l) => l.line_id === line.line_id)
    if (idx !== -1) {
      updated[idx] = payload
    } else {
      updated.push(payload)
    }
    return updated
  })

  setLocalForms((prev) => {
    const updated = [...prev]
    updated[index] = payload
    return updated
  })

  setDirtyForms((prev) => ({ ...prev, [index]: false }))
}

const statusColors = {
  "Cambio Formato": "bg-red-900 text-red-200 border-red-500",
  "En Proceso": "bg-yellow-900 text-yellow-200 border-yellow-500",
  Finalizado: "bg-green-900 text-green-200 border-green-500",
  "Sin Carga": "bg-purple-900 text-purple-200 border-purple-500",
}

  const calcularDuracion = (start, end) => {
    if (!start || !end) return null
    const inicio = new Date(start)
    const fin = new Date(end)
    if (isNaN(inicio) || isNaN(fin)) return null

    const ms = fin - inicio
    const minutos = Math.floor(ms / 60000)
    const horas = Math.floor(minutos / 60)
    const restante = minutos % 60
    return `${horas}h ${restante}min`
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl mb-6 text-center">Producción Envases AB</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {localForms.map((form, index) => {
          const lineNumber = parseInt(form.line_id.replace(/\D/g, ""), 10)
          const style =
            statusColors[form.status] ||
            "bg-gray-800 text-gray-200 border-gray-500"

          return (
            <div
              key={form.line_id}
              className={`border-l-6 p-4 rounded shadow-md ${style}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Línea {lineNumber}</h3>
                <span className="text-xs uppercase px-2 py-1 bg-black/20 rounded-full">
                  {form.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <input
                  name="product"
                  value={form.product}
                  onChange={(e) =>
                    handleChange(index, "product", e.target.value)
                  }
                  className="w-full bg-black/10 text-white p-2 rounded"
                  placeholder="📦 Producto actual"
                />
                <input
                  name="next_product"
                  value={form.next_product}
                  onChange={(e) =>
                    handleChange(index, "next_product", e.target.value)
                  }
                  className="w-full bg-black/10 text-white p-2 rounded"
                  placeholder="📦 Producto siguiente"
                />

                <select
                  name="status"
                  value={form.status}
                  onChange={(e) =>
                    handleChange(index, "status", e.target.value)
                  }
                  className={`w-full p-2 rounded ${
                    statusColors[form.status] || "bg-gray-800 text-gray-200"
                  }`}
                >
                  <option value="Cambio Formato">Cambio Formato</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Sin Carga">Sin Carga</option>
                </select>

                <select
                  name="operator"
                  value={form.operator}
                  onChange={(e) =>
                    handleChange(index, "operator", e.target.value)
                  }
                  className={`w-full p-2 rounded ${
                    statusColors[form.status] || "bg-gray-800 text-gray-200"
                  }`}
                >
                  <option value="">Responsable</option>
                  <option value="Gustavo Vasquez">Gustavo Vasquez</option>
                  <option value="Liborio Rojas">Liborio Rojas</option>
                  <option value="Luis Sepulveda">Luis Sepulveda</option>
                </select>
              </div>

              {form.start_time && form.end_time && (
                <p className="text-xs text-green-300">
                  ⏱️ Duración: {calcularDuracion(form.start_time, form.end_time)}
                </p>
              )}

              {dirtyForms[index] && (
                <button
                  onClick={() => handleSubmit(index)}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full"
                >
                  Actualizar
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
