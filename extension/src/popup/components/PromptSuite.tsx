import { useState, useEffect } from 'react'
import { processPrompt, PromptMakeResult, PromptOptimizeResult, PromptRewriteResult } from '../../services/gemini'
import { ExtensionSettings } from '../../services/storage'
import { ToolShell, ResultBlock } from './ToolShell'

type Action = 'make' | 'optimize' | 'rewrite'

const ACTIONS: Array<{ value: Action; label: string; desc: string }> = [
  { value: 'make',     label: 'Make',     desc: 'Rough idea → production prompt' },
  { value: 'optimize', label: 'Optimize', desc: 'Refine an existing prompt'      },
  { value: 'rewrite',  label: 'Rewrite',  desc: 'Adapt to a new goal/style'      },
]

interface Props { settings: ExtensionSettings; initialText: string }

export function PromptSuite({ settings, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [action, setAction] = useState<Action>('make')
  const [goal, setGoal] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<PromptMakeResult | PromptOptimizeResult | PromptRewriteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (initialText) setText(initialText) }, [initialText])

  const run = async () => {
    if (!text.trim()) return
    setRunning(true); setError(null)
    try {
      setResult(await processPrompt(action, text, goal, settings.model, settings.apiKey))
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred.')
    } finally {
      setRunning(false)
    }
  }

  const currentAction = ACTIONS.find((a) => a.value === action)!
  const placeholder = action === 'make'
    ? 'Describe your rough idea…'
    : action === 'optimize'
    ? 'Paste the prompt to optimize…'
    : 'Paste the prompt to rewrite…'

  return (
    <ToolShell
      title="Prompt Suite"
      description="Build, optimize, and rewrite LLM prompts."
      inputValue={text}
      onInputChange={(v) => { setText(v); setResult(null); setError(null) }}
      inputPlaceholder={placeholder}
      controls={
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {ACTIONS.map((a) => (
              <button
                key={a.value}
                onClick={() => { setAction(a.value); setResult(null) }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  action === a.value
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-neutral-400">{currentAction.desc}</p>
          {action === 'rewrite' && (
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe the new goal or style…"
              className="text-[11px] px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none"
            />
          )}
        </div>
      }
      onRun={run}
      runLabel={`${action.charAt(0).toUpperCase() + action.slice(1)} Prompt`}
      runningLabel="Processing…"
      isRunning={running}
      error={error}
      onRetry={run}
      result={result && (
        <div className="flex flex-col">
          <ResultBlock label="Result" text={(result as any).resultPrompt} />
          {'improvements' in result && result.improvements.length > 0 && (
            <div className="px-3 pb-3 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mt-2 mb-1.5">Improvements</p>
              <ul className="flex flex-col gap-1">
                {(result as PromptOptimizeResult).improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span className="text-neutral-300 flex-shrink-0 mt-0.5">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    />
  )
}
