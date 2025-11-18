import React from 'react'
import { useNavigate } from 'react-router-dom'

export function WelcomeView() {
  const navigate = useNavigate()
  return (
    <div className="p-4 md:p-6 max-w-full md:max-w-2xl mx-auto flex flex-col gap-6 md:gap-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Japanese Writing Practice
        </h1>
        <p className="text-base md:text-lg text-gray-500 m-0">
          Master Japanese through interactive dictation exercises
        </p>
      </div>

      {/* Features Stack */}
      <div className="flex flex-col gap-5">
        {/* Dictation Card */}
        <div 
          onClick={() => navigate('/dictation')}
          className="border border-gray-200 rounded-xl p-4 md:p-5 bg-white shadow-sm cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
              📝
            </div>
            <h3 className="m-0 text-lg md:text-xl text-gray-900 font-semibold">Dictation</h3>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
            Practice listening and writing Japanese with audio dictation exercises. 
            Choose from WaniKani vocabulary or created custom content.
          </p>
          <div className="text-xs md:text-sm text-gray-400">
            <strong>Features:</strong> Audio playback, speed control, sentence-by-sentence mode
          </div>
        </div>

        {/* Configuration Card */}
        <div 
          onClick={() => navigate('/configuration')}
          className="border border-gray-200 rounded-xl p-4 md:p-5 bg-white shadow-sm cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl flex-shrink-0">
              ⚙️
            </div>
            <h3 className="m-0 text-lg md:text-xl text-gray-900 font-semibold">Configuration</h3>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
            Customize your dictation experience with personalized settings. 
            Create different configurations for various practice scenarios.
          </p>
          <div className="text-xs md:text-sm text-gray-400">
            <strong>Features:</strong> Speed settings, wait times, repetition controls
          </div>
        </div>

        {/* Generation Card */}
        <div 
          onClick={() => navigate('/generation')}
          className="border border-gray-200 rounded-xl p-4 md:p-5 bg-white shadow-sm cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-xl flex-shrink-0">
              🎯
            </div>
            <h3 className="m-0 text-lg md:text-xl text-gray-900 font-semibold">Generation (Coming Soon)</h3>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
            Generate custom Japanese content for your practice sessions. 
            Create tailored exercises based on your learning needs.
          </p>
          <div className="text-xs md:text-sm text-gray-400">
            <strong>Features:</strong> Custom text input, audio generation
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-5 border-t border-gray-200 text-gray-400 text-xs md:text-sm">
        Select any tab from the sidebar to begin your Japanese learning journey!
      </div>
    </div>
  )
}
