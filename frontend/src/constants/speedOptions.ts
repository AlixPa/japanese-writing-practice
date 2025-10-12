// Speed configuration constants
export const SPEED_OPTIONS = [
  { value: 0.65, label: '65%' },
  { value: 0.9, label: '90%' },
  { value: 1.0, label: '100%' }
] as const

export type SpeedValue = typeof SPEED_OPTIONS[number]['value']

// Helper function to get speed label from value
export const getSpeedLabel = (value: number): string => {
  const option = SPEED_OPTIONS.find(opt => opt.value === value)
  return option?.label || `${Math.round(value * 100)}%`
}

// Helper function to get speed value from label
export const getSpeedValue = (label: string): number => {
  const option = SPEED_OPTIONS.find(opt => opt.label === label)
  return option?.value || 1.0
}
