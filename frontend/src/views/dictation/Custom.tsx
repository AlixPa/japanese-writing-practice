import React from 'react'

export function DictationCustom({ selectedConfigId }: { selectedConfigId: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-10">
      <div className="border border-gray-200 rounded-xl p-6 md:p-8 bg-white max-w-full md:max-w-md w-full">
        <h2 className="m-0 text-lg md:text-xl mb-2 text-gray-900 font-semibold">Coming Soon</h2>
        <p className="m-0 text-gray-500 text-sm md:text-base mb-2">
          Custom dictation will be available in the advanced version.
        </p>
        <p className="m-0 text-gray-400 text-xs md:text-sm">
          Play the custom dictation exercises you created with your own text and settings.
        </p>
      </div>
    </div>
  )
}


