import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { WelcomeView } from './views/WelcomeView'
import { DictationView } from './views/dictation/DictationView'
import { DictationConfigView } from './views/dictation/DictationConfigView'
import { CustomGenerationView } from './views/CustomGenerationView'

export function App() {
  const baseFont = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', height: '100vh', fontFamily: baseFont }}>
        <Sidebar />

        <main style={{ flex: 1, padding: 24, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<WelcomeView />} />
            <Route path="/dictation" element={<DictationView />} />
            <Route path="/configuration" element={<DictationConfigView />} />
            <Route path="/generation" element={<CustomGenerationView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}


