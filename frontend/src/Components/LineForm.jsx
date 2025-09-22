import { useEffect, useState } from 'react'
import { updateLine } from '../services/api'

export default function LineForm({ line }) {
  const [form, setForm] = useState({ ...line })

  useEffect(() => {
    setForm({ ...line })  // sincroniza si el prop cambia
  }, [line])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      updated_at: new Date().toISOString(),  // actualiza timestamp
    }))
  }

  const handleSubmit = async () => {
    const payload = {
      ...form,
      alerts: form.alerts || [],
      start_time: form.start_time || new Date().toISOString(),
      end_estimate: form.end_estimate || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      await updateLine(form.line_id, payload)
      console.log(`✅ Línea ${form.line_id} actualizada`)
    } catch (err) {
      console.error(`❌ Error al actualizar línea ${form.line_id}`, err)
    }
  }

  return (
    <div className="bg-white shadow rounded p-4 border">
      <h2 className="font-semibold text-lg mb-2">
        Línea {parseInt(line.line_id.replace(/\D/g, ''), 10)}
      </h2>
      <input name="product" value={form.product} onChange={handleChange} className="input mb-2 w-full" placeholder="Producto" />
      <input name="quantity" type="number" value={form.quantity} onChange={handleChange} className="input mb-2 w-full" placeholder="Cantidad" />
      <select name="status" value={form.status} onChange={handleChange} className="input mb-2 w-full">
        <option value="Pendiente">Pendiente</option>
        <option value="En Proceso">En Proceso</option>
        <option value="Finalizado">Finalizado</option>
        <option value="Observado">Observado</option>
      </select>
      <input name="operator" value={form.operator} onChange={handleChange} className="input mb-2 w-full" placeholder="Operador" />

    </div>
  )
}
