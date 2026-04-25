import { useState, useEffect } from 'react'
import { humanizeAndDetect, HumanizeResult } from '../../services/gemini'
import { ExtensionSettings } from '../../services/storage'
import { ToolShell, ResultBlock } from './ToolShell'

interface Props { settings: ExtensionSettings; initialText: string }

export function Humanizer({ settings, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<HumanizeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (initialText) setText(initialText) }, [initialText])

  const run = async () => {
    if (!text.trim()) return
    setRunning(true); setError(null)
    try {
      setResult(await humanizeAndDetect(text, settings.model, settings.apiKey))
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred.')
    } finally {
      setRunning(false)
    }
  }

  const scoreColor = !result ? '' :
    result.aiScore < 40 ? 'text-green-500' :
    result.aiScore < 65 ? 'text-yellow-500' : 'text-red-500'

  return (
    <ToolShell
      title="Humanizer"
      description="Detect AI-generated text and rewrite it to sound human."
      inputValue={text}
      onInputChange={(v) => { setText(v); setResult(null); setError(null) }}
      inputPlaceholder="Paste text to humanize…"
      onRun={run}
      runLabel="Detect & Humanize"
      runningLabel="Processing…"
      isRunning={running}
      error={error}
      onRetry={run}
      result={result && (
        <div className="flex flex-col">
          <div className="px-3 pt-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">AI Score</span>
            <span className={`text-sm font-bold ${scoreColor}`}>{result.aiScore}%</span>
          </div>
          <p className="px-3 pb-2 text-[11px] text-neutral-500 dark:text-neutral-400">{result.detectionAnalysis}</p>
          <div className="border-t border-neutral-100 dark:border-neutral-800">
            <ResultBlock label="Humanized" text={result.humanizedText} />
          </div>
        </div>
      )}
    />
  )
}
