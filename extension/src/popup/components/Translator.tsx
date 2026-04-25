import { useState, useEffect } from 'react'
import { translateText, TranslateResult } from '../../services/gemini'
import { ExtensionSettings } from '../../services/storage'
import { ToolShell, ResultBlock } from './ToolShell'

const LANGUAGES = [
  'Auto Detect', 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Russian', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean',
  'Arabic', 'Hindi', 'Turkish', 'Dutch', 'Polish', 'Swedish', 'Norwegian',
]

interface Props { settings: ExtensionSettings; initialText: string }

export function Translator({ settings, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [source, setSource] = useState('Auto Detect')
  const [target, setTarget] = useState('English')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<TranslateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (initialText) setText(initialText) }, [initialText])

  const run = async () => {
    if (!text.trim()) return
    setRunning(true); setError(null)
    try {
      const src = source === 'Auto Detect' ? 'auto' : source
      setResult(await translateText(text, src, target, settings.model, settings.apiKey))
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred.')
    } finally {
      setRunning(false)
    }
  }

  const selectClass = 'text-[11px] px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none flex-1'

  return (
    <ToolShell
      title="Translator"
      description="Translate text between languages."
      inputValue={text}
      onInputChange={(v) => { setText(v); setResult(null); setError(null) }}
      inputPlaceholder="Paste text to translate…"
      controls={
        <div className="flex gap-2 items-center">
          <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass}>
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
          <span className="text-neutral-400 text-xs">→</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={selectClass}>
            {LANGUAGES.filter((l) => l !== 'Auto Detect').map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      }
      onRun={run}
      runLabel="Translate"
      runningLabel="Translating…"
      isRunning={running}
      error={error}
      onRetry={run}
      result={result && (
        <div className="flex flex-col">
          <ResultBlock label={`→ ${target}`} text={result.translatedText} />
          {result.notes && (
            <p className="px-3 pb-2 text-[10px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-2">{result.notes}</p>
          )}
        </div>
      )}
    />
  )
}
