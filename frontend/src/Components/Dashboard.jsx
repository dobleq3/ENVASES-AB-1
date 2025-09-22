import { useEffect } from 'react'
import { useLineStore } from '../store/lineStore'
import { fetchLines } from '../services/api'
import LineForm from '../components/LineForm'

export default function Dashboard() {
  const { lines, setLines } = useLineStore()

  useEffect(() => {
    fetchLines().then(setLines)
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Seguimiento de Producción</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {lines.map((line) => (
          <LineForm key={line.line_id} line={line} />
        ))}
      </div>
    </div>
  )
}
