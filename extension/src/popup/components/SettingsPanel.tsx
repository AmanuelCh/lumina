import { useState } from 'react'
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react'
import { verifyApiKey } from '../../services/gemini'
import { ExtensionSettings, GeminiModel } from '../../services/storage'

const MODELS: Array<{ value: GeminiModel; label: string }> = [
  { value: 'gemini-2.5-flash',       label: 'Gemini 2.5 Flash (fast)'  },
  { value: 'gemini-2.5-pro',         label: 'Gemini 2.5 Pro (quality)' },
  { value: 'gemini-3-flash-preview',  label: 'Gemini 3 Flash (preview)' },
  { value: 'gemini-3.1-pro-preview',  label: 'Gemini 3.1 Pro (preview)' },
]

interface Props {
  settings: ExtensionSettings
  onUpdate: (partial: Partial<ExtensionSettings>) => void
}

export function SettingsPanel({ settings, onUpdate }: Props) {
  const [showKey, setShowKey] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [keySaved, setKeySaved] = useState(false)

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim()) return
    setVerifying(true); setKeyError(null)
    const { valid, error } = await verifyApiKey(newKey.trim())
    setVerifying(false)
    if (valid) {
      onUpdate({ apiKey: newKey.trim() })
      setNewKey(''); setKeySaved(true)
      setTimeout(() => setKeySaved(false), 2000)
    } else {
      setKeyError(error ?? 'Verification failed.')
    }
  }

  const selectClass = 'w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20'

  return (
    <div className="flex flex-col gap-4 p-3">
      <div>
        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Settings</h2>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Configure your Lumina extension.</p>
      </div>

      {/* Current key */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">API Key</label>
        {settings.apiKey && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
            <span className="flex-1 font-mono text-[11px] text-neutral-500">
              {showKey ? settings.apiKey : `${settings.apiKey.slice(0, 6)}${'•'.repeat(Math.max(0, settings.apiKey.length - 6))}`}
            </span>
            <button onClick={() => setShowKey(!showKey)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
              {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button onClick={() => onUpdate({ apiKey: '' })} title="Remove key" className="text-neutral-400 hover:text-red-500">
              <Trash2 size={12} />
            </button>
          </div>
        )}

        <form onSubmit={handleSaveKey} className="flex gap-2">
          <input
            type="password"
            value={newKey}
            onChange={(e) => { setNewKey(e.target.value); setKeyError(null) }}
            placeholder={settings.apiKey ? 'Replace with new key…' : 'AIza…'}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
          />
          <button
            type="submit"
            disabled={verifying || !newKey.trim()}
            className="px-3 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {verifying ? <Loader2 size={12} className="animate-spin" /> : null}
            {verifying ? '…' : 'Save'}
          </button>
        </form>
        {keyError && <p className="text-[11px] text-red-500">{keyError}</p>}
        {keySaved && <p className="text-[11px] text-green-500">API key saved.</p>}
      </div>

      {/* Model */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">Model</label>
        <select
          value={settings.model}
          onChange={(e) => onUpdate({ model: e.target.value as GeminiModel })}
          className={selectClass}
        >
          {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">Theme</label>
        <div className="flex gap-1">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onUpdate({ theme: t })}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-colors ${
                settings.theme === t
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Preserve informality */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.preserveInformality}
          onChange={(e) => onUpdate({ preserveInformality: e.target.checked })}
          className="rounded"
        />
        <span className="text-[11px] text-neutral-600 dark:text-neutral-300">Preserve informality in grammar checks</span>
      </label>
    </div>
  )
}
