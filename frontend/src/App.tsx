import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { WelcomeView } from './views/WelcomeView'
import { DictationView } from './views/dictation/DictationView'
import { DictationConfigView } from './views/dictation/DictationConfigView'
import { CustomGenerationView } from './views/CustomGenerationView'

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'sample1' | 'sample2' | 'sample3'>('home')

  const baseFont = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: baseFont }}>
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />

      <main style={{ flex: 1, padding: 24, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'home' && (
          <WelcomeView />
        )}
        {activeTab === 'sample1' && (
          <DictationView />
        )}
        {activeTab === 'sample2' && (
          <DictationConfigView />
        )}
        {activeTab === 'sample3' && (
          <CustomGenerationView />
        )}
      </main>
    </div>
  )
}


