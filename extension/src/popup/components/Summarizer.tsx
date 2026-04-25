import { useState, useEffect } from 'react'
import { summarizeText, SummaryResult } from '../../services/gemini'
import { ExtensionSettings } from '../../services/storage'
import { ToolShell, ResultBlock, KeyPoints } from './ToolShell'

const LENGTHS = [
  { value: 'short',  label: 'Short'  },
  { value: 'medium', label: 'Medium' },
  { value: 'long',   label: 'Long'   },
]

interface Props { settings: ExtensionSettings; initialText: string }

export function Summarizer({ settings, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [length, setLength] = useState('medium')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (initialText) setText(initialText) }, [initialText])

  const run = async () => {
    if (!text.trim()) return
    setRunning(true); setError(null)
    try {
      setResult(await summarizeText(text, length, settings.model, settings.apiKey))
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <ToolShell
      title="Summarizer"
      description="Distill text into a concise summary."
      inputValue={text}
      onInputChange={(v) => { setText(v); setResult(null); setError(null) }}
      inputPlaceholder="Paste text to summarize…"
      controls={
        <div className="flex gap-1">
          {LENGTHS.map((l) => (
            <button
              key={l.value}
              onClick={() => setLength(l.value)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                length === l.value
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      }
      onRun={run}
      runLabel="Summarize"
      runningLabel="Summarizing…"
      isRunning={running}
      error={error}
      onRetry={run}
      result={result && (
        <>
          <ResultBlock label="Summary" text={result.summary} />
          <KeyPoints points={result.keyPoints} />
        </>
      )}
    />
  )
}
