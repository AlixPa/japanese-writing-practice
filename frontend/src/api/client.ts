export interface ApiConfig {
  id: string
  name: string
  sequence: Array<{ wait?: number; speed?: number; repeat?: number }>
}

export type GetConfigsResponse = ApiConfig[]

export interface StoryResponse { story_id: string; story_title?: string; story_text: string }
export type StoriesResponse = StoryResponse[]

export interface AudioMetadata { audio_text: string; audio_url: string }
export type SentenceMetadataResponse = AudioMetadata[]

async function apiFetch<T = unknown>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  // Handle 204 with void type
  // @ts-ignore
  if (res.status === 204) return undefined
  return (await res.json()) as T
}

export const api = {
  getConfigs: () => apiFetch<GetConfigsResponse>('/api/config'),
  saveConfig: (payload: ApiConfig) => apiFetch<void>('/api/config', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  }),
  deleteConfig: (id: string) => apiFetch<void>(`/api/config?config_id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getStory: (level: number) => apiFetch<StoriesResponse>(`/api/story/wanikani?level=${encodeURIComponent(level)}`),
  getAudioMetadata: (storyId: string, speed: number) => apiFetch<AudioMetadata>(`/api/audio/metadata?story_id=${encodeURIComponent(storyId)}&speed=${encodeURIComponent(speed)}`),
  getSentenceMetadata: (storyId: string, speed: number) => apiFetch<SentenceMetadataResponse>(`/api/audio/metadata/sentence?story_id=${encodeURIComponent(storyId)}&speed=${encodeURIComponent(speed)}`)
}


