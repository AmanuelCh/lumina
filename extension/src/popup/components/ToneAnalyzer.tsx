import { useState, useEffect } from 'react'
import { analyzeTone, ToneResult, shiftTone, ShiftToneResult } from '../../services/gemini'
import { ExtensionSettings } from '../../services/storage'
import { ToolShell, ResultBlock } from './ToolShell'

const TONES = ['Confident', 'Empathetic', 'Direct', 'Enthusiastic', 'Formal', 'Casual', 'Authoritative', 'Sincere']

interface Props { settings: ExtensionSettings; initialText: string }

export function ToneAnalyzer({ settings, initialText }: Props) {
  const [text, setText] = useState(initialText)
  const [mode, setMode] = useState<'analyze' | 'shift'>('analyze')
  const [targetTone, setTargetTone] = useState(TONES[0])
  const [running, setRunning] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState<ToneResult | null>(null)
  const [shiftResult, setShiftResult] = useState<ShiftToneResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (initialText) setText(initialText) }, [initialText])

  const run = async () => {
    if (!text.trim()) return
    setRunning(true); setError(null); setAnalyzeResult(null); setShiftResult(null)
    try {
      if (mode === 'analyze') {
        setAnalyzeResult(await analyzeTone(text, settings.model, settings.apiKey))
      } else {
        setShiftResult(await shiftTone(text, targetTone, settings.model, settings.apiKey))
      }
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <ToolShell
      title="Tone"
      description="Analyze or shift the tone of your writing."
      inputValue={text}
      onInputChange={(v) => { setText(v); setAnalyzeResult(null); setShiftResult(null); setError(null) }}
      inputPlaceholder="Paste text…"
      controls={
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {(['analyze', 'shift'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  mode === m
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {m === 'analyze' ? 'Analyze' : 'Shift Tone'}
              </button>
            ))}
          </div>
          {mode === 'shift' && (
            <select
              value={targetTone}
              onChange={(e) => setTargetTone(e.target.value)}
              className="text-[11px] px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              {TONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
        </div>
      }
      onRun={run}
      runLabel={mode === 'analyze' ? 'Analyze Tone' : `Shift to ${targetTone}`}
      runningLabel="Processing…"
      isRunning={running}
      error={error}
      onRetry={run}
      result={
        analyzeResult ? (
          <div className="p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{analyzeResult.primaryTone}</span>
              <span className="text-[10px] text-neutral-400">Formality {analyzeResult.formalityScore}/10</span>
            </div>
            {analyzeResult.secondaryTones.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {analyzeResult.secondaryTones.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-300">{t}</span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">{analyzeResult.analysis}</p>
          </div>
        ) : shiftResult ? (
          <ResultBlock label={`${targetTone} tone`} text={shiftResult.shiftedText} />
        ) : null
      }
    />
  )
}
