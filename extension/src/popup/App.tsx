import { useState, useEffect } from 'react'
import { getSettings, saveSettings, ExtensionSettings } from '../services/storage'
import { ApiKeyGate } from './components/ApiKeyGate'
import { Nav } from './components/Nav'
import { GrammarChecker } from './components/GrammarChecker'
import { Paraphraser } from './components/Paraphraser'
import { Summarizer } from './components/Summarizer'
import { ToneAnalyzer } from './components/ToneAnalyzer'
import { Humanizer } from './components/Humanizer'
import { Translator } from './components/Translator'
import { Dictionary } from './components/Dictionary'
import { PromptSuite } from './components/PromptSuite'
import { SettingsPanel } from './components/SettingsPanel'

export type PopupTab =
  | 'grammar' | 'paraphrase' | 'summarize' | 'tone'
  | 'humanize' | 'translate' | 'dictionary' | 'prompt' | 'settings'

export default function App() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [tab, setTab] = useState<PopupTab>('grammar')
  const [initialText, setInitialText] = useState('')

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  // Grab selected text from the active tab when popup opens
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
      if (!activeTab?.id) return
      chrome.tabs.sendMessage(activeTab.id, { type: 'GET_SELECTION' }, (resp) => {
        if (chrome.runtime.lastError) return
        if (resp?.text) setInitialText(resp.text)
      })
    })
  }, [])

  // Check if background stored a pending context-menu tool (uses local, not session,
  // for Firefox compatibility).
  useEffect(() => {
    chrome.storage.local.get(['_pendingTool', '_pendingText'], (result) => {
      if (result._pendingTool) {
        setTab(result._pendingTool as PopupTab)
        if (result._pendingText) setInitialText(result._pendingText)
        chrome.storage.local.remove(['_pendingTool', '_pendingText'])
      }
    })
  }, [])

  // Apply theme
  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    const dark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', dark)
  }, [settings?.theme])

  const updateSettings = async (partial: Partial<ExtensionSettings>) => {
    await saveSettings(partial)
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev))
  }

  if (!settings) return null

  if (!settings.apiKey.trim()) {
    return (
      <ApiKeyGate
        onSave={(key) => updateSettings({ apiKey: key })}
      />
    )
  }

  const sharedProps = { settings, initialText }

  return (
    <div className="flex flex-col h-full bg-[#fdfdfd] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Nav tab={tab} onSelect={setTab} />
      <div className="flex-1 overflow-y-auto">
        {tab === 'grammar'    && <GrammarChecker    {...sharedProps} />}
        {tab === 'paraphrase' && <Paraphraser        {...sharedProps} />}
        {tab === 'summarize'  && <Summarizer         {...sharedProps} />}
        {tab === 'tone'       && <ToneAnalyzer       {...sharedProps} />}
        {tab === 'humanize'   && <Humanizer          {...sharedProps} />}
        {tab === 'translate'  && <Translator         {...sharedProps} />}
        {tab === 'dictionary' && <Dictionary         {...sharedProps} />}
        {tab === 'prompt'     && <PromptSuite        {...sharedProps} />}
        {tab === 'settings'   && <SettingsPanel settings={settings} onUpdate={updateSettings} />}
      </div>
    </div>
  )
}
