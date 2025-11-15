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

async function apiFetch<T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
  token?: string | null
): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
  }

  // Add authorization header if token is provided
  // Backend expects lowercase 'authorization' header with just the token (not "Bearer <token>")
  if (token) {
    headers['authorization'] = token
  }

  const res = await fetch(input, {
    ...init,
    headers,
  })

  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  // Handle 204 with void type
  // @ts-ignore
  if (res.status === 204) return undefined
  return (await res.json()) as T
}

// Create API functions that accept token
export function createApi(token: string | null) {
  return {
    getConfigs: () => apiFetch<GetConfigsResponse>('/api/config', undefined, token),
    saveConfig: (payload: ApiConfig) =>
      apiFetch<void>(
        '/api/config',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        token
      ),
    deleteConfig: (id: string) =>
      apiFetch<void>(
        `/api/config?config_id=${encodeURIComponent(id)}`,
        { method: 'DELETE' },
        token
      ),

    getStory: (level: number) =>
      apiFetch<StoriesResponse>(
        `/api/story/wanikani?level=${encodeURIComponent(level)}`,
        undefined,
        token
      ),
    getAudioMetadata: (storyId: string, speed: number) =>
      apiFetch<AudioMetadata>(
        `/api/audio/metadata?story_id=${encodeURIComponent(storyId)}&speed=${encodeURIComponent(speed)}`,
        undefined,
        token
      ),
    getSentenceMetadata: (storyId: string, speed: number) =>
      apiFetch<SentenceMetadataResponse>(
        `/api/audio/metadata/sentence?story_id=${encodeURIComponent(storyId)}&speed=${encodeURIComponent(speed)}`,
        undefined,
        token
      ),
  }
}

// Legacy API export for backward compatibility (without auth)
// This will be used by components that haven't been updated yet
export const api = {
  getConfigs: () => apiFetch<GetConfigsResponse>('/api/config'),
  saveConfig: (payload: ApiConfig) =>
    apiFetch<void>('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  deleteConfig: (id: string) =>
    apiFetch<void>(`/api/config?config_id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getStory: (level: number) =>
    apiFetch<StoriesResponse>(
      `/api/story/wanikani?level=${encodeURIComponent(level)}`
    ),
  getAudioMetadata: (storyId: string, speed: number) =>
    apiFetch<AudioMetadata>(
      `/api/audio/metadata?story_id=${encodeURIComponent(storyId)}&speed=${encodeURIComponent(speed)}`
    ),
  getSentenceMetadata: (storyId: string, speed: number) =>
    apiFetch<SentenceMetadataResponse>(
      `/api/audio/metadata/sentence?story_id=${encodeURIComponent(storyId)}&speed=${encodeURIComponent(speed)}`
    ),
}


