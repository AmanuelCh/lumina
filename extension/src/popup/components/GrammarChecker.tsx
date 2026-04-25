import { useState, useEffect } from 'react'
import { checkGrammar, GrammarResult } from '../../services/gemini'
import { ExtensionSettings } from '../../services/storage'
import { ToolShell, CopyBtn } from './ToolShell'

interface Props {
  settings: ExtensionSettings
  initialText: string
}

export function GrammarChecker({ settings, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [preserve, setPreserve] = useState(settings.preserveInformality)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<GrammarResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (initialText) setText(initialText) }, [initialText])

  const run = async () => {
    if (!text.trim()) return
    setRunning(true); setError(null)
    try {
      setResult(await checkGrammar(text, settings.model, settings.apiKey, preserve))
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <ToolShell
      title="Grammar Check"
      description="Detect and correct errors in your writing."
      inputValue={text}
      onInputChange={(v) => { setText(v); setResult(null); setError(null) }}
      inputPlaceholder="Paste text to check…"
      controls={
        <label className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 cursor-pointer">
          <input
            type="checkbox"
            checked={preserve}
            onChange={(e) => setPreserve(e.target.checked)}
            className="rounded"
          />
          Preserve informality
        </label>
      }
      onRun={run}
      runLabel="Check Grammar"
      runningLabel="Checking…"
      isRunning={running}
      error={error}
      onRetry={run}
      result={result && (
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Corrected</span>
            <CopyBtn text={result.correctedText} />
          </div>
          <p className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{result.correctedText}</p>
          {result.explanations.length > 0 && (
            <div className="mt-1 border-t border-neutral-100 dark:border-neutral-800 pt-2 flex flex-col gap-2">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Changes ({result.explanations.length})</p>
              {result.explanations.map((ex, i) => (
                <div key={i} className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span className="line-through text-red-400">{ex.original}</span>
                  {' → '}
                  <span className="text-green-600 dark:text-green-400">{ex.correction}</span>
                  <p className="text-[10px] mt-0.5">{ex.explanation}</p>
                </div>
              ))}
            </div>
          )}
          {result.explanations.length === 0 && (
            <p className="text-[11px] text-green-600 dark:text-green-400">No errors found.</p>
          )}
        </div>
      )}
    />
  )
}
