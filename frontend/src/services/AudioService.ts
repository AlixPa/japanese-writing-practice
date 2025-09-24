import { AudioService, AudioMetadata, AudioChunk } from '@/types/player'

export class AudioService implements AudioService {
  constructor(
    private getAudioMetadata: (storyId: string, speed: number) => Promise<AudioMetadata>,
    private getSentenceMetadata: (storyId: string, speed: number) => Promise<AudioChunk[]>,
    private getAudioBlob: (audioId: string) => Promise<Blob>
  ) {}

  async getAudioMetadata(storyId: string, speed: number): Promise<AudioMetadata> {
    return this.getAudioMetadata(storyId, speed)
  }

  async getSentenceMetadata(storyId: string, speed: number): Promise<AudioChunk[]> {
    return this.getSentenceMetadata(storyId, speed)
  }

  async getAudioBlob(audioId: string): Promise<Blob> {
    return this.getAudioBlob(audioId)
  }
}

// Factory function to create AudioService instance
export function createAudioService(
  getAudioMetadata: (storyId: string, speed: number) => Promise<AudioMetadata>,
  getSentenceMetadata: (storyId: string, speed: number) => Promise<AudioChunk[]>,
  getAudioBlob: (audioId: string) => Promise<Blob>
): AudioService {
  return new AudioService(getAudioMetadata, getSentenceMetadata, getAudioBlob)
}
