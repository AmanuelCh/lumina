import { useState, useEffect } from 'react'
import { paraphraseText, ParaphraseResult } from '../../services/gemini'
import { ExtensionSettings } from '../../services/storage'
import { ToolShell, ResultBlock } from './ToolShell'

const STYLES = [
  { value: 'fluent',   label: 'Fluent'    },
  { value: 'formal',   label: 'Formal'    },
  { value: 'informal', label: 'Informal'  },
  { value: 'playful',  label: 'Playful'   },
  { value: 'academic', label: 'Academic'  },
  { value: 'shorten',  label: 'Shorten'   },
  { value: 'expand',   label: 'Expand'    },
  { value: 'slang',    label: 'Slang'     },
]

interface Props { settings: ExtensionSettings; initialText: string }

export function Paraphraser({ settings, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [style, setStyle] = useState('fluent')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ParaphraseResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (initialText) setText(initialText) }, [initialText])

  const run = async () => {
    if (!text.trim()) return
    setRunning(true); setError(null)
    try {
      setResult(await paraphraseText(text, style, settings.model, settings.apiKey))
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <ToolShell
      title="Paraphraser"
      description="Rewrite text in a different style."
      inputValue={text}
      onInputChange={(v) => { setText(v); setResult(null); setError(null) }}
      inputPlaceholder="Paste text to paraphrase…"
      controls={
        <div className="flex flex-wrap gap-1">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                style === s.value
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      }
      onRun={run}
      runLabel="Paraphrase"
      runningLabel="Rewriting…"
      isRunning={running}
      error={error}
      onRetry={run}
      result={result && <ResultBlock label={`${STYLES.find(s => s.value === style)?.label} style`} text={result.paraphrasedText} />}
    />
  )
}
