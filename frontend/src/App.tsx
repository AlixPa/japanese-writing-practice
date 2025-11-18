import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { MobileNav } from './components/MobileNav'
import { WelcomeView } from './views/WelcomeView'
import { DictationView } from './views/dictation/DictationView'
import { DictationConfigView } from './views/dictation/DictationConfigView'
import { CustomGenerationView } from './views/CustomGenerationView'

export function App() {
  const baseFont = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'

  return (
    <BrowserRouter>
      <div 
        className="flex h-screen"
        style={{ fontFamily: baseFont }}
      >
        <MobileNav />
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 box-border flex flex-col">
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


