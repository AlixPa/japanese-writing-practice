import { DurationService } from '@/types/player'
import { getWaitDuration } from '@/utils/playerUtils'

export class DurationService implements DurationService {
  constructor(
    private getMainAudioDuration: (speed: number) => Promise<number>,
    private getAudioDurationFromId: (audioId: string) => Promise<number>
  ) {}

  async getMainAudioDuration(speed: number): Promise<number> {
    return this.getMainAudioDuration(speed)
  }

  getWaitDuration(wait: number): number {
    return getWaitDuration(wait)
  }

  async getAudioDurationFromId(audioId: string): Promise<number> {
    return this.getAudioDurationFromId(audioId)
  }
}

// Factory function to create DurationService instance
export function createDurationService(
  getMainAudioDuration: (speed: number) => Promise<number>,
  getAudioDurationFromId: (audioId: string) => Promise<number>
): DurationService {
  return new DurationService(getMainAudioDuration, getAudioDurationFromId)
}
