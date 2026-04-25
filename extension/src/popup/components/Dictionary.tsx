import { useState, useEffect } from 'react'
import { lookupWord, DictionaryResult } from '../../services/gemini'
import { ExtensionSettings } from '../../services/storage'
import { Loader2, CopyIcon } from 'lucide-react'

interface Props { settings: ExtensionSettings; initialText: string }

export function Dictionary({ settings, initialText }: Props) {
  const [query, setQuery] = useState(initialText ? initialText.split(/\s+/)[0] : '')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<DictionaryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialText) {
      const firstWord = initialText.trim().split(/\s+/)[0]
      setQuery(firstWord)
    }
  }, [initialText])

  const run = async () => {
    if (!query.trim()) return
    setRunning(true); setError(null)
    try {
      setResult(await lookupWord(query, settings.model, settings.apiKey))
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Dictionary</h2>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Look up any word, phrase, or idiom.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run() }} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResult(null); setError(null) }}
          placeholder="word, phrase, or idiom…"
          autoFocus
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
        />
        <button
          type="submit"
          disabled={running || !query.trim()}
          className="px-3 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {running ? <Loader2 size={12} className="animate-spin" /> : 'Look up'}
        </button>
      </form>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden text-xs">
          <div className="px-3 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm text-neutral-900 dark:text-white">{result.entry}</span>
              <span className="text-neutral-400 font-mono text-[11px]">{result.pronunciation}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {result.partOfSpeech.map((p) => (
                <span key={p} className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500">{p}</span>
              ))}
              <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-500">{result.frequencyLevel}</span>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800 max-h-64 overflow-y-auto">
            {result.definitions.map((def, i) => (
              <div key={i} className="px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold text-neutral-400">{i + 1}</span>
                  <span className="text-[10px] text-neutral-400 italic">{def.register}</span>
                </div>
                <p className="text-neutral-800 dark:text-neutral-200 mb-1">{def.meaning}</p>
                {def.examples[0] && (
                  <p className="text-[10px] text-neutral-500 italic">"{def.examples[0]}"</p>
                )}
              </div>
            ))}

            {result.synonyms.length > 0 && (
              <div className="px-3 py-2">
                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Synonyms</p>
                <div className="flex flex-wrap gap-1">
                  {result.synonyms.slice(0, 5).map((s) => (
                    <span key={s.word} title={s.nuance} className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] cursor-default">{s.word}</span>
                  ))}
                </div>
              </div>
            )}

            {result.memoryTip && (
              <div className="px-3 py-2 bg-amber-50/50 dark:bg-amber-900/10">
                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-0.5">Memory Tip</p>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-400">{result.memoryTip}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
