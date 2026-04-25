export type GeminiModel =
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-pro-preview'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'

export interface ExtensionSettings {
  apiKey: string
  model: GeminiModel
  proModel: GeminiModel
  preserveInformality: boolean
  theme: 'light' | 'dark' | 'system'
}

const DEFAULTS: ExtensionSettings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  proModel: 'gemini-2.5-pro',
  preserveInformality: false,
  theme: 'system',
}

export function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULTS, (result) => {
      resolve(result as ExtensionSettings)
    })
  })
}

export function saveSettings(partial: Partial<ExtensionSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(partial, resolve)
  })
}
