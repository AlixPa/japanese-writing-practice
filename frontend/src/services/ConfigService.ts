import { ConfigService, ConfigStep, ElementType, ElementTypeName } from '@/types/player'
import { hasConfigChanged, getElementType, getElementTypeName } from '@/utils/playerUtils'

export class ConfigService implements ConfigService {
  hasConfigChanged(current: ConfigStep[], previous: ConfigStep[]): boolean {
    return hasConfigChanged(current, previous)
  }

  getElementType(step: ConfigStep): ElementType {
    return getElementType(step)
  }

  getElementTypeName(elementType: ElementType): ElementTypeName {
    return getElementTypeName(elementType)
  }
}

// Factory function to create ConfigService instance
export function createConfigService(): ConfigService {
  return new ConfigService()
}
