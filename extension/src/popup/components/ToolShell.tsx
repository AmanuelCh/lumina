import { Loader2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface ToolShellProps {
  title: string
  description: string
  inputValue: string
  onInputChange: (v: string) => void
  inputPlaceholder: string
  inputRows?: number
  controls?: React.ReactNode
  onRun: () => void
  runLabel: string
  runningLabel: string
  isRunning: boolean
  result: React.ReactNode | null
  error: string | null
  onRetry: () => void
}

export function ToolShell({
  title,
  description,
  inputValue,
  onInputChange,
  inputPlaceholder,
  inputRows = 5,
  controls,
  onRun,
  runLabel,
  runningLabel,
  isRunning,
  result,
  error,
  onRetry,
}: ToolShellProps) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">{title}</h2>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>

      {controls && <div>{controls}</div>}

      <div className="flex flex-col gap-1">
        <textarea
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={inputPlaceholder}
          rows={inputRows}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onRun() }}
          className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 leading-relaxed"
        />
        <button
          onClick={onRun}
          disabled={isRunning || !inputValue.trim()}
          className="flex items-center justify-center gap-2 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          {isRunning && <Loader2 size={12} className="animate-spin" />}
          {isRunning ? runningLabel : runLabel}
        </button>
      </div>

      {(result || error) && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
          {error ? (
            <div className="p-3 flex flex-col gap-2">
              <p className="text-[11px] text-red-500">{error}</p>
              <button onClick={onRetry} className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline self-start">
                Retry
              </button>
            </div>
          ) : (
            result
          )}
        </div>
      )}
    </div>
  )
}

// ── Copy button used inside result panes ──────────────────────────────────────

export function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      title="Copy"
      className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  )
}

// ── Shared result block ───────────────────────────────────────────────────────

export function ResultBlock({ label, text }: { label?: string; text: string }) {
  return (
    <div className="p-3 flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">{label}</span>
          <CopyBtn text={text} />
        </div>
      )}
      {!label && (
        <div className="flex justify-end"><CopyBtn text={text} /></div>
      )}
      <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  )
}

// ── Key-point list ─────────────────────────────────────────────────────────────

export function KeyPoints({ points }: { points: string[] }) {
  if (!points.length) return null
  return (
    <div className="px-3 pb-3 border-t border-neutral-100 dark:border-neutral-800">
      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mt-2 mb-1.5">Key Points</p>
      <ul className="flex flex-col gap-1">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
            <span className="text-neutral-400 flex-shrink-0 mt-0.5">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
