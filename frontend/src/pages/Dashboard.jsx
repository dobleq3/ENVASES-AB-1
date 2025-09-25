import React, { useEffect, useState, useRef } from "react"
import LineCard from "../Components/LineCard"
import { useLineStore } from "../store/LineStore"
import { fetchLines } from "../services/api"
import { connectWebSocket } from "../services/socket"

export default function Dashboard() {
  const { lines, setLines } = useLineStore()
  const [prevLines, setPrevLines] = useState([])
  const contenedorRef = useRef()
  const scrollIntervalRef = useRef()

  useEffect(() => {
    fetchLines().then(setLines)

    const socket = connectWebSocket((msg) => {
      if (msg.startsWith("updated:") || msg.startsWith("created:")) {
        fetchLines().then(setLines)
      }
    })

    return () => {
      if (socket.readyState === WebSocket.OPEN) socket.close()
      clearInterval(scrollIntervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (!contenedorRef.current || lines.length === 0) return

    const scrollPaso = 120
    const intervalo = 3000
    let direccion = 1

    scrollIntervalRef.current = setInterval(() => {
      const el = contenedorRef.current
      if (!el) return

      el.scrollBy({ top: scrollPaso * direccion, behavior: "smooth" })

      const alFinal = el.scrollTop + el.clientHeight >= el.scrollHeight - 5
      const alInicio = el.scrollTop <= 0

      if (alFinal) direccion = -1
      else if (alInicio) direccion = 1
    }, intervalo)

    return () => clearInterval(scrollIntervalRef.current)
  }, [lines.length])

  const totalCambio = lines.filter(l => l.status === "Cambio Formato").length
  const totalEnProceso = lines.filter(l => l.status === "En Proceso").length
  const totalFinalizadas = lines.filter(l => l.status === "Finalizado").length
  const totalSinCarga = lines.filter(l => l.status === "Sin Carga").length

  const sortedLines = [...lines].sort((a, b) => {
    const numA = parseInt(a.line_id.replace(/\D/g, ''), 10)
    const numB = parseInt(b.line_id.replace(/\D/g, ''), 10)
    return numA - numB
  })

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl mb-6 text-center">
        Dashboard Producción Envases AB
      </h1>

      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm text-gray-300">
        <div className="bg-gray-800 p-3 rounded shadow text-center">
          <p className="text-xs uppercase text-gray-400">Total</p>
          <p className="text-lg font-bold text-blue-400">{lines.length}</p>
        </div>
        <div className="bg-red-900 p-3 rounded shadow text-center">
          <p className="text-xs uppercase text-red-200">Cambio Formato</p>
          <p className="text-lg font-bold text-red-400">{totalCambio}</p>
        </div>
        <div className="bg-yellow-900 p-3 rounded shadow text-center">
          <p className="text-xs uppercase text-yellow-200">En proceso</p>
          <p className="text-lg font-bold text-yellow-400">{totalEnProceso}</p>
        </div>
        <div className="bg-green-900 p-3 rounded shadow text-center">
          <p className="text-xs uppercase text-green-200">Finalizado</p>
          <p className="text-lg font-bold text-green-400">{totalFinalizadas}</p>
        </div>
        <div className="bg-purple-900 p-3 rounded shadow text-center">
          <p className="text-xs uppercase text-purple-200">Sin Carga</p>
          <p className="text-lg font-bold text-purple-400">{totalSinCarga}</p>
        </div>
      </div>

      <div
        ref={contenedorRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto scroll-smooth pr-2"
      >
        {sortedLines.map((line, index) => {
          const isLast = index === sortedLines.length - 1

          return (
            <React.Fragment key={line.line_id}>
              {/* Inserta un placeholder si es la última tarjeta */}
              {isLast && (
                <div className="hidden lg:block" />
              )}
              <LineCard line={line} />
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
