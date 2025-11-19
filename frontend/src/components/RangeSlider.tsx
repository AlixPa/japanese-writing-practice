import React from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

export function RangeSlider(props: Props) {
  return (
    <>
      <style>
        {`
        .wk-range { 
          -webkit-appearance: none; 
          appearance: none; 
          height: 24px; 
          background: transparent; 
          border-radius: 9999px; 
          outline: none; 
          cursor: pointer; 
        }
        .wk-range::-webkit-slider-runnable-track { 
          height: 6px; 
          background: #e5e7eb; 
          border-radius: 9999px; 
          margin-top: 9px; 
        }
        .wk-range::-webkit-slider-thumb { 
          -webkit-appearance: none; 
          appearance: none; 
          width: 20px; 
          height: 20px; 
          background: #3b82f6; 
          border-radius: 9999px; 
          border: 2px solid white; 
          margin-top: -7px; 
          box-shadow: 0 1px 2px rgba(0,0,0,0.2); 
        }
        .wk-range::-moz-range-track { 
          height: 6px; 
          background: #e5e7eb; 
          border-radius: 9999px; 
        }
        .wk-range::-moz-range-thumb { 
          width: 20px; 
          height: 20px; 
          background: #3b82f6; 
          border: 2px solid white; 
          border-radius: 9999px; 
          box-shadow: 0 1px 2px rgba(0,0,0,0.2); 
        }
        .wk-range::-moz-range-progress { 
          background: transparent; 
          height: 6px; 
        }
        @media (min-width: 768px) {
          .wk-range { height: 20px; }
          .wk-range::-webkit-slider-thumb { width: 18px; height: 18px; margin-top: -6px; }
          .wk-range::-webkit-slider-runnable-track { margin-top: 7px; }
          .wk-range::-moz-range-thumb { width: 18px; height: 18px; }
        }
        `}
      </style>
      <input type="range" className="wk-range min-h-[44px] md:min-h-0" {...props} />
    </>
  )
}


