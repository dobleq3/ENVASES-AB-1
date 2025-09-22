import { motion } from "framer-motion"
import dayjs from "dayjs"
import "dayjs/locale/es"

export default function LineCard({ line }) {
  const lineNumber = parseInt(line.line_id.replace(/\D/g, ""), 10)

  const statusColors = {
    "Cambio Formato": "border-red-500 bg-red-900 text-red-200",
    "En Proceso": "border-yellow-500 bg-yellow-900 text-yellow-200",
    Finalizado: "border-green-500 bg-green-900 text-green-200",
    "Sin Carga": "border-purple-500 bg-purple-900 text-purple-200",
  }

  const style = statusColors[line.status] || "border-gray-500 bg-gray-800 text-gray-200"
  const isCambioFormato = line.status === "Cambio Formato"
  const hasNextProduct = line.next_product && line.next_product.trim() !== ""

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border-l-6 p-4 rounded shadow-md ${style}`}
    >
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-lg font-semibold">
            Línea {lineNumber}
            <span className="ml-2 text-sm font-normal text-blue-300">
              ({line.product || "Sin producto"})
            </span>
          </h3>
        </div>
        <span className="text-xs uppercase px-2 py-1 bg-black/20 rounded-full">
          {line.status}
        </span>
      </div>

      {/* Producto siguiente animado */}
      <div className="relative overflow-hidden h-6 mb-2">
        {isCambioFormato && hasNextProduct ? (
          <motion.div
            animate={{ x: [100, 0, 100] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 top-0 text-sm text-purple-300 font-semibold"
          >
            🔁 Siguiente: {line.next_product}
          </motion.div>
        ) : (
          <p className="text-sm text-purple-300">
            🔜 Siguiente: {line.next_product || "—"}
          </p>
        )}
      </div>

      {/* Alerta si falta next_product */}
      {!hasNextProduct && (
        <p className="text-xs text-red-300 mt-1">⚠️ Falta definir el producto siguiente</p>
      )}

      {/* Datos adicionales */}
      <p className="text-sm">👨‍🏭 Responsable: {line.operator || "Sin asignar"}</p>
      <p className="text-sm">
        🕒 Actualizado: {dayjs(line.updated_at).locale("es").format("D MMM YYYY HH:mm")}
      </p>

    {line.duration && (
    <p className="text-sm text-green-300">
        ⏱️ Duración registrada: {line.duration}
    </p>
    )}      
    </motion.div>
  )
}
