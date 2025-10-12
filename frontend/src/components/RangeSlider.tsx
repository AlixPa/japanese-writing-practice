import React from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

export function RangeSlider(props: Props) {
  return (
    <>
      <style>
        {`
        .wk-range { -webkit-appearance: none; appearance: none; height: 20px; background: transparent; border-radius: 9999px; outline: none; cursor: pointer; }
        .wk-range::-webkit-slider-runnable-track { height: 6px; background: #e5e7eb; border-radius: 9999px; margin-top: 7px; }
        .wk-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; background: #3b82f6; border-radius: 9999px; border: 2px solid white; margin-top: -6px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
        .wk-range::-moz-range-track { height: 6px; background: #e5e7eb; border-radius: 9999px; }
        .wk-range::-moz-range-thumb { width: 18px; height: 18px; background: #3b82f6; border: 2px solid white; border-radius: 9999px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }
        .wk-range::-moz-range-progress { background: transparent; height: 6px; }
        `}
      </style>
      <input type="range" className="wk-range" {...props} />
    </>
  )
}


