import React from 'react'

export function CustomGenerationView() {
  return (
    <section className="flex flex-col gap-3 h-full">
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-10">
        <div className="border border-gray-200 rounded-xl p-6 md:p-8 bg-white max-w-full md:max-w-md w-full">
          <h2 className="m-0 text-lg md:text-xl mb-2 text-gray-900 font-semibold">Coming Soon</h2>
          <p className="m-0 text-gray-500 text-sm md:text-base mb-2">
            Custom Generation will be available in the advanced version.
          </p>
          <p className="m-0 text-gray-400 text-xs md:text-sm">
            Create your own dictation exercises with custom text and settings.
          </p>
        </div>
      </div>
    </section>
  )
}
