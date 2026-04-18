export type PaneLayout = 'side-by-side' | 'stacked';
export type AppTab = 'grammar' | 'paraphrase' | 'summarize' | 'tone' | 'prompt' | 'humanizer' | 'translate' | 'dictionary' | 'settings';
export type Theme = 'light' | 'dark' | 'system';

export type GeminiModel = 
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-pro-preview'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro';

export type OptionsStyle = 'tabs' | 'dropdown';

export interface AppSettings {
  preserveInformality: boolean;
  defaultTab: AppTab;
  theme: Theme;
  layout: PaneLayout;
  optionsStyle: OptionsStyle;
  sidebarCollapsed: boolean;
  model: GeminiModel;
  proModel: GeminiModel;
  apiKey: string;
}

const STORAGE_KEY = 'lumina_settings';

const DEFAULT_SETTINGS: AppSettings = {
  preserveInformality: false,
  defaultTab: 'grammar',
  theme: 'system',
  layout: 'side-by-side',
  optionsStyle: 'tabs',
  sidebarCollapsed: false,
  model: 'gemini-3-flash-preview',
  proModel: 'gemini-3.1-pro-preview',
  apiKey: '',
};


export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>) {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
