import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Produccion from './pages/Produccion'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/produccion" element={<Produccion />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  )
}

export default App
